const { authenticate, requireInstitution, requireDonor } = require('./auth');

module.exports = {
  authMiddleware: authenticate,
  requireInstitution,
  requireDonor
};
