import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { KTabBar } from '@/components/ui/KTabBar';
import { SOSButton } from '@/components/sos/SOSButton';
import { View } from 'react-native';
import { Colors } from '@/constants/colors';

export default function AppLayout() {
  const { user, profile, isInitialized, isLoading: isAuthLoading } = useAuthStore();
  const { isActive, isLoading, load } = useSubscriptionStore();

  useEffect(() => {
    // Wait for auth to finish initializing (and any in-flight sign-in) before
    // making redirect decisions. isLoading covers the anonymous sign-in window
    // so we never redirect while a session is still being established.
    if (!isInitialized || isAuthLoading) return;

    if (!user) {
      if (__DEV__) return; // allow unauthenticated access in dev/emulator builds
      router.replace('/(auth)/welcome');
      return;
    }
    load(user.id);
  }, [isInitialized, isAuthLoading, user?.id]);

  useEffect(() => {
    // Skip subscription gate in dev builds — allows testing without a real purchase
    if (__DEV__) return;
    if (!isLoading && !isActive) {
      router.replace('/paywall');
    }
  }, [isLoading, isActive]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg1 }}>
      <Tabs
        tabBar={(props) => <KTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="discovery" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="lesson" options={{ href: null }} />
        <Tabs.Screen name="journal" options={{ href: null }} />
      </Tabs>
      <SOSButton />
    </View>
  );
}
