import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Fonts, Spacing, Radius } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getVersesForState, SOS_MOTIVATIONAL, VerseMapping } from '../../constants/verses';
import { logSOSEvent } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');
const CAMERA_HEIGHT = height * 0.50;

// ── SVG icons for action cards ─────────────────────────────────────────────────

function BreatheIcon({ color = '#fff', size = 30 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16"
        stroke={color} strokeWidth={1.6} strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="2.5" fill={color} />
    </Svg>
  );
}

function PhoneIcon({ color = '#fff', size = 30 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.62 10.79C8.06 13.62 10.38 15.93 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
        fill={color}
      />
    </Svg>
  );
}

function ChatIcon({ color = '#fff', size = 30 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
        stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round"
      />
      <Circle cx="9" cy="10" r="1" fill={color} />
      <Circle cx="12" cy="10" r="1" fill={color} />
      <Circle cx="15" cy="10" r="1" fill={color} />
    </Svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
}

type Phase = 'main' | 'breathe';

// ── Main component ─────────────────────────────────────────────────────────────

export function SOSModal({ visible, onClose }: SOSModalProps) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('main');
  const [verse, setVerse] = useState<VerseMapping | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);

  // Breathe animation
  const breathScale = useRef(new Animated.Value(1)).current;
  const breathAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);

  const startTime    = useRef<number>(0);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathCancel = useRef(false);

  const loadVerse = useCallback(() => {
    const mood   = profile?.last_mood ?? 'default';
    const verses = getVersesForState(mood as any);
    const picked = verses[Math.floor(Math.random() * verses.length)];
    setVerse(picked ?? null);
  }, [profile?.last_mood]);

  // Request camera permission on first open
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission]);

  // Reset state when opening
  useEffect(() => {
    if (visible) {
      startTime.current = Date.now();
      setPhase('main');
      setTypewriterText('');
      setMessageIndex(0);
      setBreathCount(0);
      loadVerse();
    } else {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
      breathCancel.current = true;
    }
  }, [visible, loadVerse]);

  // Typewriter effect — BOLD ALL-CAPS messages
  useEffect(() => {
    if (!visible || phase !== 'main') return;

    const messages = SOS_MOTIVATIONAL;
    let charIdx = 0;
    let msgIdx  = messageIndex;
    setTypewriterText('');

    const tick = () => {
      const msg = messages[msgIdx % messages.length].toUpperCase();
      if (charIdx < msg.length) {
        setTypewriterText(msg.slice(0, charIdx + 1));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        charIdx++;
        typewriterRef.current = setTimeout(tick, 38);
      } else {
        typewriterRef.current = setTimeout(() => {
          msgIdx++;
          charIdx = 0;
          setMessageIndex(msgIdx);
          setTypewriterText('');
          typewriterRef.current = setTimeout(tick, 400);
        }, 2800);
      }
    };

    typewriterRef.current = setTimeout(tick, 600);
    return () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); };
  }, [visible, phase]);

  // 4-7-8 breathing animation
  useEffect(() => {
    if (!visible || phase !== 'breathe') return;

    breathCancel.current = false;
    breathScale.setValue(1);
    setBreathPhase('inhale');
    setBreathCount(0);

    const runCycle = async () => {
      if (breathCancel.current) return;

      // Inhale 4 s
      setBreathPhase('inhale');
      const inAnim = Animated.timing(breathScale, { toValue: 1.65, duration: 4000, useNativeDriver: true });
      breathAnim.current = inAnim;
      inAnim.start();
      await new Promise<void>(r => setTimeout(r, 4000));
      if (breathCancel.current) return;

      // Hold 7 s
      setBreathPhase('hold');
      await new Promise<void>(r => setTimeout(r, 7000));
      if (breathCancel.current) return;

      // Exhale 8 s
      setBreathPhase('exhale');
      const outAnim = Animated.timing(breathScale, { toValue: 1, duration: 8000, useNativeDriver: true });
      breathAnim.current = outAnim;
      outAnim.start();
      await new Promise<void>(r => setTimeout(r, 8000));
      if (breathCancel.current) return;

      setBreathCount(c => c + 1);
      runCycle();
    };

    runCycle();

    return () => {
      breathCancel.current = true;
      breathAnim.current?.stop();
    };
  }, [visible, phase]);

  const handleClose = async () => {
    breathCancel.current = true;
    if (typewriterRef.current) clearTimeout(typewriterRef.current);

    if (user) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      await logSOSEvent(user.id, {
        emotional_state: profile?.last_mood ?? 'unknown',
        verse_shown: verse?.reference ?? undefined,
        action_taken: phase,
        duration_seconds: duration,
      }).catch(() => {});
    }
    onClose();
  };

  const handleGoToBreath = () => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setPhase('breathe');
  };

  const handleCallPartner = () => {
    // Opens the device phone dialer — user selects their accountability partner
    Linking.openURL('tel:').catch(() =>
      Linking.openURL(Platform.OS === 'ios' ? 'telprompt:' : 'tel:')
    );
  };

  const handleCoachSloan = async () => {
    await handleClose();
    router.push('/(app)/chat');
  };

  const BREATHE_LABELS: Record<string, string> = {
    inhale: 'INHALE',
    hold:   'HOLD',
    exhale: 'EXHALE',
  };

  // ── Breathing exercise phase ────────────────────────────────────────────────
  if (phase === 'breathe') {
    return (
      <Modal visible={visible} animationType="fade" statusBarTranslucent>
        <View style={[styles.breatheScreen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
          {/* Header */}
          <View style={styles.breatheHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('main')}>
              <Text style={styles.backBtnText}>←  Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.breatheContent}>
            <Text style={styles.breatheTitle}>BREATHE WITH ME</Text>
            {breathCount > 0 && (
              <Text style={styles.breatheCycles}>{breathCount} {breathCount === 1 ? 'CYCLE' : 'CYCLES'}</Text>
            )}

            {/* Animated ring */}
            <View style={styles.breatheRingWrap}>
              <Animated.View style={[styles.breatheRingOuter, { transform: [{ scale: breathScale }] }]}>
                <View style={styles.breatheRingInner}>
                  <Text style={styles.breathePhaseLabel}>{BREATHE_LABELS[breathPhase]}</Text>
                  <Text style={styles.breathePhaseNum}>
                    {breathPhase === 'inhale' ? '4s' : breathPhase === 'hold' ? '7s' : '8s'}
                  </Text>
                </View>
              </Animated.View>
            </View>

            <Text style={styles.breatheInstructions}>
              INHALE 4  ·  HOLD 7  ·  EXHALE 8
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Main SOS phase ─────────────────────────────────────────────────────────
  const cameraReady = permission?.granted;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>

        {/* ── Camera section (top half) ──────────────────────────────────── */}
        <View style={[styles.cameraWrap, { height: CAMERA_HEIGHT + insets.top }]}>
          {cameraReady && visible ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="front"
            />
          ) : (
            /* Fallback when camera permission denied */
            <View style={[StyleSheet.absoluteFill, styles.cameraFallback]}>
              <Text style={styles.cameraFallbackEmoji}>🪟</Text>
              <Text style={styles.cameraFallbackText}>
                {permission?.granted === false
                  ? 'Enable camera in Settings to see yourself'
                  : ''}
              </Text>
            </View>
          )}

          {/* Dark vignette overlay — top */}
          <LinearGradient
            colors={['rgba(2,16,12,0.72)', 'transparent']}
            style={[styles.gradientTop, { height: insets.top + 72 }]}
          />

          {/* SOS header — overlaid on camera */}
          <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SOS</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Dark vignette overlay — bottom of camera */}
          <LinearGradient
            colors={['transparent', 'rgba(2,16,12,0.85)']}
            style={styles.gradientBottom}
          />

          {/* "Look at yourself." anchor text at bottom of camera */}
          <View style={styles.anchorTextWrap}>
            <Text style={styles.anchorLine1}>LOOK AT YOURSELF.</Text>
            <Text style={styles.anchorLine2}>YOU'RE STILL HERE.</Text>
          </View>
        </View>

        {/* ── Typewriter + actions (bottom half) ─────────────────────────── */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
          {/* Typewriter — BOLD ALL-CAPS */}
          <View style={styles.typewriterWrap}>
            <Text style={styles.typewriterText} numberOfLines={3}>
              {typewriterText}
              <Text style={styles.cursor}>|</Text>
            </Text>
          </View>

          {/* ── Three action cards ────────────────────────────────────────── */}
          <View style={styles.cardsRow}>
            {/* BREATHE */}
            <TouchableOpacity style={styles.card} onPress={handleGoToBreath} activeOpacity={0.8}>
              <View style={[styles.cardIcon, styles.cardIconGreen]}>
                <BreatheIcon color={Colors.emerald400} size={28} />
              </View>
              <Text style={styles.cardLabel}>BREATHE</Text>
              <Text style={styles.cardSub}>4-7-8 guide</Text>
            </TouchableOpacity>

            {/* CALL PARTNER */}
            <TouchableOpacity style={[styles.card, styles.cardCenter]} onPress={handleCallPartner} activeOpacity={0.8}>
              <View style={[styles.cardIcon, styles.cardIconAmber]}>
                <PhoneIcon color={Colors.amber300} size={28} />
              </View>
              <Text style={styles.cardLabel}>CALL PARTNER</Text>
              <Text style={styles.cardSub}>Accountability</Text>
            </TouchableOpacity>

            {/* COACH SLOAN */}
            <TouchableOpacity style={styles.card} onPress={handleCoachSloan} activeOpacity={0.8}>
              <View style={[styles.cardIcon, styles.cardIconEmerald]}>
                <ChatIcon color={Colors.emerald300} size={28} />
              </View>
              <Text style={styles.cardLabel}>COACH SLOAN</Text>
              <Text style={styles.cardSub}>Message now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Outer shell ────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },

  // ── Camera ────────────────────────────────────────────────────────────────
  cameraWrap: {
    width,
    overflow: 'hidden',
    backgroundColor: Colors.bg2,
  },
  cameraFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.bg2,
  },
  cameraFallbackEmoji: {
    fontSize: 48,
  },
  cameraFallbackText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  // ── SOS header (overlaid on camera) ────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  badge: {
    backgroundColor: Colors.sosRed,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    shadowColor: Colors.sosRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    fontFamily: Fonts.sansExtraBold,
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(2,16,12,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,240,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: Fonts.sansBold,
    color: Colors.fg1,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Anchor text (bottom of camera) ─────────────────────────────────────────
  anchorTextWrap: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
  anchorLine1: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: 2.5,
    textShadowColor: 'rgba(2,16,12,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  anchorLine2: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.emerald400,
    letterSpacing: 2.5,
    textShadowColor: 'rgba(2,16,12,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  // ── Bottom section ──────────────────────────────────────────────────────────
  bottomSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
    gap: 20,
    justifyContent: 'space-between',
  },

  // ── Typewriter ──────────────────────────────────────────────────────────────
  typewriterWrap: {
    minHeight: 72,
    justifyContent: 'flex-start',
  },
  typewriterText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: 0.8,
    lineHeight: 26,
  },
  cursor: {
    color: Colors.sosRed,
    fontWeight: '300',
  },

  // ── Action cards ────────────────────────────────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  cardCenter: {
    borderColor: Colors.hairlineEmerald,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconGreen: {
    backgroundColor: Colors.emerald500 + '20',
    borderWidth: 1,
    borderColor: Colors.emerald500 + '44',
  },
  cardIconAmber: {
    backgroundColor: Colors.amber500 + '20',
    borderWidth: 1,
    borderColor: Colors.amber500 + '44',
  },
  cardIconEmerald: {
    backgroundColor: Colors.emerald400 + '20',
    borderWidth: 1,
    borderColor: Colors.emerald400 + '44',
  },
  cardLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  cardSub: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.fg4,
    textAlign: 'center',
  },

  // ── Breathe phase ───────────────────────────────────────────────────────────
  breatheScreen: {
    flex: 1,
    backgroundColor: Colors.bg1,
    paddingHorizontal: Spacing.lg,
  },
  breatheHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.fg3,
  },
  breatheContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  breatheTitle: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.fg1,
    letterSpacing: 3,
  },
  breatheCycles: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.fg4,
    letterSpacing: 2,
    marginTop: -16,
  },
  breatheRingWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheRingOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.emerald500 + '22',
    borderWidth: 1.5,
    borderColor: Colors.emerald500 + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.emerald500 + '44',
    borderWidth: 1,
    borderColor: Colors.emerald500 + '88',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  breathePhaseLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.emerald400,
    letterSpacing: 2,
  },
  breathePhaseNum: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.emerald300,
    opacity: 0.7,
  },
  breatheInstructions: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.fg4,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
});
