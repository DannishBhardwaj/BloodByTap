const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geocoding');
const { toGeoJSONPoint } = require('../utils/geojson');
const { upsertDonorFromUser } = require('../services/donorSyncService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (donor or institution)
// @access  Public
const registerHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, profile } = req.body;

    const safeProfile = profile && typeof profile === 'object' ? profile : {};
    const safeAddress = safeProfile.address && typeof safeProfile.address === 'object'
      ? safeProfile.address
      : {};

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Geocode address if provided
    let coordinates = null;
    if (Object.keys(safeAddress).length > 0) {
      const addressString = [
        safeAddress.street,
        safeAddress.city,
        safeAddress.state,
        safeAddress.zipCode,
        safeAddress.country
      ].filter(Boolean).join(', ');

      if (addressString) {
        coordinates = await geocodeAddress(addressString);
      }
    }

    // Create user object
    const userData = {
      email,
      password,
      role
    };

    if (role === 'donor') {
      const point = toGeoJSONPoint(coordinates || safeAddress.coordinates);
      userData.donorProfile = {
        ...safeProfile,
        address: {
          ...safeAddress,
          coordinates: coordinates || safeAddress.coordinates
        },
        location: point || safeProfile.location
      };
    } else {
      const point = toGeoJSONPoint(coordinates || safeAddress.coordinates);
      userData.institutionProfile = {
        ...safeProfile,
        address: {
          ...safeAddress,
          coordinates: coordinates || safeAddress.coordinates
        },
        location: point || safeProfile.location
      };
    }

    const user = new User(userData);
    await user.save();

    if (role === 'donor') {
      await upsertDonorFromUser(user);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['donor', 'institution'])
], registerHandler);

router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['donor', 'institution'])
], registerHandler);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
const loginHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], loginHandler);

router.post('/signin', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], loginHandler);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
