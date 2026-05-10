const initializeFirebase = () => {
  // Deprecated: Firebase notifications have been replaced by Socket.io events.
  return true;
};

/**
 * Legacy no-op notification function retained for backward compatibility.
 * Socket.io real-time events are now used for active sessions.
 * @param {String} fcmToken - Legacy token argument
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 */
const sendNotification = async (fcmToken, notification, data = {}) => {
  if (!fcmToken) {
    return { success: false, error: 'Legacy token missing' };
  }

  return {
    success: true,
    message: 'Notification fallback is a no-op in Socket.io mode',
    notification,
    data
  };
};

/**
 * Legacy bulk no-op notification function retained for compatibility.
 * @param {Array<String>} fcmTokens - Legacy token list
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 */
const sendBulkNotifications = async (fcmTokens, notification, data = {}) => {
  if (!fcmTokens || fcmTokens.length === 0) {
    return { success: false, error: 'No tokens provided' };
  }

  const validTokens = fcmTokens.filter(token => token && token.trim() !== '');
  
  if (validTokens.length === 0) {
    return { success: false, error: 'No valid tokens provided' };
  }

  return {
    success: true,
    successCount: validTokens.length,
    failureCount: 0,
    message: 'Bulk notification fallback is a no-op in Socket.io mode',
    notification,
    data
  };
};

/**
 * Send emergency alert notification to donors
 * @param {Array} donors - Array of donor user objects
 * @param {Object} alert - Alert object
 */
const sendAlertToDonors = async (donors, alert) => {
  const fcmTokens = donors
    .map(donor => donor.donorProfile?.fcmToken)
    .filter(token => token);

  const notification = {
    title: '🚨 Emergency Blood Donation Needed',
    body: `Blood type ${alert.bloodType} urgently needed at ${alert.location.address || 'nearby location'}. Your help can save a life!`
  };

  const data = {
    type: 'alert',
    alertId: alert._id.toString(),
    bloodType: alert.bloodType,
    urgency: alert.urgency,
    location: JSON.stringify(alert.location)
  };

  return await sendBulkNotifications(fcmTokens, notification, data);
};

/**
 * Send emergency notification to institutions
 * @param {Array} institutions - Array of institution user objects
 * @param {Object} emergency - Emergency object
 */
const sendEmergencyToInstitutions = async (institutions, emergency) => {
  const fcmTokens = institutions
    .map(inst => inst.institutionProfile?.fcmToken)
    .filter(token => token);

  const notification = {
    title: '🚨 Road Emergency Reported',
    body: `Blood type ${emergency.bloodType} needed at ${emergency.location.address || 'reported location'}. Please respond if you can help.`
  };

  const data = {
    type: 'emergency',
    emergencyId: emergency._id.toString(),
    bloodType: emergency.bloodType,
    urgency: emergency.urgency,
    location: JSON.stringify(emergency.location)
  };

  return await sendBulkNotifications(fcmTokens, notification, data);
};

module.exports = {
  sendNotification,
  sendBulkNotifications,
  sendAlertToDonors,
  sendEmergencyToInstitutions,
  initializeFirebase
};
