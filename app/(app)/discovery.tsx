import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KCard } from '@/components/ui/KCard';
import { KEyebrow } from '@/components/ui/KEyebrow';
import { useAuthStore } from '@/store/authStore';
import { supabase, DailyLesson } from '@/lib/supabase';

const WEEK_THEMES = [
  { week: 1, theme: 'Identity & Worth', color: Colors.emerald500, emoji: '👑' },
  { week: 2, theme: 'Breaking Patterns', color: '#9b8cff', emoji: '🧠' },
  { week: 3, theme: 'Community & Accountability', color: Colors.amber500, emoji: '🤝' },
  { week: 4, theme: 'Purpose & Freedom', color: Colors.emerald500, emoji: '🕊️' },
];

type Tab = 'lessons' | 'soundscapes';

export default function Discovery() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('lessons');
  const [lessons, setLessons] = useState<DailyLesson[]>([]);

  useEffect(() => {
    supabase.from('daily_lessons').select('*').order('day_number').then(({ data }) => {
      if (data) setLessons(data as DailyLesson[]);
    });
  }, []);

  const currentDay = profile?.current_lesson_day ?? 1;

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Discover</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['lessons', 'soundscapes'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'lessons' ? 'Daily Lessons' : 'Soundscapes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'lessons' && (
        <>
          {/* Week groupings */}
          {WEEK_THEMES.map((wt) => {
            const weekLessons = lessons.filter(
              (l) => l.day_number >= (wt.week - 1) * 7 + 1 && l.day_number <= wt.week * 7,
            );
            return (
              <View key={wt.week} style={styles.weekSection}>
                <View style={styles.weekHeader}>
                  <Text style={styles.weekEmoji}>{wt.emoji}</Text>
                  <View>
                    <KEyebrow>Week {wt.week}</KEyebrow>
                    <Text style={styles.weekTheme}>{wt.theme}</Text>
                  </View>
                </View>

                <View style={styles.lessonList}>
                  {weekLessons.map((lesson) => {
                    const isCompleted = lesson.day_number < currentDay;
                    const isCurrent = lesson.day_number === currentDay;
                    const isLocked = lesson.day_number > currentDay;

                    return (
                      <TouchableOpacity
                        key={lesson.day_number}
                        style={[
                          styles.lessonRow,
                          isCurrent && styles.lessonRowCurrent,
                          isLocked && styles.lessonRowLocked,
                        ]}
                        onPress={() => !isLocked && router.push(`/(app)/lesson/${lesson.day_number}`)}
                        disabled={isLocked}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.lessonDot, isCompleted && styles.lessonDotDone, isCurrent && styles.lessonDotCurrent]}>
                          <Text style={styles.lessonDotText}>
                            {isCompleted ? '✓' : lesson.day_number}
                          </Text>
                        </View>
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                            Day {lesson.day_number}: {lesson.study_title}
                          </Text>
                          <Text style={styles.lessonVerse}>{lesson.verse_reference}</Text>
                        </View>
                        {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                        {isCurrent && <Text style={styles.currentLabel}>→</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </>
      )}

      {tab === 'soundscapes' && (
        <View style={styles.soundscapes}>
          {[
            { name: 'Rain & Stillness', duration: '30 min', emoji: '🌧️' },
            { name: 'Forest Walk', duration: '20 min', emoji: '🌲' },
            { name: 'Worship Ambient', duration: '45 min', emoji: '🎵' },
            { name: 'Ocean Meditation', duration: '25 min', emoji: '🌊' },
            { name: 'Morning Prayer', duration: '15 min', emoji: '🌅' },
          ].map((s) => (
            <KCard key={s.name} style={styles.soundCard}>
              <Text style={styles.soundEmoji}>{s.emoji}</Text>
              <View style={styles.soundInfo}>
                <Text style={styles.soundName}>{s.name}</Text>
                <Text style={styles.soundDuration}>{s.duration}</Text>
              </View>
              <Text style={styles.playBtn}>▶</Text>
            </KCard>
          ))}
          <Text style={styles.comingSoon}>More soundscapes coming soon</Text>
        </View>
      )}
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, gap: 20 },
  title: { fontFamily: Fonts.display, fontSize: 28, fontWeight: '700', color: Colors.fg1 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.emerald500 },
  tabText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, fontWeight: '600', color: Colors.fg4 },
  tabTextActive: { color: '#fff' },
  weekSection: { gap: 12 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekEmoji: { fontSize: 24 },
  weekTheme: { fontFamily: Fonts.sansBold, fontSize: 16, fontWeight: '700', color: Colors.fg1 },
  lessonList: { gap: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 12,
  },
  lessonRowCurrent: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '0d',
  },
  lessonRowLocked: { opacity: 0.5 },
  lessonDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg1,
    borderWidth: 1, borderColor: Colors.hairline,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  lessonDotDone: { backgroundColor: Colors.emerald500, borderColor: Colors.emerald500 },
  lessonDotCurrent: { borderColor: Colors.emerald500, borderWidth: 2 },
  lessonDotText: { fontFamily: Fonts.sansBold, fontSize: 12, fontWeight: '700', color: Colors.fg2 },
  lessonInfo: { flex: 1, gap: 2 },
  lessonTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 14, fontWeight: '600', color: Colors.fg1 },
  lessonTitleLocked: { color: Colors.fg4 },
  lessonVerse: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.fg4 },
  lockIcon: { fontSize: 14 },
  currentLabel: { fontFamily: Fonts.sansBold, fontSize: 18, color: Colors.emerald500, fontWeight: '700' },
  soundscapes: { gap: 12 },
  soundCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  soundEmoji: { fontSize: 28 },
  soundInfo: { flex: 1, gap: 2 },
  soundName: { fontFamily: Fonts.sansSemiBold, fontSize: 15, fontWeight: '600', color: Colors.fg1 },
  soundDuration: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.fg4 },
  playBtn: { fontSize: 20, color: Colors.emerald500 },
  comingSoon: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.fg4, textAlign: 'center', fontStyle: 'italic' },
});
