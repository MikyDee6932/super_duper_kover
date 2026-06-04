import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('kover', {
      name: 'Kover',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14A484',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  })).data;

  // Store token in Supabase for server-side push sending
  await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);

  return token;
}

export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning 🌅',
      body: "Your daily lesson is ready. Let's build on yesterday's progress.",
      data: { screen: 'lesson' },
    },
    trigger: {
      hour: 8,
      minute: 0,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    },
  });
}
