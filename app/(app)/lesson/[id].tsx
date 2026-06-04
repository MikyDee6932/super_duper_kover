import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
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
import { getDailyLesson, DailyLesson, saveJournalEntry } from '@/lib/supabase';
import { fetchVerse } from '@/lib/bible';
import { getJournalReflection } from '@/lib/coach';

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

  const { user, profile } = useAuthStore();
  const { updateLessonProgress, markLessonComplete, currentStreak } = useStreakStore();

  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [verseText, setVerseText] = useState('');
  const [activeStep, setActiveStep] = useState<LessonStep>(0);
  const [journalText, setJournalText] = useState('');
  const [aiReflection, setAiReflection] = useState('');
  const [gettingReflection, setGettingReflection] = useState(false);
  const [earnedVisible, setEarnedVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDailyLesson(lessonId).then(async (l) => {
      if (!l) return;
      setLesson(l);
      const translation = profile?.bible_translation ?? 'NLT';
      const verseResult = await fetchVerse(l.verse_reference, translation);
      setVerseText(verseResult ?? l.verse_text_nlt ?? '');
    });
  }, [lessonId, user]);

  const getStepStatus = (step: number) => {
    if (step < activeStep) return 'completed';
    if (step === activeStep) return 'active';
    return 'locked';
  };

  const handleStepAdvance = async () => {
    if (!user || !lesson) return;

    const nextStep = (activeStep + 1) as LessonStep;

    if (activeStep === 2 && journalText.trim()) {
      // Get AI reflection before advancing
      setGettingReflection(true);
      try {
        const reflection = await getJournalReflection(user.id, journalText, lesson.journal_prompt ?? '');
        setAiReflection(reflection);
        await saveJournalEntry(user.id, {
          lesson_id: lessonId,
          prompt: lesson.journal_prompt ?? '',
          content: journalText,
          ai_reflection: reflection,
        });
      } catch {
        // Non-fatal — save without reflection
        await saveJournalEntry(user.id, {
          lesson_id: lessonId,
          prompt: lesson.journal_prompt ?? '',
          content: journalText,
          ai_reflection: null,
        });
      } finally {
        setGettingReflection(false);
      }
    }

    await updateLessonProgress(user.id, nextStep);
    setActiveStep(nextStep);
  };

  const handleComplete = async () => {
    if (!user) return;
    await markLessonComplete(user.id);
    setEarnedVisible(true);
  };

  if (!lesson) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.fg4 }}>Loading lesson...</Text>
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
          <Text style={styles.progressText}>{activeStep}/4</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lessonTitle}>{lesson.study_title}</Text>
        <Text style={styles.theme}>{lesson.theme}</Text>

        {/* Timeline */}
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

        {/* Active step content */}
        {activeStep === 0 && (
          <KCard style={styles.stepContent}>
            <KEyebrow color={Colors.emerald500}>{lesson.verse_reference}</KEyebrow>
            <Text style={styles.verseText}>"{verseText}"</Text>
            <KButton variant="primary" full onPress={handleStepAdvance} style={{ marginTop: 8 }}>
              Continue to Study →
            </KButton>
          </KCard>
        )}

        {activeStep === 1 && (
          <KCard style={styles.stepContent}>
            <KEyebrow>Guided Study</KEyebrow>
            <Text style={styles.studyText}>{lesson.study_content}</Text>
            <KButton variant="primary" full onPress={handleStepAdvance} style={{ marginTop: 16 }}>
              Continue to Journal →
            </KButton>
          </KCard>
        )}

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
              {gettingReflection ? 'Getting reflection...' : 'Continue to Prayer →'}
            </KButton>
          </KCard>
        )}

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
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.fg1 },
  progressPill: {
    backgroundColor: Colors.emerald500 + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.emerald500 },
  container: { padding: Spacing.lg, gap: 24 },
  lessonTitle: { fontFamily: Fonts.display, fontSize: 24, fontWeight: '700', color: Colors.fg1, lineHeight: 32 },
  theme: { fontSize: 13, color: Colors.emerald500, fontWeight: '600', marginTop: -12 },
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
  reflectionBlock: { gap: 8, padding: 12, backgroundColor: Colors.emerald500 + '12', borderRadius: Radius.md },
  reflectionText: { fontSize: 14, color: Colors.fg2, lineHeight: 22, fontStyle: 'italic' },
  prayerText: { fontSize: 16, color: Colors.fg1, lineHeight: 26 },
});
