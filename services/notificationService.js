const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.warn('Firebase credentials not fully configured. Push notifications will be disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized');
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
};

// Initialize Firebase on module load
initializeFirebase();

/**
 * Send push notification to a single user
 * @param {String} fcmToken - Firebase Cloud Messaging token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 */
const sendNotification = async (fcmToken, notification, data = {}) => {
  if (!firebaseInitialized || !fcmToken) {
    return { success: false, error: 'Firebase not initialized or token missing' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {})
      },
      android: {
        priority: 'high'
      },
      apns: {
        headers: {
          'apns-priority': '10'
        }
      }
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notifications to multiple users
 * @param {Array<String>} fcmTokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 */
const sendBulkNotifications = async (fcmTokens, notification, data = {}) => {
  if (!firebaseInitialized || !fcmTokens || fcmTokens.length === 0) {
    return { success: false, error: 'Firebase not initialized or no tokens provided' };
  }

  // Filter out invalid tokens
  const validTokens = fcmTokens.filter(token => token && token.trim() !== '');
  
  if (validTokens.length === 0) {
    return { success: false, error: 'No valid tokens provided' };
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {})
      },
      android: {
        priority: 'high'
      },
      apns: {
        headers: {
          'apns-priority': '10'
        }
      },
      tokens: validTokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    return {
      success: response.failureCount === 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('Error sending bulk notifications:', error.message);
    return { success: false, error: error.message };
  }
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
