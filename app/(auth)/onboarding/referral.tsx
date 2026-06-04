import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Referral() {
  const insets = useSafeAreaInsets();
  const { setAnswer } = useOnboardingStore();
  const [code, setCode] = useState('');

  const handleApply = () => {
    if (code.trim()) {
      // Store locally — will be written to Supabase when account is created at paywall
      setAnswer('referral_code_used', code.trim().toUpperCase());
    }
    router.replace('/(auth)/onboarding/rate');
  };

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🤝</Text>
          <Text style={styles.title}>Have a referral code?</Text>
          <Text style={styles.sub}>
            If a friend invited you to Kover, enter their code and you both get rewarded.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. FREEDOM2024"
            placeholderTextColor={Colors.fg4}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={20}
          />
        </View>

        <View style={styles.actions}>
          <KButton variant="primary" full onPress={handleApply}>
            {code.trim() ? 'Apply Code' : 'Skip'}
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
    gap: 20,
    alignItems: 'center',
  },
  emoji: { fontSize: 56 },
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
  input: {
    fontFamily: Fonts.sansBold,
    width: '100%',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    color: Colors.fg1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: 8,
  },
  actions: { gap: 12 },
});
