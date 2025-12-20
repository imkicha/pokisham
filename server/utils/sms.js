const admin = require('firebase-admin');

/**
 * Firebase Cloud Messaging (FCM) Notification System for Pokisham
 *
 * Uses Firebase Admin SDK to send push notifications to users
 * Requires: firebase-admin package and Firebase service account credentials
 */

// Initialize Firebase Admin (only once)
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return true;

  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Firebase not configured - missing credentials');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    firebaseInitialized = true;
    console.log('Firebase Admin initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    return false;
  }
};

// Send order confirmation notification
exports.sendOrderConfirmationSMS = async (phone, customerName, orderNumber, totalPrice, fcmToken = null) => {
  try {
    if (!initializeFirebase()) {
      console.log('Firebase not configured - skipping order confirmation notification');
      return { success: false, message: 'Firebase not configured' };
    }

    const shortName = customerName.split(' ')[0];

    const notification = {
      title: '🎉 Order Confirmed!',
      body: `Hi ${shortName}! Your order ${orderNumber} is confirmed. Total: ₹${Math.round(totalPrice)}`,
    };

    const data = {
      type: 'order_confirmation',
      orderNumber: orderNumber,
      totalPrice: String(totalPrice),
      customerName: customerName,
      click_action: '/orders',
    };

    // If FCM token is provided, send to specific device
    if (fcmToken) {
      const message = {
        token: fcmToken,
        notification: notification,
        data: data,
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#ec5578',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Order confirmation notification sent:', response);
      return { success: true, messageId: response };
    }

    // If no token, try sending to topic (users subscribed to order updates)
    const topicMessage = {
      topic: `user_${phone.replace(/\D/g, '').slice(-10)}`,
      notification: notification,
      data: data,
    };

    try {
      const response = await admin.messaging().send(topicMessage);
      console.log('Order confirmation sent to topic:', response);
      return { success: true, messageId: response };
    } catch (topicError) {
      console.log('Topic notification failed (user may not be subscribed):', topicError.message);
      return { success: false, message: 'No FCM token or topic subscription' };
    }
  } catch (error) {
    console.error('Error sending order confirmation notification:', error.message);
    return { success: false, error: error.message };
  }
};

// Send order status update notification
exports.sendOrderStatusSMS = async (phone, customerName, orderNumber, status, fcmToken = null) => {
  try {
    if (!initializeFirebase()) {
      console.log('Firebase not configured - skipping status update notification');
      return { success: false, message: 'Firebase not configured' };
    }

    const shortName = customerName.split(' ')[0];

    // Status-specific notifications
    const statusNotifications = {
      Processing: {
        title: '⏳ Order Processing',
        body: `Hi ${shortName}! Your order ${orderNumber} is being processed.`,
      },
      Shipped: {
        title: '🚚 Order Shipped!',
        body: `Great news ${shortName}! Your order ${orderNumber} has been shipped!`,
      },
      'Out for Delivery': {
        title: '📍 Out for Delivery',
        body: `Hi ${shortName}! Your order ${orderNumber} is out for delivery today!`,
      },
      Delivered: {
        title: '✅ Order Delivered',
        body: `Hi ${shortName}! Your order ${orderNumber} has been delivered. Enjoy!`,
      },
      Cancelled: {
        title: '❌ Order Cancelled',
        body: `Hi ${shortName}, your order ${orderNumber} has been cancelled.`,
      },
    };

    const notification = statusNotifications[status] || {
      title: '📦 Order Update',
      body: `Hi ${shortName}, your order ${orderNumber} status: ${status}`,
    };

    const data = {
      type: 'order_status',
      orderNumber: orderNumber,
      status: status,
      click_action: '/orders',
    };

    if (fcmToken) {
      const message = {
        token: fcmToken,
        notification: notification,
        data: data,
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#ec5578',
            sound: 'default',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Order status notification sent:', response);
      return { success: true, messageId: response };
    }

    // Try topic-based notification
    const topicMessage = {
      topic: `user_${phone.replace(/\D/g, '').slice(-10)}`,
      notification: notification,
      data: data,
    };

    try {
      const response = await admin.messaging().send(topicMessage);
      console.log('Status notification sent to topic:', response);
      return { success: true, messageId: response };
    } catch (topicError) {
      console.log('Topic notification failed:', topicError.message);
      return { success: false, message: 'No FCM token or topic subscription' };
    }
  } catch (error) {
    console.error('Error sending order status notification:', error.message);
    return { success: false, error: error.message };
  }
};

// Generic notification sender
exports.sendSMS = async (phone, message, fcmToken = null) => {
  try {
    if (!initializeFirebase()) {
      console.log('Firebase not configured');
      return { success: false, message: 'Firebase not configured' };
    }

    const notification = {
      title: 'Pokisham',
      body: message,
    };

    if (fcmToken) {
      const fcmMessage = {
        token: fcmToken,
        notification: notification,
        android: {
          priority: 'high',
        },
      };

      const response = await admin.messaging().send(fcmMessage);
      console.log('Notification sent:', response);
      return { success: true, messageId: response };
    }

    // Try topic
    const topicMessage = {
      topic: `user_${phone.replace(/\D/g, '').slice(-10)}`,
      notification: notification,
    };

    try {
      const response = await admin.messaging().send(topicMessage);
      return { success: true, messageId: response };
    } catch (error) {
      return { success: false, message: 'No FCM token or topic subscription' };
    }
  } catch (error) {
    console.error('Error sending notification:', error.message);
    return { success: false, error: error.message };
  }
};

// Send notification to multiple tokens
exports.sendMulticastNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, message: 'Firebase not configured' };
    }

    if (!tokens || tokens.length === 0) {
      return { success: false, message: 'No tokens provided' };
    }

    const message = {
      tokens: tokens,
      notification: {
        title: title,
        body: body,
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#ec5578',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Multicast sent: ${response.successCount} success, ${response.failureCount} failed`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending multicast notification:', error.message);
    return { success: false, error: error.message };
  }
};

