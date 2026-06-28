import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

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
