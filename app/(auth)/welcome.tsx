import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';

export default function Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={BgGradient.colors}
      locations={BgGradient.locations}
      style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
    >
      {/* Logo — centered, fills upper half */}
      <View style={styles.logoWrap}>
        <Text style={styles.welcomeTo}>Welcome to</Text>
        <Image
          source={require('../../assets/logo-wordmark-cream.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Hero copy */}
      <View style={styles.heroBlock}>
        <Text style={styles.headline}>
          Get protected &amp; take back control.
        </Text>
        <Text style={styles.sub}>
          A faith-focused and science-backed porn recovery solution — to not just survive, but thrive.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.actions}>
        <KButton variant="primary" full onPress={() => router.push('/(auth)/onboarding/1')}>
          Start Quiz
        </KButton>
        <KButton variant="text" full onPress={() => router.push('/(auth)/login')}>
          I already have an account
        </KButton>
      </View>

      {/* Privacy footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🔒 Your data is private &amp; never sold.</Text>
        <Text style={styles.footerSub}>hello@getkover.com</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.s5,
    justifyContent: 'space-between',
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.s7,
  },
  welcomeTo: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    fontWeight: '500',
    color: Colors.cream50,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 10,
  },
  logo: {
    width: '70%',
    maxWidth: 260,
    height: 80,
  },
  heroBlock: {
    paddingHorizontal: Spacing.s3,
    gap: 12,
    marginBottom: Spacing.s7,
  },
  headline: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    fontWeight: '500',
    color: Colors.cream50,
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.fg2,
    lineHeight: 23,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginBottom: Spacing.s5,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: Spacing.s3,
  },
  footerText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg3,
  },
  footerSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg4,
  },
});
