import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { ONBOARDING_STEPS, OnboardingStep } from '@/constants/onboardingSteps';
import { useOnboardingStore } from '@/store/onboardingStore';

const TOTAL_STEPS = ONBOARDING_STEPS.length;

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${(current / total) * 100}%` }]} />
    </View>
  );
}

export default function OnboardingStepScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNum = parseInt(step ?? '1', 10);
  const insets = useSafeAreaInsets();
  const { setAnswer } = useOnboardingStore();

  const stepDef = ONBOARDING_STEPS[stepNum - 1] as OnboardingStep | undefined;

  const [selected, setSelected] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!stepDef) return null;

  const isCelebration = stepDef.type === 'celebration';
  const isSingle = stepDef.type === 'single';
  const isMulti = stepDef.type === 'multi';
  const isText = stepDef.type === 'text' || stepDef.type === 'number';

  /** Navigate to the next step or finish onboarding */
  const goNext = () => {
    const nextStep = stepNum + 1;
    if (nextStep > TOTAL_STEPS) {
      // Quiz complete → Problem educational arc → Solution arc → Paywall
      router.replace('/(auth)/onboarding/problem');
    } else {
      router.push(`/(auth)/onboarding/${nextStep}`);
    }
  };

  /**
   * Single-choice: called immediately on tap with the chosen value.
   * Stores the answer and advances — no "Continue" button needed.
   */
  const handleSingleSelect = (id: string) => {
    setSelected([id]);
    if (stepDef.field) {
      // NO_PREF is a UI-only key; the backend value is always MSG
      const value = id === 'NO_PREF' ? 'MSG' : id;
      setAnswer(stepDef.field, value);
    }
    // Small visual delay so the user sees the selection highlight before leaving
    setTimeout(goNext, 160);
  };

  /** Multi-choice toggle — stays on screen until "Continue" is tapped */
  const handleMultiToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  /** "Continue" for multi / text / celebration */
  const handleContinue = async () => {
    setSaving(true);
    try {
      if (!isCelebration && stepDef.field) {
        if (isMulti && selected.length > 0) {
          setAnswer(stepDef.field, selected);
        } else if (isText && textValue.trim()) {
          setAnswer(stepDef.field, textValue.trim());
        }
      }
      goNext();
    } finally {
      setSaving(false);
    }
  };

  const canContinue =
    isCelebration ||
    (isMulti && selected.length > 0) ||
    isText; // text is always skippable

  // ── Celebration screen ───────────────────────────────────────────────────────
  if (isCelebration) {
    return (
      <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🙌🎉</Text>
            <Text style={styles.celebrationTitle}>You are in good company!</Text>
            <Text style={styles.celebrationSub}>
              Kover's mission is to empower millions of people to break free from pornography and live with purpose, clarity, and faith.
            </Text>
            <Text style={styles.celebrationStat}>
              You are not alone. 68 million people search for pornographic content daily — but you're choosing something different.
            </Text>
          </View>
          <KButton variant="primary" full loading={saving} onPress={handleContinue}>
            I'm Ready to Change
          </KButton>
        </View>
      </LinearGradient>
    );
  }

  // ── Regular question screen ──────────────────────────────────────────────────
  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>

        {/* Header: back + progress */}
        <View style={styles.header}>
          {stepNum > 1 && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
          <ProgressBar current={stepNum} total={TOTAL_STEPS} />
          <Text style={styles.stepCount}>{stepNum}/{TOTAL_STEPS}</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.question}>{stepDef.question}</Text>
          {stepDef.subtitle && <Text style={styles.subtitle}>{stepDef.subtitle}</Text>}

          {/* Single-choice: tap → auto-advance, no CTA */}
          {isSingle && stepDef.options && (
            <View style={styles.options}>
              {stepDef.options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSingleSelect(opt.id)}
                    activeOpacity={0.7}
                  >
                    {opt.icon && <Text style={styles.optionEmoji}>{opt.icon}</Text>}
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {opt.label}
                      </Text>
                      {opt.desc && <Text style={styles.optionSublabel}>{opt.desc}</Text>}
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Multi-choice: tap toggles, CTA shown below */}
          {isMulti && stepDef.options && (
            <View style={styles.options}>
              {stepDef.options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleMultiToggle(opt.id)}
                    activeOpacity={0.7}
                  >
                    {opt.icon && <Text style={styles.optionEmoji}>{opt.icon}</Text>}
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {opt.label}
                      </Text>
                      {opt.desc && <Text style={styles.optionSublabel}>{opt.desc}</Text>}
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Text / number input: CTA shown below */}
          {isText && (
            <TextInput
              style={styles.textInput}
              placeholder={stepDef.placeholder ?? 'Type here...'}
              placeholderTextColor={Colors.fg4}
              value={textValue}
              onChangeText={setTextValue}
              keyboardType={stepDef.type === 'number' ? 'number-pad' : 'default'}
              multiline={stepDef.type === 'text'}
              autoFocus
            />
          )}
        </ScrollView>

        {/* CTA — only shown for multi / text / number (NOT single) */}
        {(isMulti || isText) && (
          <KButton
            variant="primary"
            full
            disabled={!canContinue}
            loading={saving}
            onPress={handleContinue}
          >
            {isMulti
              ? selected.length > 0
                ? `Continue (${selected.length} selected)`
                : 'Select at least one'
              : 'Continue'}
          </KButton>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    color: Colors.fg3,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.hairline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.emerald500,
    borderRadius: 2,
  },
  stepCount: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.fg4,
    minWidth: 32,
    textAlign: 'right',
  },
  content: {
    gap: 24,
    paddingBottom: 16,
  },
  question: {
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '700',
    color: Colors.fg1,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg3,
    lineHeight: 20,
    marginTop: -8,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
  },
  optionSelected: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '18',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.fg2,
  },
  optionLabelSelected: {
    color: Colors.fg1,
  },
  optionSublabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg4,
  },
  checkmark: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.emerald500,
  },
  textInput: {
    fontFamily: Fonts.sans,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    padding: Spacing.md,
    color: Colors.fg1,
    fontSize: 18,
    minHeight: 60,
  },
  celebrationContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: Spacing.md,
  },
  celebrationEmoji: {
    fontSize: 72,
  },
  celebrationTitle: {
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '800',
    color: Colors.fg1,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  celebrationSub: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.fg2,
    textAlign: 'center',
    lineHeight: 24,
  },
  celebrationStat: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.fg2,
    textAlign: 'center',
    lineHeight: 24,
  },
});
