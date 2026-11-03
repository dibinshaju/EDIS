import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { AppUser } from '../types/auth';
import { updateUserPushToken } from './firebase';

export const BUZZER_CHANNEL_ID = 'waterguard_buzzer';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configure Android notification channels for emergency buzzer
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(BUZZER_CHANNEL_ID, {
      name: 'WaterGuard Emergency Buzzer',
      description: 'High-priority emergency alerts with custom buzzer sound for pipe leaks',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alarm.wav',
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#EF4444',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
}

/**
 * Register device for push notifications and save token
 */
export async function registerForPushNotificationsAsync(
  user?: AppUser | null
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  await setupNotificationChannels();

  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for Push Notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permission not granted for push notifications.');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;
    console.log('[Push] Expo push token obtained:', token);

    if (user && token) {
      await updateUserPushToken(user, token);
    }

    return token;
  } catch (err) {
    console.warn('[Push] Error acquiring push token:', err);
    return null;
  }
}

/**
 * Trigger immediate local buzzer notification (used for tests or when app receives alert)
 */
export async function triggerLocalBuzzerNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    await setupNotificationChannels();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'alarm.wav',
        data,
        color: '#EF4444',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 200, 500, 200, 500],
      },
      trigger: null, // send immediately
    });
  } catch (err) {
    console.warn('[Push] Failed to schedule local buzzer notification:', err);
  }
}

let soundObject: Audio.Sound | null = null;

/**
 * Play high-priority buzzer audio using expo-av
 */
export async function playAlarmWav(): Promise<void> {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }

    // Configure audio mode for alerts
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/alarm.wav'),
      { shouldPlay: true, isLooping: false, volume: 1.0 }
    );
    soundObject = sound;
  } catch (err) {
    console.warn('[Audio] Failed to play bundled alarm.wav:', err);
  }
}

/**
 * Stop alarm audio
 */
export async function stopAlarmWav(): Promise<void> {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }
  } catch (err) {
    console.warn('[Audio] Error stopping alarm.wav:', err);
  }
}
