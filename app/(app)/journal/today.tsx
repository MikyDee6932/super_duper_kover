import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { getJournalReflection } from '@/lib/coach';
import { saveJournalEntry } from '@/lib/supabase';
import { getFallbackLesson } from '@/constants/fallbackLessons';

// ── Prompt library — used when lesson prompt is not available ──────────────────
const SLOAN_PROMPTS = [
  "What's been pulling at you today — and what do you want to be different by tomorrow?",
  "Where did you feel most tempted today, and what gave you the strength to keep going?",
  "What emotion is underneath the urge right now? Name it honestly.",
  "What are you most grateful for in your recovery journey this week?",
  "Who in your life knows you're fighting this — and what would you want them to know right now?",
  "What does freedom look like for you one year from today?",
  "Where did you feel God's presence today, even in a small way?",
  "What's one truth about yourself you need to hear right now?",
  "What would the strongest version of you do in this moment?",
  "If your future self could send you a message today, what would they say?",
  "What boundary do you need to put in place this week to protect your recovery?",
  "When was the last time you felt truly free? What was different then?",
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PRAYER_OPENER = 'Lord, as I bring this to you honestly —\n\n';

function pickOther(current: string): string {
  const others = SLOAN_PROMPTS.filter(p => p !== current);
  return others[Math.floor(Math.random() * others.length)];
}

// ── Screen ─────────────────────────────────────────────────────────────────────
type ViewState = 'writing' | 'saved';

export default function TodayJournal() {
  const insets  = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { markJournalComplete } = useStreakStore();

  const lessonDay = profile?.current_lesson_day ?? 1;
  const dayName   = DAY_NAMES[new Date().getDay()];

  // Prefer the lesson's own journal prompt, fall back to library
  const lessonPrompt = getFallbackLesson(lessonDay).journal_prompt ?? SLOAN_PROMPTS[0];

  const [prompt, setPrompt]         = useState(lessonPrompt);
  const [input, setInput]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [reflection, setReflection] = useState('');
  const [view, setView]             = useState<ViewState>('writing');

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleTryAnother = useCallback(() => {
    setPrompt(p => pickOther(p));
    setInput('');
  }, []);

  const handlePrayWithThis = useCallback(() => {
    const base = input.trim()
      ? `"${input.trim()}"\n\nMay these words become a prayer, Lord. Help me to surrender this to You, to walk in freedom, and to trust that You are at work even in my struggle.`
      : `${prompt}\n\nI bring this question before You, Lord. Search my heart and show me the truth. May Your grace be enough for me today.`;
    setInput(PRAYER_OPENER + base);
  }, [input, prompt]);

  const handleVoiceNote = () => {
    Alert.alert('Coming Soon', 'Voice notes will be available in the next update.');
  };

  const handleSave = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    setSaving(true);
    try {
      // Get Sloan's reflection (works in dev mode via coach.ts mock)
      const sloanReflection = await getJournalReflection(
        user?.id ?? 'dev',
        text,
        prompt,
      );
      setReflection(sloanReflection);

      // Persist entry + mark journal complete
      if (user) {
        await saveJournalEntry(user.id, {
          lesson_id: lessonDay,
          prompt,
          content: text,
          ai_reflection: sloanReflection,
        }).catch(() => {});
        await markJournalComplete(user.id).catch(() => {});
      }

      setView('saved');
    } catch {
      // Edge function down — save without reflection
      if (user) {
        await saveJournalEntry(user.id, {
          lesson_id: lessonDay,
          prompt,
          content: text,
          ai_reflection: null,
        }).catch(() => {});
        await markJournalComplete(user.id).catch(() => {});
      }
      Alert.alert(
        'Saved',
        "Your entry has been saved. Coach Sloan's reflection will appear when you reconnect.",
      );
      router.back();
    } finally {
      setSaving(false);
    }
  }, [input, prompt, user, lessonDay]);

  const handleNewEntry = () => {
    setPrompt(pickOther(prompt));
    setInput('');
    setReflection('');
    setView('writing');
  };

  // ── Saved / reflection view ────────────────────────────────────────────────
  if (view === 'saved') {
    return (
      <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerDay}>DAY {lessonDay} · {dayName.toUpperCase()}</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Your entry */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR REFLECTION</Text>
            <View style={styles.entryCard}>
              <Text style={styles.entryText}>{input.trim()}</Text>
            </View>
          </View>

          {/* Sloan's reflection */}
          <View style={styles.section}>
            <View style={styles.sloanChip}>
              <View style={styles.sloanChipDot} />
              <Text style={styles.sloanChipLabel}>FROM COACH SLOAN</Text>
            </View>
            <View style={styles.reflectionCard}>
              <Text style={styles.reflectionText}>{reflection}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.ctaWrap}>
            <KButton variant="primary" full onPress={handleNewEntry}>
              + Write another reflection
            </KButton>
            <TouchableOpacity onPress={() => router.back()} style={styles.doneLink}>
              <Text style={styles.doneLinkText}>Done — back to home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Writing view ───────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top bar: back + day label ─────────────────────────────────── */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerDay}>DAY {lessonDay} · {dayName.toUpperCase()}</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* ── Section: prompt ───────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TODAY'S JOURNAL</Text>

            <Text style={styles.promptText}>"{prompt}"</Text>

            <View style={styles.sloanChip}>
              <View style={styles.sloanChipDot} />
              <Text style={styles.sloanChipLabel}>
                From Coach Sloan · personalised for Day {lessonDay}
              </Text>
            </View>
          </View>

          {/* ── Writing area ──────────────────────────────────────────────── */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Start writing or speaking - only you and Virtual Coach Sloan will see this."
              placeholderTextColor={Colors.fg4}
              value={input}
              onChangeText={setInput}
              multiline
              textAlignVertical="top"
              maxLength={3000}
              autoCorrect
              autoCapitalize="sentences"
              autoFocus={false}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{input.length} characters</Text>
              <View style={styles.privateTag}>
                <Text style={styles.privateLock}>🔒</Text>
                <Text style={styles.privateLabel}>Private</Text>
              </View>
            </View>
          </View>

          {/* ── Quick action pills ────────────────────────────────────────── */}
          <View style={styles.pills}>
            <TouchableOpacity style={styles.pill} onPress={handleTryAnother} activeOpacity={0.75}>
              <Text style={styles.pillText}>Try another prompt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={handlePrayWithThis} activeOpacity={0.75}>
              <Text style={styles.pillText}>Pray with this</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={handleVoiceNote} activeOpacity={0.75}>
              <Text style={styles.pillText}>Voice note instead</Text>
            </TouchableOpacity>
          </View>

          {/* ── Save & reflect CTA ────────────────────────────────────────── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.saveCta, (!input.trim() || saving) && styles.saveCtaDisabled]}
              onPress={handleSave}
              disabled={!input.trim() || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.fg3} size="small" />
              ) : (
                <>
                  <Text style={styles.saveCtaPlus}>+</Text>
                  <Text style={styles.saveCtaText}>Save & reflect with Coach Sloan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: 22,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -4,
  },
  backBtn: {
    width: 32,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.fg3,
    fontWeight: '700',
  },
  headerDay: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.fg4,
    letterSpacing: 2,
    textAlign: 'center',
  },

  // Section
  section: { gap: 14 },
  sectionLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.emerald400,
    letterSpacing: 2,
  },

  // Prompt
  promptText: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 24,
    lineHeight: 34,
    color: Colors.fg1,
    letterSpacing: -0.3,
  },

  // Sloan chip
  sloanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.emerald500 + '1A',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.emerald500 + '44',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sloanChipDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.emerald500,
  },
  sloanChipLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.emerald300,
  },

  // Input card
  inputCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    overflow: 'hidden',
  },
  textInput: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.fg1,
    padding: Spacing.md,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  charCount: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg4,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privateLock: { fontSize: 11 },
  privateLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.fg4,
  },

  // Pills
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -6,
  },
  pill: {
    backgroundColor: Colors.bgSurface2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.fg2,
  },

  // Save CTA
  ctaWrap: { gap: 12 },
  saveCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.bgSurface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
  },
  saveCtaDisabled: { opacity: 0.38 },
  saveCtaPlus: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.fg3,
  },
  saveCtaText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.fg2,
  },
  doneLink: { alignItems: 'center', paddingVertical: 4 },
  doneLinkText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.fg4,
  },

  // Saved / reflection view
  entryCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
  },
  entryText: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.fg2,
    fontStyle: 'italic',
  },
  reflectionCard: {
    backgroundColor: Colors.emerald500 + '12',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.emerald500 + '33',
    padding: Spacing.md,
    marginTop: 4,
  },
  reflectionText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.fg1,
  },
});
