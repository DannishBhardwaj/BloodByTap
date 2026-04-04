const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Middleware to check if user is an institution
const requireInstitution = (req, res, next) => {
  if (req.user.role !== 'institution') {
    return res.status(403).json({ message: 'Access denied. Institution role required.' });
  }
  next();
};

// Middleware to check if user is a donor
const requireDonor = (req, res, next) => {
  if (req.user.role !== 'donor') {
    return res.status(403).json({ message: 'Access denied. Donor role required.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireInstitution,
  requireDonor
};
