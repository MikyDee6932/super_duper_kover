import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';

export default function Index() {
  const { isInitialized, isLoading, user, profile } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!user) {
      // No account yet — send to welcome so they can start the quiz
      router.replace('/(auth)/welcome');
    } else if (!profile?.onboarding_completed) {
      // Signed in but never finished onboarding (edge case: web/admin created account)
      router.replace('/(auth)/onboarding/1');
    } else if (!profile?.shield_activated) {
      router.replace('/(auth)/onboarding/shield');
    } else {
      router.replace('/(app)/home');
    }
  }, [isInitialized, isLoading, user, profile]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgApp, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.emerald500} size="large" />
    </View>
  );
}
