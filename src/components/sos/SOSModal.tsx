import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useStreakStore } from '../../store/streakStore';
import { getVersesForState, SOS_MOTIVATIONAL, VerseMapping } from '../../constants/verses';
import { logSOSEvent } from '../../lib/supabase';
import { KButton } from '../ui/KButton';

const { width, height } = Dimensions.get('window');

const MESSAGES = [
  'You are stronger than this moment.',
  'This feeling will pass. Hold on.',
  'You have come too far to give up now.',
];

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
}

type Phase = 'verse' | 'breathe';

export function SOSModal({ visible, onClose }: SOSModalProps) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const { todayStreak } = useStreakStore();

  const [phase, setPhase] = useState<Phase>('verse');
  const [verse, setVerse] = useState<VerseMapping | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [breathScale] = useState(new Animated.Value(1));
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const startTime = useRef<number>(0);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadVerse = useCallback(() => {
    const mood = profile?.last_mood ?? 'default';
    const verses = getVersesForState(mood as any);
    const picked = verses[Math.floor(Math.random() * verses.length)];
    setVerse(picked ?? null);
  }, [profile?.last_mood]);

  useEffect(() => {
    if (visible) {
      startTime.current = Date.now();
      setPhase('verse');
      setTypewriterText('');
      setMessageIndex(0);
      loadVerse();
    } else {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    }
  }, [visible, loadVerse]);

  // Typewriter effect for motivational messages
  useEffect(() => {
    if (!visible || phase !== 'verse') return;

    const messages = SOS_MOTIVATIONAL;
    let charIdx = 0;
    let msgIdx = messageIndex;
    setTypewriterText('');

    const tick = () => {
      const msg = messages[msgIdx % messages.length];
      if (charIdx < msg.length) {
        setTypewriterText(msg.slice(0, charIdx + 1));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        charIdx++;
        typewriterRef.current = setTimeout(tick, 40);
      } else {
        // pause then advance to next message
        typewriterRef.current = setTimeout(() => {
          msgIdx++;
          charIdx = 0;
          setMessageIndex(msgIdx);
          setTypewriterText('');
          typewriterRef.current = setTimeout(tick, 400);
        }, 2500);
      }
    };

    typewriterRef.current = setTimeout(tick, 500);
    return () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); };
  }, [visible, phase]);

  // 4-7-8 breathing animation
  useEffect(() => {
    if (!visible || phase !== 'breathe') return;

    let cancelled = false;

    const runCycle = async () => {
      // Inhale 4s
      setBreathPhase('inhale');
      Animated.timing(breathScale, { toValue: 1.6, duration: 4000, useNativeDriver: true }).start();
      await new Promise(r => setTimeout(r, 4000));
      if (cancelled) return;

      // Hold 7s
      setBreathPhase('hold');
      await new Promise(r => setTimeout(r, 7000));
      if (cancelled) return;

      // Exhale 8s
      setBreathPhase('exhale');
      Animated.timing(breathScale, { toValue: 1, duration: 8000, useNativeDriver: true }).start();
      await new Promise(r => setTimeout(r, 8000));
      if (cancelled) return;

      setBreathCount(c => c + 1);
      runCycle();
    };

    runCycle();
    return () => { cancelled = true; };
  }, [visible, phase]);

  const handleClose = async () => {
    if (user) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      await logSOSEvent(user.id, {
        emotional_state: profile?.last_mood ?? 'unknown',
        verse_shown: verse?.reference ?? undefined,
        action_taken: phase,
        duration_seconds: duration,
      });
    }
    onClose();
  };

  const BREATHE_LABELS: Record<string, string> = {
    inhale: 'Inhale...',
    hold: 'Hold...',
    exhale: 'Exhale...',
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SOS</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {phase === 'verse' ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Verse */}
            {verse && (
              <View style={styles.verseBlock}>
                <Text style={styles.verseText}>"{verse.text}"</Text>
                <Text style={styles.verseRef}>— {verse.reference}</Text>
              </View>
            )}

            {/* Typewriter */}
            <View style={styles.typewriterBlock}>
              <Text style={styles.typewriterText}>
                {typewriterText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <KButton
                variant="secondary"
                full
                onPress={() => setPhase('breathe')}
              >
                4-7-8 Breathing
              </KButton>

              <KButton
                variant="secondary"
                full
                onPress={() => Linking.openURL('tel:988')}
              >
                Call Crisis Line (988)
              </KButton>

              <KButton
                variant="primary"
                full
                onPress={() => {
                  handleClose();
                  // Navigate to chat — handled by parent
                }}
              >
                Talk to Coach Sloan
              </KButton>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.breatheContainer}>
            <Text style={styles.breatheTitle}>Breathe with me</Text>
            <Text style={styles.breatheCount}>{breathCount > 0 ? `${breathCount} cycles` : ''}</Text>

            <Animated.View style={[styles.breatheCircle, { transform: [{ scale: breathScale }] }]}>
              <View style={styles.breatheInner}>
                <Text style={styles.breatheLabel}>{BREATHE_LABELS[breathPhase]}</Text>
              </View>
            </Animated.View>

            <Text style={styles.breatheInstructions}>
              Inhale for 4 · Hold for 7 · Exhale for 8
            </Text>

            <KButton variant="text" onPress={() => setPhase('verse')}>
              Back
            </KButton>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  badge: {
    backgroundColor: Colors.sosRed,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.fg3,
    fontSize: 16,
  },
  content: {
    gap: Spacing.xl,
  },
  verseBlock: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: 12,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.fg1,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  verseRef: {
    fontSize: 13,
    color: Colors.emerald500,
    fontWeight: '600',
  },
  typewriterBlock: {
    minHeight: 60,
    justifyContent: 'center',
  },
  typewriterText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.fg1,
    lineHeight: 30,
    fontFamily: Fonts.display,
  },
  cursor: {
    color: Colors.emerald500,
    fontWeight: '300',
  },
  actions: {
    gap: 12,
    marginTop: Spacing.md,
  },
  breatheContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  breatheTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.fg1,
    fontFamily: Fonts.display,
  },
  breatheCount: {
    fontSize: 13,
    color: Colors.fg4,
  },
  breatheCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.emerald500 + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.emerald500 + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.emerald500,
  },
  breatheInstructions: {
    fontSize: 13,
    color: Colors.fg4,
    textAlign: 'center',
  },
});
