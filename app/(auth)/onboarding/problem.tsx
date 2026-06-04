// Kover — "The Problem" educational arc
// 4 screens shown after the quiz, before the solution arc.
// Deep oxblood-red gradient signals a tonal break — this is serious.

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '@/constants/colors';
import Svg, { Path, Line, Rect, Circle, G } from 'react-native-svg';

// ── Problem palette (oxblood / coral) ────────────────────────────────────────
const P = {
  deep:       '#1C0605',
  base:       '#3A0D0A',
  rise:       '#5E140E',
  line:       'rgba(255,236,230,0.12)',
  lineStrong: 'rgba(255,236,230,0.20)',
  tile:       'rgba(255,236,230,0.07)',
  ink:        '#FFF3EF',
  ink2:       'rgba(255,243,239,0.74)',
  accent:     '#F2B5A1',
} as const;

// ── Icons (coral SVG outlines on red) ────────────────────────────────────────
function RelationshipIcon() {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
      <Path d="M24 41C13 33 6 26.5 6 18.5 6 13 10 9 15 9c3.3 0 6.2 1.8 7.6 4.5"
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 41c11-8 18-14.5 18-22.5C42 13 38 9 33 9c-3.3 0-6.2 1.8-7.6 4.5"
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 13l-3.2 7.5 6 4-4 8.5"
        stroke={P.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DrugIcon() {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
      <Rect x={9} y={20} width={30} height={14} rx={7}
        transform="rotate(-40 24 27)"
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={20.5} y1={15.5} x2={30.5} y2={27}
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" />
      <Path d="M37 9v6M34 12h6"
        stroke={P.ink} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function DesignIcon() {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
      <Circle cx={18} cy={28} r={9}
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={30} cy={28} r={9}
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 13l-2.5 6h5L18 25"
        stroke={P.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MindIcon() {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={18}
        stroke={P.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 20.5h.02M31 20.5h.02"
        stroke={P.ink} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M16.5 33c2.2-4 12.8-4 15 0"
        stroke={P.ink} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

// ── Problem content ───────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    icon: <RelationshipIcon />,
    title: 'Porn destroys real relationships.',
    body: 'Heavier use is tied to lower relationship and sexual satisfaction — eroding trust, closeness, and stability with the people you love most.',
  },
  {
    icon: <DrugIcon />,
    title: 'Porn is a drug — not to be messed with.',
    body: 'Its mix of novelty and on-demand arousal floods the brain\'s reward system with dopamine, conditioning you toward more cravings while dulling your response to everyday joys.',
  },
  {
    icon: <DesignIcon />,
    title: 'Porn cheats the design God made for sex.',
    body: 'It trades real intimacy for a counterfeit — objectifying your current or future partner with a false image, feeding unrealistic expectations that leave you feeling inadequate.',
  },
  {
    icon: <MindIcon />,
    title: 'Porn eats away at your happiness.',
    body: 'Regular use is linked to higher depression, anxiety, stress and anti-social behaviour — a cycle of brief relief followed by guilt that reduces your mental happiness.',
  },
];

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Problem() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const problem = PROBLEMS[index];
  const isLast = index === PROBLEMS.length - 1;

  const goNext = () => {
    if (isLast) {
      router.push('/(auth)/onboarding/solution');
    } else {
      setIndex(index + 1);
    }
  };

  const goBack = () => {
    if (index === 0) router.back();
    else setIndex(index - 1);
  };

  return (
    <LinearGradient
      colors={[P.rise, P.base, P.deep]}
      locations={[0, 0.42, 1]}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={goBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.dots}>
            {PROBLEMS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { width: i === index ? 26 : 5 },
                  i === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <View style={styles.spacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconTile}>
            {problem.icon}
          </View>
          <Text style={styles.title}>{problem.title}</Text>
          <Text style={styles.body}>{problem.body}</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={goNext} activeOpacity={0.88}>
          <Text style={styles.ctaText}>
            {isLast ? 'I\'m ready for change  →' : 'Continue  →'}
          </Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P.tile,
    borderWidth: 1,
    borderColor: P.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 34,
    height: 34,
  },
  backArrow: {
    fontSize: 18,
    color: P.ink,
    lineHeight: 22,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: P.accent,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,236,230,0.22)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iconTile: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: P.tile,
    borderWidth: 1,
    borderColor: P.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: P.ink2,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 330,
  },
  cta: {
    backgroundColor: P.ink,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    color: P.deep,
  },
});
