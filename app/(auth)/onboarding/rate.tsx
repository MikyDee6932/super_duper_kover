import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';

export default function Rate() {
  const insets = useSafeAreaInsets();

  const handleRate = async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
    router.replace('/(auth)/onboarding/conquer-date');
  };

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.content}>
          <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
          <Text style={styles.title}>Enjoying Kover?</Text>
          <Text style={styles.sub}>
            Your review helps others find the freedom they're looking for. It takes 5 seconds and means the world.
          </Text>
        </View>

        <View style={styles.actions}>
          <KButton variant="primary" full onPress={handleRate}>
            Rate Kover on the App Store
          </KButton>
          <KButton variant="text" full onPress={() => router.replace('/(auth)/onboarding/conquer-date')}>
            Maybe Later
          </KButton>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  stars: { fontSize: 48, letterSpacing: 4 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.fg1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.fg3,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: { gap: 12 },
});
