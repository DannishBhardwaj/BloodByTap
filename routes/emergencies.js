const express = require('express');
const { body, validationResult } = require('express-validator');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { filterByDistance } = require('../utils/location');
const { sendEmergencyToInstitutions } = require('../services/notificationService');
const { geocodeAddress } = require('../utils/geocoding');

const router = express.Router();

// @route   POST /api/emergencies
// @desc    Report a road emergency
// @access  Private
router.post('/', authenticate, [
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('quantity').isInt({ min: 1 }),
  body('location').isObject(),
  body('location.coordinates').optional().isObject(),
  body('location.address').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      bloodType,
      quantity,
      urgency = 'critical',
      description,
      location
    } = req.body;

    let emergencyLocation = { ...location };

    // Geocode address if coordinates not provided
    if (!emergencyLocation.coordinates && emergencyLocation.address) {
      const coords = await geocodeAddress(emergencyLocation.address);
      if (coords) {
        emergencyLocation.coordinates = coords;
      } else {
        return res.status(400).json({ 
          message: 'Could not geocode address. Please provide coordinates.' 
        });
      }
    }

    if (!emergencyLocation.coordinates || !emergencyLocation.coordinates.latitude) {
      return res.status(400).json({ 
        message: 'Location coordinates are required' 
      });
    }

    // Create emergency
    const emergency = new Emergency({
      reportedBy: req.user._id,
      bloodType,
      quantity,
      urgency,
      description,
      location: emergencyLocation
    });

    await emergency.save();

    // Find and notify nearby institutions
    await findAndNotifyInstitutions(emergency);

    res.status(201).json({
      message: 'Emergency reported successfully. Nearby institutions have been notified.',
      emergency
    });
  } catch (error) {
    console.error('Report emergency error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/emergencies
// @desc    Get all emergencies (with optional filters)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, reportedBy } = req.query;
    const query = {};

    if (status) query.status = status;
    if (reportedBy) query.reportedBy = reportedBy;

    const emergencies = await Emergency.find(query)
      .populate('reportedBy', 'email role')
      .populate('notifiedInstitutions.institutionId', 'institutionProfile.name institutionProfile.address')
      .sort({ createdAt: -1 });

    res.json({ emergencies });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/emergencies/:id
// @desc    Get emergency by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('reportedBy', 'email role')
      .populate('notifiedInstitutions.institutionId', 'institutionProfile.name institutionProfile.address')
      .populate('acknowledgedBy', 'institutionProfile.name');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    res.json({ emergency });
  } catch (error) {
    console.error('Get emergency error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/emergencies/:id/acknowledge
// @desc    Institution acknowledges an emergency
// @access  Private (Institution only)
router.post('/:id/acknowledge', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'institution') {
      return res.status(403).json({ message: 'Only institutions can acknowledge emergencies' });
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    if (emergency.status !== 'pending') {
      return res.status(400).json({ message: 'Emergency is not pending' });
    }

    // Check if institution was notified
    const notification = emergency.notifiedInstitutions.find(
      notif => notif.institutionId.toString() === req.user._id.toString()
    );

    if (!notification) {
      return res.status(403).json({ message: 'You were not notified about this emergency' });
    }

    // Update notification status
    notification.status = 'acknowledged';
    notification.respondedAt = new Date();

    // Update emergency status
    emergency.status = 'acknowledged';
    emergency.acknowledgedBy = req.user._id;
    emergency.acknowledgedAt = new Date();

    await emergency.save();

    res.json({
      message: 'Emergency acknowledged successfully',
      emergency
    });
  } catch (error) {
    console.error('Acknowledge emergency error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/emergencies/:id/handle
// @desc    Mark emergency as handled
// @access  Private (Institution only)
router.put('/:id/handle', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'institution') {
      return res.status(403).json({ message: 'Only institutions can mark emergencies as handled' });
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    if (emergency.acknowledgedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You must acknowledge the emergency first' });
    }

    emergency.status = 'handled';
    await emergency.save();

    res.json({
      message: 'Emergency marked as handled',
      emergency
    });
  } catch (error) {
    console.error('Handle emergency error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to find and notify nearby institutions
async function findAndNotifyInstitutions(emergency) {
  const emergencyCoords = emergency.location.coordinates;
  const searchRadius = 5000; // 5KM radius for emergencies

  if (!emergencyCoords || !emergencyCoords.latitude || !emergencyCoords.longitude) {
    console.error('Emergency location coordinates not available');
    return;
  }

  // Find all active institutions
  const institutions = await User.find({
    role: 'institution',
    isActive: true
  });

  // Filter by distance
  const nearbyInstitutions = filterByDistance(institutions, emergencyCoords, searchRadius);

  if (nearbyInstitutions.length === 0) {
    console.log(`No institutions found within ${searchRadius}m radius`);
    return;
  }

  // Add to notified institutions
  nearbyInstitutions.forEach(inst => {
    emergency.notifiedInstitutions.push({
      institutionId: inst._id,
      distance: inst.distance,
      notifiedAt: new Date(),
      status: 'pending'
    });
  });

  await emergency.save();

  // Send notifications
  const notificationResult = await sendEmergencyToInstitutions(nearbyInstitutions, emergency);
  console.log(`Notified ${nearbyInstitutions.length} institutions. Success: ${notificationResult.successCount || 0}`);

  return {
    notified: nearbyInstitutions.length,
    notificationResult
  };
}

module.exports = router;
