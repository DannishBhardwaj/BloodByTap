const express = require('express');
const { body, query } = require('express-validator');
const { authMiddleware, requireInstitution, requireDonor } = require('../middleware/authMiddleware');
const {
  createBloodRequest,
  listBloodRequests,
  respondToBloodRequest,
  completeBloodRequest
} = require('../controllers/bloodRequestController');
const { findNearbyDonors } = require('../controllers/donorController');

const router = express.Router();

router.get('/', authMiddleware, listBloodRequests);

router.get('/nearby-donors', authMiddleware, requireInstitution, [
  query('latitude').isFloat(),
  query('longitude').isFloat(),
  query('radius').optional().isInt({ min: 1 }),
  query('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
], findNearbyDonors);

// Sensitive route protected by JWT auth middleware.
router.post('/request-blood', authMiddleware, requireInstitution, [
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('quantity').isInt({ min: 1 }),
  body('urgency').optional().isIn(['critical', 'high', 'medium']),
  body('radiusMeters').optional().isInt({ min: 500, max: 50000 }),
  body('location').optional().isObject()
], createBloodRequest);

router.post('/:id/respond', authMiddleware, requireDonor, [
  body('response').isIn(['accepted', 'rejected'])
], respondToBloodRequest);

router.put('/:id/complete', authMiddleware, requireInstitution, [
  body('fulfilledBy').optional().isMongoId()
], completeBloodRequest);

module.exports = router;
