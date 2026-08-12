import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Returns { granted: boolean, token: string|null }
export async function setupPushNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync();

  let status = existing;
  if (existing === 'undetermined') {
    const { status: requested } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    status = requested;
  }

  if (status !== 'granted') {
    console.log('[Notifications] Permission not granted — status:', status);
    return { granted: false, token: null };
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    console.log('[Notifications] Token:', tokenData.data);
    return { granted: true, token: tokenData.data };
  } catch (err) {
    console.log('[Notifications] getExpoPushTokenAsync error:', err.message ?? err);
    return { granted: true, token: null };
  }
}

export async function sendPushNotification(userId, dogName, alertLevel, alertMessage) {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('push_token, notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (fetchError || !userData?.push_token || !userData?.notifications_enabled) {
      console.log('[PushNotification] No token or notifications disabled, skipping send');
      return;
    }

    const pushToken = userData.push_token;
    const title = `Know Better — ${alertLevel === 'level_2' ? 'Worth mentioning to your vet' : 'Contact your vet today'}`;
    const body = alertMessage.substring(0, 150);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: { type: 'alert', dogName, alertLevel },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      console.error('[PushNotification] Expo API error:', result.errors);
    } else {
      console.log('[PushNotification] Sent successfully to', pushToken);
    }
  } catch (error) {
    console.error('[PushNotification] Error sending:', error.message);
  }
}
