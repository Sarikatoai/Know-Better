import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function setupPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('[Notifications] Permission denied');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    console.log('[Notifications] Token:', tokenData.data);
    return tokenData.data;
  } catch (err) {
    console.log('[Notifications] getExpoPushTokenAsync error:', err.message ?? err);
    return null;
  }
}
