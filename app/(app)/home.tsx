import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, AppState, AppStateStatus,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Fonts, Radius, BgGradient } from '@/constants/colors';
import { KEyebrow } from '@/components/ui/KEyebrow';
import { KButton } from '@/components/ui/KButton';
import { StreakRing } from '@/components/ui/StreakRing';
import { CheckInSheet } from '@/components/checkin/CheckInSheet';
import { EarnedSheet } from '@/components/earned/EarnedSheet';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { useVerse } from '@/hooks/useVerse';
import { getShieldStatus } from '@/lib/dnsShield';

// ── Motivational subtitle based on streak ─────────────────────────────────────
function streakCopy(days: number): string {
  if (days <= 1)  return 'Day 1 — the journey starts here';
  if (days <= 3)  return `Day ${days} — the journey begins`;
  if (days <= 7)  return `Day ${days} — building momentum`;
  if (days <= 14) return `Day ${days} — keep going, you've got this`;
  if (days <= 21) return `Day ${days} — you're in the zone`;
  if (days <= 30) return `Day ${days} — almost there`;
  return `Day ${days} — freedom in motion`;
}

// ── Featured DaysCarousel ─────────────────────────────────────────────────────
// Shows lesson days around today with a large featured card for the current day.
const SMALL_W = 64;
const LARGE_W = 210;
const CARD_GAP = 10;
const CARD_H  = 260;

interface DayCardProps {
  dayNum: number;
  state: 'past-done' | 'past-incomplete' | 'today' | 'future';
  streak: number;
  lessonCompleted: boolean;
  onPress: () => void;
}

function SmallDayCard({ dayNum, state }: { dayNum: number; state: DayCardProps['state'] }) {
  const done = state === 'past-done';
  const isToday = state === 'today'; // shouldn't happen but guard
  return (
    <View style={[sdc.card, done && sdc.cardDone, isToday && sdc.cardToday]}>
      {done ? (
        <View style={sdc.checkCircle}>
          <Text style={sdc.check}>✓</Text>
        </View>
      ) : (
        <View style={[sdc.numCircle, isToday && sdc.numCircleToday]}>
          <Text style={[sdc.num, isToday && sdc.numToday]}>{dayNum}</Text>
        </View>
      )}
      <Text style={[sdc.label, done && sdc.labelDone]}>
        Day {dayNum}
      </Text>
    </View>
  );
}

const sdc = StyleSheet.create({
  card: {
    width: SMALL_W,
    height: CARD_H,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardDone: {
    backgroundColor: Colors.emerald500 + '18',
    borderColor: Colors.hairlineEmerald,
  },
  cardToday: {
    borderColor: Colors.emerald500,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  numCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSurface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numCircleToday: {
    borderWidth: 2,
    borderColor: Colors.emerald500,
  },
  num: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.fg3,
  },
  numToday: { color: Colors.emerald500 },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.fg4,
  },
  labelDone: { color: Colors.emerald500 },
});

function TodayCard({ dayNum, streak, lessonCompleted, onPress }: {
  dayNum: number;
  streak: number;
  lessonCompleted: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={tdc.card}
      onPress={!lessonCompleted ? onPress : undefined}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[Colors.bgSurface2, Colors.bgSurface]}
        style={tdc.gradient}
      >
        {/* Streak ring */}
        <StreakRing streak={streak} size={150} strokeWidth={10} />

        {/* Lesson CTA */}
        <View style={tdc.cta}>
          {lessonCompleted ? (
            <>
              <KEyebrow color={Colors.emerald500}>Lesson Complete ✓</KEyebrow>
              <Text style={tdc.ctaText}>Well done! See you tomorrow.</Text>
            </>
          ) : (
            <>
              <KEyebrow color={Colors.emerald400}>Today's Lesson</KEyebrow>
              <Text style={tdc.ctaText}>Tap to begin  →</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const tdc = StyleSheet.create({
  card: {
    width: LARGE_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cta: {
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.fg1,
    letterSpacing: -0.2,
  },
});

function HomeDaysCarousel({
  lessonDay,
  streak,
  lessonCompleted,
  onPressToday,
}: {
  lessonDay: number;
  streak: number;
  lessonCompleted: boolean;
  onPressToday: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  // Build day range: 3 before today + today + 3 after
  const start = Math.max(1, lessonDay - 3);
  const end   = lessonDay + 3;
  const days  = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  useEffect(() => {
    // Scroll so today is centered
    const todayIdx = days.indexOf(lessonDay);
    if (todayIdx >= 0 && scrollRef.current) {
      const offset =
        todayIdx * (SMALL_W + CARD_GAP) -
        (LARGE_W - SMALL_W) / 2 - // offset for large card
        (SMALL_W + CARD_GAP); // show one past card
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
      }, 100);
    }
  }, [lessonDay]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={car.container}
    >
      {days.map((d) => {
        if (d === lessonDay) {
          return (
            <TodayCard
              key={d}
              dayNum={d}
              streak={streak}
              lessonCompleted={lessonCompleted}
              onPress={onPressToday}
            />
          );
        }
        const state = d < lessonDay ? 'past-done' : 'future';
        return <SmallDayCard key={d} dayNum={d} state={state} />;
      })}
    </ScrollView>
  );
}

const car = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: CARD_GAP,
    alignItems: 'center',
  },
});

