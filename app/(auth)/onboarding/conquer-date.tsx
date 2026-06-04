import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Fonts, Radius, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { useOnboardingStore } from '@/store/onboardingStore';

const MILESTONE_OPTIONS = [
  { label: '30 Days', value: 30, emoji: '🌱' },
  { label: '60 Days', value: 60, emoji: '🌿' },
  { label: '90 Days', value: 90, emoji: '🌳' },
  { label: '6 Months', value: 180, emoji: '🏆' },
  { label: '1 Year', value: 365, emoji: '👑' },
];

export default function ConquerDate() {
  const insets = useSafeAreaInsets();
  const { setAnswer } = useOnboardingStore();
  const [selected, setSelected] = useState<number | null>(null);

  const handleContinue = () => {
    if (selected) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + selected);
      // Store locally — flushed to Supabase at paywall after account creation
      setAnswer('conquer_date', targetDate.toISOString());
    }
    // Go to paywall — shield setup happens after account is created
    router.replace('/paywall');
  };

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.title}>Set your Conquer Date</Text>
          <Text style={styles.sub}>
            Choose a milestone goal. We'll celebrate with you every step of the way.
          </Text>

          <View style={styles.options}>
            {MILESTONE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, selected === opt.value && styles.optionSelected]}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, selected === opt.value && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <KButton variant="primary" full onPress={handleContinue}>
            {selected ? 'Set My Goal' : 'Skip for Now'}
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
    gap: 24,
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.bgSurface,
  },
  optionSelected: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '18',
  },
  optionEmoji: { fontSize: 20 },
  optionLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.fg2,
  },
  optionLabelSelected: {
    color: Colors.emerald500,
  },
  actions: { gap: 12 },
});
