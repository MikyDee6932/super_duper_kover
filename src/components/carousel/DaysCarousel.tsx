import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../../constants/colors';

interface DayItem {
  date: Date;
  lessonCompleted: boolean;
  checkinCompleted: boolean;
  journalCompleted: boolean;
  isToday: boolean;
}

interface DaysCarouselProps {
  days: DayItem[];
  onDayPress?: (day: DayItem) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCompletionDots(day: DayItem): { color: string; key: string }[] {
  const dots = [];
  if (day.lessonCompleted) dots.push({ color: Colors.emerald500, key: 'lesson' });
  if (day.checkinCompleted) dots.push({ color: Colors.amber500, key: 'checkin' });
  if (day.journalCompleted) dots.push({ color: '#9b8cff', key: 'journal' });
  return dots;
}

function DayCell({ day, onPress }: { day: DayItem; onPress?: () => void }) {
  const dots = getCompletionDots(day);
  const isComplete = dots.length === 3;
  const hasAny = dots.length > 0;

  return (
    <TouchableOpacity style={[styles.cell, day.isToday && styles.cellToday]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
        {DAY_LABELS[day.date.getDay()]}
      </Text>
      <View style={[styles.dateCircle, isComplete && styles.dateCircleComplete, day.isToday && !isComplete && styles.dateCircleToday]}>
        <Text style={[styles.dateNum, isComplete && styles.dateNumComplete, day.isToday && !isComplete && styles.dateNumToday]}>
          {day.date.getDate()}
        </Text>
      </View>
      <View style={styles.dots}>
        {dots.map((d) => (
          <View key={d.key} style={[styles.dot, { backgroundColor: d.color }]} />
        ))}
        {!hasAny && <View style={styles.dotEmpty} />}
      </View>
    </TouchableOpacity>
  );
}

export function DaysCarousel({ days, onDayPress }: DaysCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const todayIdx = days.findIndex((d) => d.isToday);
    if (todayIdx > 0 && scrollRef.current) {
      // Scroll to center today
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, (todayIdx - 2) * 72), animated: false });
      }, 100);
    }
  }, [days]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day, idx) => (
        <DayCell key={idx} day={day} onPress={() => onDayPress?.(day)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
    alignItems: 'center',
  },
  cell: {
    width: 56,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  cellToday: {
    backgroundColor: Colors.bg2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.fg4,
    letterSpacing: 0.3,
  },
  dayLabelToday: {
    color: Colors.emerald500,
    fontWeight: '700',
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleToday: {
    borderWidth: 2,
    borderColor: Colors.emerald500,
  },
  dateCircleComplete: {
    backgroundColor: Colors.emerald500,
  },
  dateNum: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.fg2,
  },
  dateNumToday: {
    color: Colors.emerald500,
    fontWeight: '700',
  },
  dateNumComplete: {
    color: '#fff',
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotEmpty: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.hairlineStrong,
  },
});
