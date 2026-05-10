const express = require('express');
const { body } = require('express-validator');
const { authMiddleware, requireInstitution } = require('../middleware/authMiddleware');
const { createBloodRequest } = require('../controllers/bloodRequestController');

const router = express.Router();

router.post('/request-blood', authMiddleware, requireInstitution, [
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('quantity').isInt({ min: 1 }),
  body('urgency').optional().isIn(['critical', 'high', 'medium']),
  body('radiusMeters').optional().isInt({ min: 500, max: 50000 }),
  body('location').optional().isObject()
], createBloodRequest);

module.exports = router;
