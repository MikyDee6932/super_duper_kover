import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Newsreader_300Light,
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium_Italic,
} from '@expo-google-fonts/newsreader';
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useAuthStore } from '@/store/authStore';
import { initializePurchases, linkRevenueCatUser } from '@/lib/purchases';
import { registerForPushNotifications } from '@/lib/notifications';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Newsreader_300Light,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium_Italic,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    initialize();
    // Initialize RevenueCat immediately on startup — before any account exists.
    // RC auto-generates an anonymous $RCAnonymousID for new users.
    initializePurchases();
  }, []);

  useEffect(() => {
    if (user) {
      // Link RC's purchase record to the Supabase user ID (anonymous or named).
      linkRevenueCatUser(user.id);
      registerForPushNotifications(user.id).catch(() => {});
    }
  }, [user?.id]);

  // Hold a forest-colored splash while fonts load
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bgApp }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