// Subscribe user to topic (call this when user logs in)
exports.subscribeToTopic = async (token, topic) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, message: 'Firebase not configured' };
    }

    await admin.messaging().subscribeToTopic(token, topic);
    console.log(`Subscribed to topic: ${topic}`);
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to topic:', error.message);
    return { success: false, error: error.message };
  }
};

// Unsubscribe user from topic
exports.unsubscribeFromTopic = async (token, topic) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, message: 'Firebase not configured' };
    }

    await admin.messaging().unsubscribeFromTopic(token, topic);
    console.log(`Unsubscribed from topic: ${topic}`);
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error.message);
    return { success: false, error: error.message };
  }
};

// Send new order notification to all admins
exports.sendNewOrderNotificationToAdmins = async (adminTokens, customerName, orderNumber, totalPrice) => {
  try {
    if (!initializeFirebase()) {
      console.log('Firebase not configured - skipping admin notification');
      return { success: false, message: 'Firebase not configured' };
    }

    if (!adminTokens || adminTokens.length === 0) {
      console.log('No admin FCM tokens available');
      return { success: false, message: 'No admin tokens' };
    }

    const notification = {
      title: '🛒 New Order Received!',
      body: `${customerName} placed order ${orderNumber} for ₹${Math.round(totalPrice)}`,
    };

    const data = {
      type: 'new_order',
      orderNumber: orderNumber,
      totalPrice: String(totalPrice),
      customerName: customerName,
      click_action: '/admin/orders',
    };

    const message = {
      tokens: adminTokens,
      notification: notification,
      data: data,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#ec5578',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Admin notification sent: ${response.successCount} success, ${response.failureCount} failed`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending admin notification:', error.message);
    return { success: false, error: error.message };
  }
};
