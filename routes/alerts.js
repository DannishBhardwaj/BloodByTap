const express = require('express');
const { body, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { authenticate, requireInstitution } = require('../middleware/auth');
const { calculateDistance, filterByDistance } = require('../utils/location');
const { sendAlertToDonors } = require('../services/notificationService');
const { geocodeAddress } = require('../utils/geocoding');

const router = express.Router();

// @route   POST /api/alerts
// @desc    Create a new alert
// @access  Private (Institution only)
router.post('/', authenticate, requireInstitution, [
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('quantity').isInt({ min: 1 }),
  body('urgency').optional().isIn(['critical', 'high', 'medium'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const institution = await User.findById(req.user._id);
    const institutionCoords = institution.institutionProfile.address.coordinates;

    if (!institutionCoords || !institutionCoords.latitude || !institutionCoords.longitude) {
      return res.status(400).json({ message: 'Institution location not set. Please update your profile with address.' });
    }

    const {
      bloodType,
      quantity,
      urgency = 'high',
      description,
      ageRequirement,
      location: customLocation
    } = req.body;

    // Use custom location if provided, otherwise use institution location
    let alertLocation = customLocation || {
      address: institution.institutionProfile.address.street + ', ' + 
               institution.institutionProfile.address.city,
      coordinates: institutionCoords
    };

    // Geocode if address provided but no coordinates
    if (alertLocation.address && !alertLocation.coordinates) {
      const coords = await geocodeAddress(alertLocation.address);
      if (coords) {
        alertLocation.coordinates = coords;
      }
    }

    // Create alert
    const alert = new Alert({
      institutionId: institution._id,
      bloodType,
      quantity,
      urgency,
      description,
      ageRequirement: ageRequirement || { min: 18, max: 65 },
      location: alertLocation,
      currentRadius: 2000, // Start with 2KM
      maxRadius: 5000, // Max 5KM
      radiusIncrement: 500 // Increment by 500m
    });

    await alert.save();

    // Find and notify matching donors
    await findAndNotifyDonors(alert);

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/alerts
// @desc    Get all alerts (with optional filters)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, institutionId, bloodType } = req.query;
    const query = {};

    if (status) query.status = status;
    if (institutionId) query.institutionId = institutionId;
    if (bloodType) query.bloodType = bloodType;

    const alerts = await Alert.find(query)
      .populate('institutionId', 'institutionProfile.name institutionProfile.address')
      .sort({ createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/alerts/:id
// @desc    Get alert by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('institutionId', 'institutionProfile.name institutionProfile.address')
      .populate('matchedDonors.donorId', 'donorProfile.bloodType donorProfile.age donorProfile.address');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ alert });
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/alerts/:id/expand-radius
// @desc    Expand alert radius if no matches found
// @access  Private (Institution only)
router.post('/:id/expand-radius', authenticate, requireInstitution, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.institutionId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this alert' });
    }

    if (alert.status !== 'active') {
      return res.status(400).json({ message: 'Alert is not active' });
    }

    // Expand radius
    const newRadius = alert.currentRadius + alert.radiusIncrement;
    
    if (newRadius > alert.maxRadius) {
      return res.status(400).json({ 
        message: 'Maximum radius reached. No more donors found within 5KM radius.' 
      });
    }

    alert.currentRadius = newRadius;
    await alert.save();

    // Try to find more donors with expanded radius
    await findAndNotifyDonors(alert, newRadius);

    res.json({
      message: `Radius expanded to ${newRadius}m`,
      alert
    });
  } catch (error) {
    console.error('Expand radius error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/alerts/:id/respond
// @desc    Donor responds to an alert
// @access  Private (Donor only)
router.post('/:id/respond', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can respond to alerts' });
    }

    const { response } = req.body; // 'accepted' or 'rejected'
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.status !== 'active') {
      return res.status(400).json({ message: 'Alert is not active' });
    }

    // Find donor in matched donors
    const donorMatch = alert.matchedDonors.find(
      match => match.donorId.toString() === req.user._id.toString()
    );

    if (!donorMatch) {
      return res.status(404).json({ message: 'You were not notified about this alert' });
    }

    donorMatch.status = response;
    donorMatch.respondedAt = new Date();
    await alert.save();

    res.json({
      message: `Response recorded: ${response}`,
      alert
    });
  } catch (error) {
    console.error('Respond to alert error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/alerts/:id/fulfill
// @desc    Mark alert as fulfilled
// @access  Private (Institution only)
router.put('/:id/fulfill', authenticate, requireInstitution, [
  body('fulfilledBy').optional().isMongoId()
], async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.institutionId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this alert' });
    }

    alert.status = 'fulfilled';
    alert.fulfilledBy = req.body.fulfilledBy || null;
    alert.fulfilledAt = new Date();
    await alert.save();

    res.json({
      message: 'Alert marked as fulfilled',
      alert
    });
  } catch (error) {
    console.error('Fulfill alert error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to find and notify matching donors
async function findAndNotifyDonors(alert, radius = null) {
  const searchRadius = radius || alert.currentRadius;
  const alertCoords = alert.location.coordinates;

  if (!alertCoords || !alertCoords.latitude || !alertCoords.longitude) {
    console.error('Alert location coordinates not available');
    return;
  }

  // Find all active, available donors with matching blood type
  const donors = await User.find({
    role: 'donor',
    isActive: true,
    'donorProfile.isAvailable': true,
    'donorProfile.bloodType': alert.bloodType,
    'donorProfile.age': {
      $gte: alert.ageRequirement.min,
      $lte: alert.ageRequirement.max
    }
  });

  // Filter by distance
  const nearbyDonors = filterByDistance(donors, alertCoords, searchRadius);

  // Filter out donors already notified
  const notifiedDonorIds = alert.matchedDonors.map(m => m.donorId.toString());
  const newDonors = nearbyDonors.filter(d => !notifiedDonorIds.includes(d._id.toString()));

  if (newDonors.length === 0) {
    console.log(`No new donors found within ${searchRadius}m radius`);
    return;
  }

  // Add to matched donors
  newDonors.forEach(donor => {
    alert.matchedDonors.push({
      donorId: donor._id,
      distance: donor.distance,
      notifiedAt: new Date(),
      status: 'pending'
    });
  });

  await alert.save();

  // Send notifications
  const notificationResult = await sendAlertToDonors(newDonors, alert);
  console.log(`Notified ${newDonors.length} donors. Success: ${notificationResult.successCount || 0}`);

  return {
    notified: newDonors.length,
    notificationResult
  };
}

module.exports = router;
