import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing } from '../../constants/colors';
import { KButton } from '../ui/KButton';

interface EarnedSheetProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
  title?: string;
  message?: string;
}

const MILESTONE_MESSAGES: Record<number, { title: string; message: string }> = {
  1: { title: 'Day 1 Complete!', message: 'The first step is the hardest. You showed up.' },
  7: { title: 'One Week Strong!', message: 'Seven days of choosing freedom. You\'re building momentum.' },
  14: { title: 'Two Weeks!', message: 'Two weeks of victory. Your brain is rewiring itself right now.' },
  21: { title: '21 Days!', message: 'They say habits form in 21 days. You just proved it.' },
  30: { title: '30 Days Free!', message: 'One full month. This is a new you.' },
  60: { title: '60 Days!', message: 'Two months of walking in freedom. God is so proud of you.' },
  90: { title: '90 Days!', message: 'Three months of transformation. You are an overcomer.' },
};

function getStreakMessage(streak: number): { title: string; message: string } {
  if (MILESTONE_MESSAGES[streak]) return MILESTONE_MESSAGES[streak];
  if (streak > 90) return { title: `${streak} Days Free!`, message: 'You are living proof that freedom is possible.' };
  return { title: 'Streak Extended!', message: 'Another day choosing freedom. Keep going.' };
}

// Simple confetti dots
function Confetti() {
  const DOTS = Array.from({ length: 20 }, (_, i) => ({
    key: i,
    x: Math.random() * 300,
    delay: Math.random() * 600,
    color: [Colors.emerald500, Colors.amber500, Colors.cream50, '#9b8cff'][Math.floor(Math.random() * 4)],
    size: 6 + Math.random() * 8,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {DOTS.map((dot) => {
        const anim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200,
            delay: dot.delay,
            useNativeDriver: true,
          }).start();
        }, []);
        return (
          <Animated.View
            key={dot.key}
            style={{
              position: 'absolute',
              left: dot.x,
              top: 0,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: dot.color,
              opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }) }],
            }}
          />
        );
      })}
    </View>
  );
}

export function EarnedSheet({ visible, onClose, streak, title, message }: EarnedSheetProps) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const content = getStreakMessage(streak);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <Confetti />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 24 },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
          <Text style={styles.title}>{title ?? content.title}</Text>
          <Text style={styles.message}>{message ?? content.message}</Text>
          <KButton variant="earned" full onPress={onClose}>
            Keep Going
          </KButton>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: Colors.bg1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.emerald500 + '44',
  },
  streakNum: {
    fontFamily: Fonts.display,
    fontSize: 72,
    fontWeight: '800',
    color: Colors.emerald500,
    lineHeight: 80,
  },
  streakLabel: {
    fontSize: 16,
    color: Colors.fg3,
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.fg1,
    textAlign: 'center',
    fontFamily: Fonts.display,
  },
  message: {
    fontSize: 15,
    color: Colors.fg3,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
});
