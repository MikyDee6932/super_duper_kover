import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { KCard } from '@/components/ui/KCard';
import { KEyebrow } from '@/components/ui/KEyebrow';
import { TimelineStep } from '@/components/lesson/TimelineStep';
import { EarnedSheet } from '@/components/earned/EarnedSheet';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { getDailyLesson, DailyLesson, saveJournalEntry, updateProfile } from '@/lib/supabase';
import { fetchVerse } from '@/lib/bible';
import { getJournalReflection } from '@/lib/coach';
import { getFallbackLesson } from '@/constants/fallbackLessons';

type LessonStep = 0 | 1 | 2 | 3;

const STEP_TITLES = ['Verse of the Day', 'Guided Study', 'Journal Entry', 'Guided Prayer'];
const STEP_SUBTITLES = [
  'Receive today\'s scripture',
  'Read the devotional study',
  'Write your reflection',
  'Close in prayer',
];

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = parseInt(id ?? '1', 10);
  const insets = useSafeAreaInsets();

  const { user, profile, refreshProfile } = useAuthStore();
  const { updateLessonProgress, markLessonComplete, markLessonCompleteLocal, currentStreak } = useStreakStore();

  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [verseText, setVerseText] = useState('');
  const [activeStep, setActiveStep] = useState<LessonStep>(0);
  const [journalText, setJournalText] = useState('');
  const [aiReflection, setAiReflection] = useState('');
  const [gettingReflection, setGettingReflection] = useState(false);
  const [earnedVisible, setEarnedVisible] = useState(false);

  // Load lesson content — does NOT require a user session.
  // Falls back to local content if Supabase is unavailable (empty DB, RLS, no network).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let l: DailyLesson | null = null;
      try {
        l = await getDailyLesson(lessonId);
      } catch {
        // network or RLS error — fall through to local fallback
      }
      if (cancelled) return;

      // Use local fallback when DB has no content for this day
      const lesson = l ?? getFallbackLesson(lessonId);
      setLesson(lesson);

      // Fetch verse text — already has its own offline fallback in bible.ts
      const translation = profile?.bible_translation ?? 'NLT';
      const verseResult = await fetchVerse(lesson.verse_reference, translation);
      if (!cancelled) setVerseText(verseResult ?? lesson.verse_text_nlt ?? '');
    }
    load();
    return () => { cancelled = true; };
  }, [lessonId]); // intentionally omit user — content loads regardless of auth state

  const getStepStatus = (step: number) => {
    if (step < activeStep) return 'completed';
    if (step === activeStep) return 'active';
    return 'locked';
  };

  // Progress as a percentage for display (0 % at start, 100 % when on step 4)
  const progressPercent = Math.round((activeStep / 4) * 100);

  const handleStepAdvance = async () => {
    if (!lesson) return;

    const nextStep = (activeStep + 1) as LessonStep;

    if (activeStep === 2 && journalText.trim()) {
      setGettingReflection(true);
      try {
        if (user) {
          // AI reflection via edge function — requires authenticated session
          const reflection = await getJournalReflection(
            user.id,
            journalText,
            lesson.journal_prompt ?? '',
          );
          setAiReflection(reflection);
          await saveJournalEntry(user.id, {
            lesson_id: lessonId,
            prompt: lesson.journal_prompt ?? '',
            content: journalText,
            ai_reflection: reflection,
          });
        }
      } catch {
        // Non-fatal — save without AI reflection
        if (user) {
          await saveJournalEntry(user.id, {
            lesson_id: lessonId,
            prompt: lesson.journal_prompt ?? '',
            content: journalText,
            ai_reflection: null,
          }).catch(() => {});
        }
      } finally {
        setGettingReflection(false);
      }
    }

    // Persist step progress only when authenticated
    if (user) {
      await updateLessonProgress(user.id, nextStep).catch(() => {});
    }
    setActiveStep(nextStep);
  };

  const handleComplete = async () => {
    if (user) {
      // Authenticated: persist to Supabase
      await markLessonComplete(user.id).catch(() => {});
      const nextDay = lessonId + 1;
      await updateProfile(user.id, { current_lesson_day: nextDay }).catch(() => {});
      await refreshProfile().catch(() => {});
    } else {
      // Dev / null-user: update store locally so the EarnedSheet and home
      // screen show the correct Day 1 streak instead of 0.
      markLessonCompleteLocal();
    }
    setEarnedVisible(true);
  };

  if (!lesson) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.fg4, fontFamily: Fonts.sans, fontSize: 15 }}>Loading lesson…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Day {lessonId}</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lessonTitle}>{lesson.study_title}</Text>
        <Text style={styles.theme}>{lesson.theme}</Text>

        {/* 4-step timeline */}
        <View style={styles.timeline}>
          {STEP_TITLES.map((title, i) => (
            <TimelineStep
              key={i}
              stepNumber={i + 1}
              title={title}
              subtitle={STEP_SUBTITLES[i]}
              status={getStepStatus(i)}
              isLast={i === 3}
              onPress={() => i < activeStep && setActiveStep(i as LessonStep)}
            />
          ))}
        </View>

        {/* ── Step 0: Verse ── */}
        {activeStep === 0 && (
          <KCard style={styles.stepContent}>
            <KEyebrow color={Colors.emerald500}>{lesson.verse_reference}</KEyebrow>
            <Text style={styles.verseText}>"{verseText || lesson.verse_text_nlt}"</Text>
            <KButton variant="primary" full onPress={handleStepAdvance} style={{ marginTop: 8 }}>
              Continue to Study →
            </KButton>
          </KCard>
        )}

        {/* ── Step 1: Guided Study ── */}
        {activeStep === 1 && (
          <KCard style={styles.stepContent}>
            <KEyebrow>Guided Study</KEyebrow>
            <Text style={styles.studyText}>{lesson.study_content}</Text>
            <KButton variant="primary" full onPress={handleStepAdvance} style={{ marginTop: 16 }}>
              Continue to Journal →
            </KButton>
          </KCard>
        )}

        {/* ── Step 2: Journal ── */}
        {activeStep === 2 && (
          <KCard style={styles.stepContent}>
            <KEyebrow>Journal Prompt</KEyebrow>
            <Text style={styles.journalPrompt}>{lesson.journal_prompt}</Text>
            <TextInput
              style={styles.journalInput}
              placeholder="Write your reflection here..."
              placeholderTextColor={Colors.fg4}
              value={journalText}
              onChangeText={setJournalText}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            {aiReflection ? (
              <View style={styles.reflectionBlock}>
                <KEyebrow color={Colors.emerald500}>Sloan's Reflection</KEyebrow>
                <Text style={styles.reflectionText}>{aiReflection}</Text>
              </View>
            ) : null}
            <KButton
              variant="primary"
              full
              loading={gettingReflection}
              disabled={!journalText.trim()}
              onPress={handleStepAdvance}
              style={{ marginTop: 12 }}
            >
              {gettingReflection ? 'Getting reflection…' : 'Continue to Prayer →'}
            </KButton>
          </KCard>
        )}

        {/* ── Step 3: Prayer ── */}
        {activeStep === 3 && (
          <KCard style={styles.stepContent}>
            <KEyebrow>Guided Prayer</KEyebrow>
            <Text style={styles.prayerText}>{lesson.prayer_text}</Text>
            <KButton variant="earned" full onPress={handleComplete} style={{ marginTop: 16 }}>
              Complete Lesson ✓
            </KButton>
          </KCard>
        )}
      </ScrollView>

      <EarnedSheet
        visible={earnedVisible}
        onClose={() => {
          setEarnedVisible(false);
          router.back();
        }}
        streak={currentStreak}
        title="Lesson Complete!"
        message="You showed up today. That is what overcomers do."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  backText: { fontSize: 15, color: Colors.fg3 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.fg1, fontFamily: Fonts.sansBold },
  progressPill: {
    backgroundColor: Colors.emerald500 + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.emerald500, fontFamily: Fonts.sansBold },
  container: { padding: Spacing.lg, gap: 24 },
  lessonTitle: { fontFamily: Fonts.display, fontSize: 24, fontWeight: '700', color: Colors.fg1, lineHeight: 32 },
  theme: { fontSize: 13, color: Colors.emerald500, fontWeight: '600', marginTop: -12, fontFamily: Fonts.sansBold },
  timeline: { gap: 0 },
  stepContent: { gap: 12 },
  verseText: { fontSize: 19, color: Colors.fg1, fontStyle: 'italic', lineHeight: 28 },
  studyText: { fontSize: 15, color: Colors.fg2, lineHeight: 24 },
  journalPrompt: { fontSize: 16, color: Colors.fg1, fontStyle: 'italic', lineHeight: 24 },
  journalInput: {
    minHeight: 120,
    backgroundColor: Colors.bg1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 12,
    color: Colors.fg1,
    fontSize: 15,
    lineHeight: 22,
  },
  reflectionBlock: {
    gap: 8,
    padding: 12,
    backgroundColor: Colors.emerald500 + '12',
    borderRadius: Radius.md,
  },
  reflectionText: { fontSize: 14, color: Colors.fg2, lineHeight: 22, fontStyle: 'italic' },
  prayerText: { fontSize: 16, color: Colors.fg1, lineHeight: 26 },
});
