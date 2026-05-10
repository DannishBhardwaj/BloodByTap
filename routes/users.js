const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireDonor, requireInstitution } = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geocoding');
const { toGeoJSONPoint } = require('../utils/geojson');
const { upsertDonorFromUser } = require('../services/donorSyncService');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { profile } = req.body;

    // Geocode address if provided
    let coordinates = null;
    if (profile?.address) {
      const addressString = [
        profile.address.street,
        profile.address.city,
        profile.address.state,
        profile.address.zipCode,
        profile.address.country
      ].filter(Boolean).join(', ');

      if (addressString) {
        coordinates = await geocodeAddress(addressString);
      }
    }

    if (user.role === 'donor') {
      const point = toGeoJSONPoint(coordinates || profile.address?.coordinates || user.donorProfile?.address?.coordinates);
      user.donorProfile = {
        ...user.donorProfile.toObject(),
        ...profile,
        address: {
          ...user.donorProfile.address,
          ...profile.address,
          coordinates: coordinates || profile.address?.coordinates || user.donorProfile.address?.coordinates
        },
        location: point || user.donorProfile?.location
      };

      await upsertDonorFromUser(user);
    } else {
      const point = toGeoJSONPoint(coordinates || profile.address?.coordinates || user.institutionProfile?.address?.coordinates);
      user.institutionProfile = {
        ...user.institutionProfile.toObject(),
        ...profile,
        address: {
          ...user.institutionProfile.address,
          ...profile.address,
          coordinates: coordinates || profile.address?.coordinates || user.institutionProfile.address?.coordinates
        },
        location: point || user.institutionProfile?.location
      };
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/socket-registration
// @desc    Optional endpoint to mark websocket preference on profile metadata
// @access  Private
const updateSocketRegistration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const socketEnabled = typeof req.body.socketEnabled === 'boolean'
      ? req.body.socketEnabled
      : Boolean(req.body.fcmToken);
    const user = await User.findById(req.user._id);

    if (user.role === 'donor') {
      user.donorProfile.socketEnabled = socketEnabled;
    } else {
      user.institutionProfile.socketEnabled = socketEnabled;
    }

    await user.save();
    res.json({ message: 'Socket registration preference updated successfully' });
  } catch (error) {
    console.error('Update socket registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

router.put('/socket-registration', authenticate, [
  body('socketEnabled').isBoolean()
], updateSocketRegistration);

router.put('/fcm-token', authenticate, [
  body('fcmToken').notEmpty()
], updateSocketRegistration);

// @route   PUT /api/users/availability
// @desc    Update donor availability status
// @access  Private (Donor only)
router.put('/availability', authenticate, requireDonor, [
  body('isAvailable').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isAvailable } = req.body;
    const user = await User.findById(req.user._id);
    
    user.donorProfile.isAvailable = isAvailable;
    await user.save();
    await upsertDonorFromUser(user);

    res.json({ 
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      isAvailable 
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/donors/nearby
// @desc    Get nearby donors (for testing/admin purposes)
// @access  Private (Institution only)
router.get('/donors/nearby', authenticate, requireInstitution, async (req, res) => {
  try {
    const { latitude, longitude, radius = 2000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const center = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const maxRadius = parseInt(radius);

    // Find all active donors
    const donors = await User.find({
      role: 'donor',
      isActive: true,
      'donorProfile.isAvailable': true
    });

    // Filter by distance
    const { filterByDistance } = require('../utils/location');
    const nearbyDonors = filterByDistance(donors, center, maxRadius);

    res.json({
      count: nearbyDonors.length,
      donors: nearbyDonors.map(d => ({
        id: d._id,
        bloodType: d.donorProfile.bloodType,
        age: d.donorProfile.age,
        distance: d.distance,
        address: d.donorProfile.address
      }))
    });
  } catch (error) {
    console.error('Get nearby donors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