// ── Home screen ───────────────────────────────────────────────────────────────
export default function Home() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { currentStreak, todayStreak, load } = useStreakStore();
  const { verse } = useVerse();

  const [checkInVisible, setCheckInVisible] = useState(false);
  const [earnedVisible, setEarnedVisible]   = useState(false);
  const [shieldWarning, setShieldWarning]   = useState(false);

  const name     = profile?.full_name?.split(' ')[0] ?? 'Friend';
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const lessonDay = profile?.current_lesson_day ?? 1;

  // Derive goal from conquer_date or default 21
  const goal = (() => {
    if (profile?.conquer_date) {
      const diff = Math.round(
        (new Date(profile.conquer_date).getTime() - Date.now()) / 86400000,
      );
      return Math.max(21, diff);
    }
    return 21;
  })();

  useEffect(() => {
    if (user) load(user.id);
  }, [user?.id]);

  useEffect(() => {
    const check = async () => {
      const status = await getShieldStatus();
      setShieldWarning(!status.isEnabled && !!profile?.shield_activated);
    };
    check();
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, [profile?.shield_activated]);

  const handleCheckInComplete = () => {
    if (user) load(user.id);
    setEarnedVisible(true);
  };

  return (
    <LinearGradient
      colors={BgGradient.colors}
      locations={BgGradient.locations}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header: wordmark ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo-wordmark-cream.png')}
            style={styles.wordmark}
            resizeMode="contain"
          />
          {/* SOS pill is rendered globally by (app)/_layout.tsx */}
        </View>

        {/* ── Shield warning ────────────────────────────────────────────────── */}
        {shieldWarning && (
          <TouchableOpacity
            style={styles.shieldBanner}
            onPress={() => router.push('/(auth)/onboarding/shield')}
          >
            <Text style={styles.shieldBannerText}>
              ⚠️ Kover Shield is disabled — tap to re-enable
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Greeting ──────────────────────────────────────────────────────── */}
        <View style={styles.greeting}>
          <KEyebrow>{greeting}</KEyebrow>
          <Text style={styles.name}>{name} 👋</Text>
          <Text style={styles.daySub}>{streakCopy(currentStreak)}</Text>
        </View>

        {/* ── Days carousel ─────────────────────────────────────────────────── */}
        <View style={styles.carouselWrap}>
          <HomeDaysCarousel
            lessonDay={lessonDay}
            streak={currentStreak}
            lessonCompleted={todayStreak?.lesson_completed ?? false}
            onPressToday={() => router.push(`/(app)/lesson/${lessonDay}`)}
          />
        </View>

        {/* ── Streak summary ────────────────────────────────────────────────── */}
        <View style={styles.streakRow}>
          <Text style={styles.streakBold}>{currentStreak}-day streak 🔥</Text>
          <Text style={styles.streakGoal}>  ·  Goal {goal}</Text>
        </View>

        {/* ── Daily Check-In card ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.checkinCard,
            todayStreak?.checkin_completed && styles.checkinCardDone,
          ]}
          onPress={() => !todayStreak?.checkin_completed && setCheckInVisible(true)}
          activeOpacity={todayStreak?.checkin_completed ? 1 : 0.8}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.checkinTitle}>
              {todayStreak?.checkin_completed ? 'Check-in Done ✓' : 'Daily Check-In'}
            </Text>
            <Text style={styles.checkinSub}>
              {todayStreak?.checkin_completed
                ? 'You checked in today. Keep it up.'
                : 'How are you feeling today?'}
            </Text>
          </View>
          {!todayStreak?.checkin_completed && (
            <KButton variant="primary" size="sm" onPress={() => setCheckInVisible(true)}>
              Check in
            </KButton>
          )}
        </TouchableOpacity>

        {/* ── Today's Journal ───────────────────────────────────────────────── */}
        <View style={styles.journalSection}>
          <View style={styles.journalHeader}>
            <Text style={styles.journalTitle}>Today's Journal</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/journal')}>
              <Text style={styles.journalLink}>Past entries</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.journalCard, todayStreak?.journal_completed && styles.journalCardDone]}
            onPress={() => router.push('/(app)/journal')}
            activeOpacity={0.8}
          >
            {/* Coach Sloan chip */}
            <View style={styles.journalChip}>
              <View style={styles.journalChipDot} />
              <Text style={styles.journalChipText}>
                FROM COACH SLOAN · DAY {lessonDay}
              </Text>
            </View>

            <Text style={styles.journalPrompt}>
              "What's been pulling at you today — and what do you want to be different by tomorrow?"
            </Text>

            {todayStreak?.journal_completed ? (
              <View style={styles.journalDone}>
                <Text style={styles.journalDoneText}>✓ Entry written today</Text>
              </View>
            ) : (
              <View style={styles.journalInput}>
                <Text style={styles.journalInputPlaceholder}>
                  Start writing — only you and Coach Sloan will see this…
                </Text>
              </View>
            )}

            <View style={styles.journalFooter}>
              <Text style={styles.journalPrivate}>🔒 Private & encrypted</Text>
              <Text style={styles.journalCta}>
                {todayStreak?.journal_completed ? 'Read entry →' : 'Start writing →'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Verse of the Day ─────────────────────────────────────────────── */}
        {verse && (
          <View style={styles.verseCard}>
            <KEyebrow color={Colors.amber500}>For today</KEyebrow>
            <Text style={styles.verseText}>"{verse.text}"</Text>
            <Text style={styles.verseRef}>— {verse.reference}</Text>
          </View>
        )}

      </ScrollView>

      <CheckInSheet
        visible={checkInVisible}
        onClose={() => setCheckInVisible(false)}
        onComplete={handleCheckInComplete}
      />

      <EarnedSheet
        visible={earnedVisible}
        onClose={() => setEarnedVisible(false)}
        streak={currentStreak}
      />
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    gap: 20,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: -4,
  },
  wordmark: {
    height: 28,
    width: 100,
  },

  // Shield banner
  shieldBanner: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.sosRed + '22',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.sosRed + '66',
  },
  shieldBannerText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.sosRed,
    textAlign: 'center',
  },

  // Greeting
  greeting: {
    paddingHorizontal: Spacing.lg,
    gap: 4,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 34,
    fontWeight: '700',
    color: Colors.fg1,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  daySub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg2,
    lineHeight: 20,
  },

  // Carousel
  carouselWrap: {
    marginHorizontal: -Spacing.lg,
  },

  // Streak row
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
  streakBold: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.fg1,
  },
  streakGoal: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg3,
  },

  // Check-in card
  checkinCard: {
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  checkinCardDone: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '0d',
  },
  checkinTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.fg1,
  },
  checkinSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
  },

  // Journal section
  journalSection: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  journalTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.fg1,
    letterSpacing: -0.3,
  },
  journalLink: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald300,
  },
  journalCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.hairlineEmerald,
    padding: 18,
    gap: 14,
  },
  journalCardDone: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '08',
  },
  journalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.emerald500 + '18',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  journalChipDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.emerald500,
  },
  journalChipText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.emerald300,
    letterSpacing: 0.5,
  },
  journalPrompt: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 26,
    color: Colors.fg1,
    letterSpacing: -0.2,
  },
  journalInput: {
    backgroundColor: Colors.bgInset,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.hairlineStrong,
    padding: 14,
    minHeight: 64,
    justifyContent: 'flex-start',
  },
  journalInputPlaceholder: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.fg4,
  },
  journalDone: {
    backgroundColor: Colors.emerald500 + '18',
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
  },
  journalDoneText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.emerald500,
  },
  journalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journalPrivate: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg4,
  },
  journalCta: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald500,
  },

  // Verse
  verseCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgSurface2,
    borderRadius: Radius.xl,
    padding: 18,
    gap: 10,
    borderWidth: 0,
  },
  verseText: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.fg1,
    marginTop: 4,
  },
  verseRef: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.amber500,
  },
});
