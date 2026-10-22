import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function triggered on newly created documents in the /alerts collection.
 * Securely delivers Apple APNs / FCM push notifications to registered administrators.
 */
export const onAlertCreated = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    const alertData = snapshot.data();
    if (!alertData) return;

    const alertId = context.params.alertId;
    const { title, explanation, severity, inletFlow, outletFlow, flowDifference } = alertData;

    console.log(`[ALERT DISPATCH] New ${severity} alert received: ${alertId} - ${title}`);

    try {
      // 1. Fetch authorized admin devices
      const adminSnapshot = await db
        .collection('admins')
        .where('role', '==', 'admin')
        .get();

      if (adminSnapshot.empty) {
        console.warn('No authorized admin accounts registered to receive push notification.');
        return;
      }

      const tokens: string[] = [];
      adminSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken && typeof data.fcmToken === 'string') {
          tokens.push(data.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log('No valid FCM tokens found for registered admins.');
        return;
      }

      // 2. Format Push Notification Payload
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: `⚠️ ${title}`,
          body: `${explanation} (Loss: +${Number(flowDifference).toFixed(1)} L/min)`,
        },
        data: {
          alertId: String(alertId),
          severity: String(severity),
          inlet: String(inletFlow),
          outlet: String(outletFlow),
          diff: String(flowDifference),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        apns: {
          payload: {
            aps: {
              sound: 'alarm.caf', // Uses bundled alert sound on iOS
              badge: 1,
              critical: severity === 'CRITICAL',
            },
          },
        },
      };

      // 3. Dispatch multicast notification via Firebase Admin Messaging
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Push notifications dispatched: ${response.successCount} succeeded, ${response.failureCount} failed.`);
    } catch (err) {
      console.error('Error dispatching push notifications:', err);
    }
  });
