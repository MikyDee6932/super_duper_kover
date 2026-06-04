import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/colors';

type StepStatus = 'completed' | 'active' | 'locked';

interface TimelineStepProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  status: StepStatus;
  isLast?: boolean;
  onPress?: () => void;
}

const STEP_ICONS: Record<number, string> = {
  1: '📖',
  2: '✍️',
  3: '📔',
  4: '🙏',
};

export function TimelineStep({ stepNumber, title, subtitle, status, isLast, onPress }: TimelineStepProps) {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isLocked = status === 'locked';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.7}
      disabled={isLocked}
    >
      {/* Line connector */}
      {!isLast && (
        <View style={[styles.line, isCompleted && styles.lineCompleted]} />
      )}

      {/* Circle */}
      <View style={[styles.circle, isCompleted && styles.circleCompleted, isActive && styles.circleActive, isLocked && styles.circleLocked]}>
        {isCompleted ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={[styles.stepIcon, isLocked && styles.stepIconLocked]}>
            {STEP_ICONS[stepNumber] ?? stepNumber.toString()}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, isActive && styles.contentActive]}>
        <Text style={[styles.title, isLocked && styles.titleLocked, isActive && styles.titleActive]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, isLocked && styles.subtitleLocked]}>
            {subtitle}
          </Text>
        )}
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Continue →</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    position: 'relative',
    paddingBottom: 24,
  },
  line: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.hairline,
  },
  lineCompleted: {
    backgroundColor: Colors.emerald500,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg2,
    borderWidth: 2,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleCompleted: {
    backgroundColor: Colors.emerald500,
    borderColor: Colors.emerald500,
  },
  circleActive: {
    borderColor: Colors.emerald500,
    borderWidth: 2,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  circleLocked: {
    opacity: 0.4,
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  stepIcon: {
    fontSize: 18,
  },
  stepIconLocked: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingTop: 6,
    gap: 4,
  },
  contentActive: {
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.emerald500 + '44',
    marginTop: -6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.fg2,
  },
  titleActive: {
    color: Colors.fg1,
    fontWeight: '700',
  },
  titleLocked: {
    color: Colors.fg4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.fg4,
  },
  subtitleLocked: {
    opacity: 0.6,
  },
  activeBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.emerald500,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
