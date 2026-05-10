const express = require('express');
const { body, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { authenticate, requireInstitution } = require('../middleware/auth');
const { calculateDistance, filterByDistance } = require('../utils/location');
const { sendAlertToDonors } = require('../services/notificationService');
const { emitBloodRequestAlert } = require('../services/socketService');
const { geocodeAddress } = require('../utils/geocoding');

const router = express.Router();
const IN_PROGRESS_ALERT_STATUSES = ['ongoing', 'in-process', 'active'];

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
    const institutionAddress = institution?.institutionProfile?.address || {};
    const institutionCoords = institutionAddress.coordinates;

    const {
      bloodType,
      quantity,
      urgency = 'high',
      description,
      ageRequirement,
      location: customLocation
    } = req.body;

    // Use custom location if provided, otherwise use institution location
    let alertLocation = customLocation || null;

    if (!alertLocation) {
      alertLocation = {
        address: [
          institutionAddress.street,
          institutionAddress.city,
          institutionAddress.state,
          institutionAddress.country
        ].filter(Boolean).join(', '),
        coordinates: institutionCoords
      };
    }

    // Geocode if address provided but no coordinates
    if (alertLocation.address && !alertLocation.coordinates) {
      const coords = await geocodeAddress(alertLocation.address);
      if (coords) {
        alertLocation.coordinates = coords;
      }
    }

    if (!alertLocation.coordinates || !alertLocation.coordinates.latitude || !alertLocation.coordinates.longitude) {
      return res.status(400).json({
        message: 'Could not resolve alert location coordinates. Please update institution profile address or provide a complete alert location.'
      });
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
    await findAndNotifyDonors(alert, null, req.app.get('io'));

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

    if (req.user.role === 'donor') {
      query['matchedDonors.donorId'] = req.user._id;
      // Donors should only receive active/in-progress requests unless explicitly filtered.
      if (!status) {
        query.status = { $in: IN_PROGRESS_ALERT_STATUSES };
      }
    }

    if (status) {
      query.status = status === 'active'
        ? { $in: IN_PROGRESS_ALERT_STATUSES }
        : status;
    }
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

    if (!IN_PROGRESS_ALERT_STATUSES.includes(alert.status)) {
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
    await findAndNotifyDonors(alert, newRadius, req.app.get('io'));

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

    if (!IN_PROGRESS_ALERT_STATUSES.includes(alert.status)) {
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

    if (response === 'accepted') {
      alert.status = 'ongoing';
    }

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

    alert.status = 'complete';
    alert.fulfilledBy = req.body.fulfilledBy || null;
    alert.fulfilledAt = new Date();
    await alert.save();

    res.json({
      message: 'Alert marked as complete',
      alert
    });
  } catch (error) {
    console.error('Fulfill alert error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to find and notify matching donors
async function findAndNotifyDonors(alert, radius = null, io = null) {
  let searchRadius = radius || alert.currentRadius;
  const alertCoords = alert.location.coordinates;

  if (!alertCoords || !alertCoords.latitude || !alertCoords.longitude) {
    console.error('Alert location coordinates not available');
    return;
  }

  // Find all active, available donors with matching blood type once,
  // then automatically expand search radius in 500m steps when needed.
  const donors = await User.find({
    role: 'donor',
    isActive: true,
    'donorProfile.isAvailable': true,
    'donorProfile.bloodType': alert.bloodType,
    $or: [
      {
        'donorProfile.age': {
          $gte: alert.ageRequirement.min,
          $lte: alert.ageRequirement.max
        }
      },
      { 'donorProfile.age': { $exists: false } },
      { 'donorProfile.age': null }
    ]
  });

  const donorsWithCoords = donors.filter((donor) => {
    const coords = donor.getCoordinates();
    return coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude);
  });

  const donorsWithoutCoords = donors.filter((donor) => {
    const coords = donor.getCoordinates();
    return !coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude);
  });

  const notifiedDonorIds = alert.matchedDonors.map(m => m.donorId.toString());
  let newDonors = [];

  while (searchRadius <= alert.maxRadius) {
    const nearbyDonors = filterByDistance(donorsWithCoords, alertCoords, searchRadius);
    newDonors = nearbyDonors.filter(d => !notifiedDonorIds.includes(d._id.toString()));

    if (newDonors.length > 0) {
      break;
    }

    const nextRadius = searchRadius + alert.radiusIncrement;
    if (nextRadius > alert.maxRadius) {
      break;
    }

    searchRadius = nextRadius;
  }

  if (newDonors.length === 0) {
    // Fallback: notify eligible donors even when coordinates are missing.
    // This avoids silent misses when profile geocoding failed.
    newDonors = donorsWithoutCoords
      .map((donor) => donor.toObject())
      .filter((donor) => !notifiedDonorIds.includes(donor._id.toString()))
      .map((donor) => ({ ...donor, distance: null }));
  }

  if (alert.currentRadius !== searchRadius) {
    alert.currentRadius = searchRadius;
  }

  if (newDonors.length === 0) {
    await alert.save();
    console.log(`No new donors found up to max radius ${alert.maxRadius}m`);
    return {
      notified: 0,
      notificationResult: { success: true, successCount: 0, failureCount: 0 },
      socketResult: { targeted: 0, deliveredToOnlineSockets: 0 }
    };
  }

  // Add to matched donors
  newDonors.forEach(donor => {
    alert.matchedDonors.push({
      donorId: donor._id,
      distance: typeof donor.distance === 'number' ? donor.distance : null,
      notifiedAt: new Date(),
      status: 'pending'
    });
  });

    if (!IN_PROGRESS_ALERT_STATUSES.includes(alert.status)) {
      alert.status = 'ongoing';
    }

  await alert.save();

  // Send notifications
  const notificationResult = await sendAlertToDonors(newDonors, alert);
  const socketResult = emitBloodRequestAlert(io, {
    entityType: 'alert',
    _id: alert._id,
    bloodType: alert.bloodType,
    quantity: alert.quantity,
    urgency: alert.urgency,
    radiusMeters: searchRadius,
    hospitalName: alert.location?.address || 'Nearby Hospital',
    location: alert.location,
    createdAt: alert.createdAt
  }, newDonors);
  console.log(`Notified ${newDonors.length} donors. Success: ${notificationResult.successCount || 0}`);

  return {
    notified: newDonors.length,
    notificationResult,
    socketResult
  };
}

module.exports = router;
