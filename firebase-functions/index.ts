import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const BUZZER_CHANNEL_ID = 'waterguard_buzzer';

/**
 * Cloud Function triggered on newly created documents in the /alerts collection.
 * Delivers push notifications to authorized administrators based on their alarmSettings.
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
        .where('role', 'in', ['ADMIN', 'admin'])
        .get();

      if (adminSnapshot.empty) {
        console.warn('No authorized admin accounts registered to receive push notification.');
        return;
      }

      for (const adminDoc of adminSnapshot.docs) {
        const adminData = adminDoc.data();
        const adminId = adminDoc.id;

        // Check Admin's Alarm Settings
        const settingsSnap = await db.collection('alarmSettings').doc(adminId).get();
        const settings = settingsSnap.exists ? settingsSnap.data() : { autoPushEnabled: true, soundEnabled: true };

        if (settings && settings.autoPushEnabled === false) {
          console.log(`Auto push disabled by admin ${adminId}. Skipping notification.`);
          continue;
        }

        const token = adminData.fcmToken || adminData.expoPushToken;
        if (!token) continue;

        // Dispatch FCM message
        const message: admin.messaging.Message = {
          token,
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
          },
          android: {
            priority: 'high',
            notification: {
              channelId: BUZZER_CHANNEL_ID,
              sound: 'alarm.wav',
              priority: 'max',
              visibility: 'public',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'alarm.caf',
                badge: 1,
                critical: severity === 'CRITICAL',
              },
            },
          },
        };

        try {
          await admin.messaging().send(message);
          console.log(`[FCM] Notification sent to admin ${adminId}`);
        } catch (pushErr: any) {
          console.warn(`[FCM] Error sending to admin ${adminId}:`, pushErr.message);
        }
      }
    } catch (err) {
      console.error('Error dispatching admin push notifications:', err);
    }
  });

/**
 * Cloud Function triggered when an Admin forwards an alert to selected users.
 * Dispatches emergency buzzer push notifications to all recipients in notificationRecipients.
 */
export const onForwardNotificationCreated = functions.firestore
  .document('notificationForwards/{forwardId}')
  .onCreate(async (snapshot, context) => {
    const forwardData = snapshot.data();
    if (!forwardData) return;

    const forwardId = context.params.forwardId;
    const { alertId, message, adminEmail } = forwardData;

    console.log(`[FORWARD DISPATCH] Admin ${adminEmail} forwarded alert ${alertId} (Forward ID: ${forwardId})`);

    try {
      const recSnap = await db
        .collection('notificationRecipients')
        .where('forwardId', '==', forwardId)
        .get();

      if (recSnap.empty) {
        console.warn(`No recipients found for forward ${forwardId}`);
        return;
      }

      for (const rDoc of recSnap.docs) {
        const rData = rDoc.data();
        const userId = rData.userId;

        // Retrieve user push token
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) continue;

        const userData = userDoc.data();
        const token = userData?.fcmToken || userData?.expoPushToken;

        if (token) {
          const pushMessage: admin.messaging.Message = {
            token,
            notification: {
              title: '🚨 EMERGENCY WATER LEAK ALARM',
              body: message || 'Urgent: Water leakage verified by Admin. Inspect field valve now.',
            },
            data: {
              forwardId: String(forwardId),
              alertId: String(alertId),
              type: 'EMERGENCY_ALARM',
            },
            android: {
              priority: 'high',
              notification: {
                channelId: BUZZER_CHANNEL_ID,
                sound: 'alarm.wav',
                priority: 'max',
                visibility: 'public',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'alarm.caf',
                  badge: 1,
                  critical: true,
                },
              },
            },
          };

          try {
            await admin.messaging().send(pushMessage);
            await rDoc.ref.update({
              status: 'DELIVERED',
              deliveredAt: Date.now(),
            });
            console.log(`[FORWARD] Delivered buzzer alarm to user ${userId}`);
          } catch (err: any) {
            console.warn(`[FORWARD] Push failed for user ${userId}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error processing forward notification:', err);
    }
  });
