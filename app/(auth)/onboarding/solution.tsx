// Kover — "The Solution" educational arc
// 7 screens shown after the problem arc, before the paywall.
// Background travels from bright emerald (screen 1) → dark forest (screen 7)
// — a visual "into the light, then home" journey.
//
// 1. Change starts now
// 2. Welcome to Kover (with wordmark)
// 3. Reject porn — Kover Shield
// 4. Stay connected to God (1 Cor 10:13)
// 5. Thrive in life
// 6. Social proof — three testimonials
// 7. Your plan is ready → "Get Kovered Now" → paywall

import { useState, useMemo, useEffect } from 'react';
import { useOnboardingStore } from '@/store/onboardingStore';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, Colors } from '@/constants/colors';
import Svg, { Path, Line, Circle, G, Ellipse, Polygon, Rect } from 'react-native-svg';

// ── Per-screen colour themes (t = 0 → 1, emerald → dark forest) ─────────────
// Pre-computed from: top [95,230,192]→[14,58,46], mid [43,199,158]→[5,26,20],
// bot [20,164,132]→[2,16,12], ink [2,16,12]→[255,255,240], accent [8,48,40]→[110,224,189]
// All screens use cream/white text — per design spec (whiteText: true on all statement screens).
// isDark: true everywhere so tile/line colours compute from the cream basis.
const THEMES = [
  // 0: Change starts now — bright emerald
  { top: '#5FE6C0', mid: '#2BC79E', bot: '#14A484', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.78)', accent: '#FFFFF0', ctaInk: '#FFFFF0', isDark: true },
  // 1: Welcome to Kover
  { top: '#51C9A8', mid: '#25AA87', bot: '#118B70', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.78)', accent: '#FFFFF0', ctaInk: '#FFFFF0', isDark: true },
  // 2: Reject porn — Shield
  { top: '#44AD92', mid: '#1F8D70', bot: '#0E725C', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.78)', accent: '#FFFFF0', ctaInk: '#FFFFF0', isDark: true },
  // 3: Stay connected to God
  { top: '#379077', mid: '#187159', bot: '#0B5A48', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.78)', accent: '#FFFFF0', ctaInk: '#FFFFF0', isDark: true },
  // 4: Thrive in life
  { top: '#297461', mid: '#125443', bot: '#084234', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.78)', accent: '#6EE0BD', ctaInk: '#FFFFF0', isDark: true },
  // 5: Social proof
  { top: '#1C574B', mid: '#0B382D', bot: '#052920', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.74)', accent: '#6EE0BD', ctaInk: '#FFFFF0', isDark: true },
  // 6: Building your plan — transitional
  { top: '#154840', mid: '#082920', bot: '#031C16', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.74)', accent: '#6EE0BD', ctaInk: '#FFFFF0', isDark: true },
  // 7: Plan is ready — dark forest
  { top: '#0E3A2E', mid: '#051A14', bot: '#02100C', ink: '#FFFFF0', ink2: 'rgba(255,255,240,0.74)', accent: '#6EE0BD', ctaInk: '#FFFFF0', isDark: true },
] as const;

const TOTAL = THEMES.length; // 8

// ── Icons (SVG) ───────────────────────────────────────────────────────────────
function SunriseIcon({ color }: { color: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Line x1={6} y1={38} x2={42} y2={38} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 38a10 10 0 0 1 20 0" fill="rgba(240,180,60,0.22)" stroke="#F0B43C" strokeWidth={2} strokeLinecap="round" />
      <G stroke="#F0B43C" strokeWidth={2} strokeLinecap="round">
        <Line x1={24} y1={10} x2={24} y2={16} />
        <Line x1={10.5} y1={16} x2={14} y2={19} />
        <Line x1={37.5} y1={16} x2={34} y2={19} />
        <Line x1={5} y1={29} x2={9} y2={29} />
        <Line x1={39} y1={29} x2={43} y2={29} />
      </G>
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
      <Path d="M24 5l15 5v11c0 9-6.4 15.4-15 19-8.6-3.6-15-10-15-19V10l15-5z"
        fill="#3B7DD8" stroke="#6FA8E8" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 14v18M17 21h14"
        stroke="#F0B43C" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function FaithIcon({ color }: { color: string }) {
  return (
    <Svg width={60} height={60} viewBox="0 0 48 48" fill="none">
      <Path d="M24 13c-3-2.4-7-3.5-11-3.5-2 0-3.5.3-5 .8v24c1.5-.5 3-.8 5-.8 4 0 8 1.1 11 3.5"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 13c3-2.4 7-3.5 11-3.5 2 0 3.5.3 5 .8v24c-1.5-.5-3-.8-5-.8-4 0-8 1.1-11 3.5z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={24} y1={13} x2={24} y2={37} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M31 14v14M26 19h10"
        stroke="#F0B43C" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function ThriveIcon({ color, tileColor }: { color: string; tileColor: string }) {
  return (
    <Svg width={46} height={46} viewBox="0 0 48 48" fill="none">
      <Path d="M24 40V20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M24 24c0-5-4-9-10-9-1 0-2 .1-3 .4.6 5.4 4.6 9.6 13 8.6z"
        fill={tileColor} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M24 19c0-4.5 3.6-8 9-8 .9 0 1.8.1 2.6.3-.5 4.8-4 8.6-11.6 7.7z"
        fill={tileColor} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17 40h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Small inline feature icons for Plan Ready screen
function IconBook({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 7c-1.6-1.3-3.7-2-6-2-1 0-1.9.1-2.7.4v13c.8-.3 1.7-.4 2.7-.4 2.3 0 4.4.7 6 2" />
      <Path d="M12 7c1.6-1.3 3.7-2 6-2 1 0 1.9.1 2.7.4v13c-.8-.3-1.7-.4-2.7-.4-2.3 0-4.4.7-6 2z" />
      <Line x1={12} y1={7} x2={12} y2={20} />
    </Svg>
  );
}

function IconCoach({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-5.4A8 8 0 1 1 21 11.5z" />
      <Circle cx={9} cy={11.5} r={1} fill={color} stroke="none" />
      <Circle cx={13} cy={11.5} r={1} fill={color} stroke="none" />
      <Circle cx={17} cy={11.5} r={1} fill={color} stroke="none" />
    </Svg>
  );
}

function IconSOS({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l8 4v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V7z" />
      <Line x1={12} y1={8.5} x2={12} y2={13} />
      <Circle cx={12} cy={16} r={0.6} fill={color} stroke={color} />
    </Svg>
  );
}

function IconLibrary({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={4} width={7} height={7} rx={1.5} />
      <Rect x={13} y={4} width={7} height={7} rx={1.5} />
      <Rect x={4} y={13} width={7} height={7} rx={1.5} />
      <Rect x={13} y={13} width={7} height={7} rx={1.5} />
    </Svg>
  );
}

// ── Laurel + stars rating (for Welcome screen) ────────────────────────────────
function LaurelRating({ accentColor }: { accentColor: string }) {
  return (
    <View style={{ alignItems: 'center', marginTop: 28 }}>
      <Svg width={260} height={80} viewBox="0 0 280 80" fill="none">
        {/* Left branch */}
        <G>
          <Path d="M62 12 Q40 40 62 68" fill="none" stroke={accentColor} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />
          {([[54,17,-58],[46,28,-34],[43,40,-8],[46,52,20],[54,63,46]] as [number,number,number][]).map(([x,y,rot],i) => (
            <Ellipse key={i} cx={x} cy={y} rx={9} ry={3.4} fill={accentColor}
              transform={`rotate(${rot} ${x} ${y})`} opacity={0.95} />
          ))}
        </G>
        {/* Right branch mirrored */}
        <G transform="translate(280,0) scale(-1,1)">
          <Path d="M62 12 Q40 40 62 68" fill="none" stroke={accentColor} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />
          {([[54,17,-58],[46,28,-34],[43,40,-8],[46,52,20],[54,63,46]] as [number,number,number][]).map(([x,y,rot],i) => (
            <Ellipse key={i} cx={x} cy={y} rx={9} ry={3.4} fill={accentColor}
              transform={`rotate(${rot} ${x} ${y})`} opacity={0.95} />
          ))}
        </G>
        {/* 5 stars */}
        {[0,1,2,3,4].map((i) => {
          const cx = 140 + (i - 2) * 28;
          const cy = 40;
          const r = 13;
          const pts: string[] = [];
          for (let j = 0; j < 10; j++) {
            const ang = Math.PI / 5 * j - Math.PI / 2;
            const rad = j % 2 === 0 ? r : r * 0.42;
            pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
          }
          return <Polygon key={i} points={pts.join(' ')} fill="#F0B43C" />;
        })}
      </Svg>
    </View>
  );
}

// ── Social proof data ─────────────────────────────────────────────────────────
const QUOTES = [
  { text: 'Freedom from porn isn\'t about willpower — it\'s about being rooted in something greater than the urge.', name: 'Marcus Reed', role: 'Faith podcaster' },
  { text: 'I tried to quit on my own for years. Naming my triggers and leaning on community is what finally broke the cycle.', name: 'Daniel Okafor', role: 'Men\'s ministry leader' },
  { text: 'Recovery grew my marriage and my faith at the same time. This is the work that changes everything.', name: 'Pastor James Cole', role: 'Author & speaker' },
];

// ── Plan features ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: IconBook,    title: 'Daily spiritual refresh lessons',  desc: 'Deepen your faith each day to fight temptation and overcome with God\'s help.' },
  { icon: IconCoach,   title: 'Your own accountability coach Sloan', desc: 'Daily check-ins and unlimited, 24/7 messaging with your own virtual coach.' },
  { icon: IconSOS,     title: 'SOS crisis support',         desc: 'Get through high-urge moments in real time.' },
  { icon: IconLibrary, title: 'Activity and Devotional library', desc: 'A growing collection of tools to help you thrive.' },
];

// ── Shared shell ─────────────────────────────────────────────────────────────
function Shell({
  th, index, children, cta, onContinue, onBack, scroll = false,
}: {
  th: typeof THEMES[number];
  index: number;
  children: React.ReactNode;
  cta: string;
  onContinue: () => void;
  onBack: () => void;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const tileColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.07)`;
  const lineColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.14)`;

  return (
    <LinearGradient
      colors={[th.top, th.mid, th.bot]}
      locations={[0, 0.52, 1]}
      style={{ flex: 1 }}
    >
      <View style={[shell.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>

        {/* Header */}
        <View style={shell.header}>
          <TouchableOpacity
            style={[shell.backCircle, { backgroundColor: tileColor, borderColor: lineColor }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={[shell.backArrow, { color: th.ink }]}>←</Text>
          </TouchableOpacity>

          <View style={shell.dots}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View
                key={i}
                style={[
                  shell.dot,
                  { width: i === index ? 26 : 5 },
                  i === index
                    ? { backgroundColor: th.accent }
                    : { backgroundColor: lineColor },
                ]}
              />
            ))}
          </View>

          <View style={shell.spacer} />
        </View>

        {/* Body */}
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[shell.body, { justifyContent: 'flex-start', paddingBottom: 8 }]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={shell.body}>{children}</View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[shell.cta, {
            backgroundColor: '#02100C',
            borderColor: Colors.emerald500,
            shadowColor: Colors.emerald500,
            shadowOpacity: 0.35,
          }]}
          onPress={onContinue}
          activeOpacity={0.88}
        >
          <Text style={[shell.ctaText, { color: '#FFFFF0' }]}>
            {cta}{'  '}<Text style={{ color: Colors.emerald400 }}>→</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

const shell = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22 },
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 34,
    height: 34,
  },
  backArrow: { fontSize: 18, lineHeight: 22 },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { height: 5, borderRadius: 999 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cta: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
  },
});

// ── Statement screen (screens 0–4) ────────────────────────────────────────────
function StatementScreen({ th, index, icon, title, body, quote, onBack, onContinue }: {
  th: typeof THEMES[number];
  index: number;
  icon?: React.ReactNode;
  title: string;
  body: string;
  quote?: { text: string; ref: string };
  onBack: () => void;
  onContinue: () => void;
}) {
  const tileColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.08)`;
  const lineColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.14)`;

  return (
    <Shell th={th} index={index} cta="Continue" onContinue={onContinue} onBack={onBack} scroll={!!quote}>
      {icon && (
        <View style={[stmt.iconTile, { backgroundColor: tileColor, borderColor: lineColor }]}>
          {icon}
        </View>
      )}
      <Text style={[stmt.title, { color: th.ink }]}>{title}</Text>
      <Text style={[stmt.body, { color: th.ink2, fontFamily: Fonts.sansMedium }]}>{body}</Text>
      {quote && (
        <View style={[stmt.quoteBlock, { borderTopColor: lineColor }]}>
          <Text style={[stmt.quoteText, { color: th.ink }]}>"{quote.text}"</Text>
          <Text style={[stmt.quoteRef, { color: '#F0B43C' }]}>{quote.ref}</Text>
        </View>
      )}
    </Shell>
  );
}

const stmt = StyleSheet.create({
  iconTile: {
    width: 92,
    height: 92,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 36,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  body: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 330,
  },
  quoteBlock: {
    marginTop: 26,
    borderTopWidth: 1,
    paddingTop: 22,
    width: '100%',
    maxWidth: 330,
  },
  quoteText: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 10,
  },
  quoteRef: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

// ── Welcome screen (screen 1 — with wordmark + laurel) ────────────────────────
function WelcomeScreen({ th, index, onBack, onContinue }: {
  th: typeof THEMES[number];
  index: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Shell th={th} index={index} cta="Continue" onContinue={onContinue} onBack={onBack}>
      <Text style={[welcome.above, { color: th.ink }]}>Welcome to</Text>
      <Image
        source={require('../../../assets/logo-wordmark-cream.png')}
        style={welcome.logo}
        resizeMode="contain"
      />
      <Text style={[welcome.body, { color: th.ink2, fontFamily: Fonts.sansMedium }]}>
        Kover is on a mission to help millions of believers — using faith and science-backed tools to not just survive, but thrive in life.
      </Text>
      <LaurelRating accentColor={th.accent} />
    </Shell>
  );
}

const welcome = StyleSheet.create({
  above: {
    fontFamily: Fonts.display,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 220,
    height: 52,
    marginBottom: 4,
  },
  body: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 330,
    marginTop: 16,
  },
});

// ── Social proof screen (screen 5) ────────────────────────────────────────────
function QuotesScreen({ th, index, onBack, onContinue }: {
  th: typeof THEMES[number];
  index: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const tileColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.08)`;
  const lineColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.12)`;
  const initBg    = th.accent;
  const initInk   = th.isDark ? '#02100C' : '#FFFFF0';

  return (
    <Shell th={th} index={index} cta="Continue" onContinue={onContinue} onBack={onBack} scroll>
      <Text style={[quotes.heading, { color: th.ink }]}>You're not walking{'\n'}this alone.</Text>
      <Text style={[quotes.sub, { color: th.ink2, fontFamily: Fonts.sansMedium }]}>
        Voices from the faith community on the freedom that's possible.
      </Text>

      <View style={quotes.cards}>
        {QUOTES.map((q, i) => (
          <View key={i} style={[quotes.card, { backgroundColor: tileColor, borderColor: lineColor }]}>
            <View style={quotes.stars}>
              {[0,1,2,3,4].map((s) => <Text key={s} style={[quotes.star, { color: th.accent }]}>★</Text>)}
            </View>
            <Text style={[quotes.quoteText, { color: th.ink }]}>"{q.text}"</Text>
            <View style={quotes.author}>
              <View style={[quotes.avatar, { backgroundColor: initBg }]}>
                <Text style={[quotes.avatarText, { color: initInk }]}>
                  {q.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </Text>
              </View>
              <View>
                <Text style={[quotes.name, { color: th.ink }]}>{q.name}</Text>
                <Text style={[quotes.role, { color: th.ink2 }]}>{q.role}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Shell>
  );
}

const quotes = StyleSheet.create({
  heading: {
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 6,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 22,
  },
  cards: { gap: 12, width: '100%' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  stars: { flexDirection: 'row', gap: 3, marginBottom: 10 },
  star: { fontSize: 13 },
  quoteText: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    fontWeight: '700',
  },
  role: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
  },
});

// ── Building plan screen (screen 6) ──────────────────────────────────────────
function BuildingPlanScreen({ th, index, onComplete }: {
  th: typeof THEMES[number];
  index: number;
  onComplete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const lineColor = 'rgba(255,255,240,0.12)';

  useEffect(() => {
    const DURATION = 5000;
    const TICK = 50;
    const steps = DURATION / TICK;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const pct = Math.min((current / steps) * 100, 100);
      setProgress(pct);
      if (current >= steps) {
        clearInterval(timer);
        onComplete();
      }
    }, TICK);

    return () => clearInterval(timer);
  }, []);

  return (
    <LinearGradient
      colors={[th.top, th.mid, th.bot]}
      locations={[0, 0.52, 1]}
      style={{ flex: 1 }}
    >
      <View style={[building.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}>

        {/* Progress dots — no back button on a timed screen */}
        <View style={building.dotsRow}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View
              key={i}
              style={[
                building.dot,
                { width: i === index ? 26 : 5 },
                i === index ? { backgroundColor: th.accent } : { backgroundColor: lineColor },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={building.content}>
          <Text style={[building.label, { color: th.ink }]}>Building your Kover plan...</Text>

          {/* Track */}
          <View style={[building.track, { borderColor: lineColor }]}>
            <View
              style={[
                building.fill,
                { width: `${Math.round(progress)}%` as any, backgroundColor: th.accent },
              ]}
            />
          </View>

          {/* Percentage */}
          <Text style={[building.pct, { color: th.accent }]}>{Math.round(progress)}%</Text>
        </View>

      </View>
    </LinearGradient>
  );
}

const building = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    gap: 0,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    marginBottom: 4,
  },
  dot: {
    height: 5,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,240,0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  pct: {
    fontFamily: Fonts.display,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

// ── Plan ready screen (screen 7) ─────────────────────────────────────────────
function PlanReadyScreen({ th, index, onBack, onContinue }: {
  th: typeof THEMES[number];
  index: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { answers } = useOnboardingStore();
  const firstName = answers.full_name?.trim().split(' ')[0] ?? null;

  const tileColor = `rgba(255,255,240,0.08)`;
  const lineColor = `rgba(255,255,240,0.12)`;

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  return (
    <Shell th={th} index={index} cta="Get Kovered Now" onContinue={onContinue} onBack={onBack} scroll>
      <Text style={plan.eyebrow}>Your plan is ready</Text>

      <Text style={plan.heading}>
        {firstName ? `${firstName}, we've got your plan ready.` : `We've got your plan ready.`}
      </Text>

      {/* Target date card */}
      <View style={[plan.dateCard, { backgroundColor: tileColor, borderColor: lineColor }]}>
        <View style={[plan.dateIcon, { backgroundColor: th.accent }]}>
          <Text style={plan.dateCheck}>✓</Text>
        </View>
        <View>
          <Text style={[plan.dateLabel, { color: th.ink2, fontFamily: Fonts.sansMedium }]}>You can quit porn by</Text>
          <Text style={[plan.dateValue, { color: th.ink }]}>{targetDate}</Text>
        </View>
      </View>

      <Text style={[plan.sub, { color: th.ink2, fontFamily: Fonts.sansMedium }]}>
        It's more than willpower — it's a plan with tools designed for you.
      </Text>

      {/* Feature list */}
      <View style={plan.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[plan.featureRow, { backgroundColor: tileColor, borderColor: lineColor }]}>
            <View style={[plan.featureIcon, { borderColor: lineColor }]}>
              <f.icon color={th.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[plan.featureTitle, { color: th.ink }]}>{f.title}</Text>
              <Text style={[plan.featureDesc, { color: th.ink2, fontFamily: Fonts.sansMedium }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </Shell>
  );
}

const plan = StyleSheet.create({
  eyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#6EE0BD',
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFF0',
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 330,
    marginBottom: 10,
  },
  dateCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 8,
  },
  dateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateCheck: {
    fontSize: 22,
    color: '#02100C',
    fontWeight: '700',
  },
  dateLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
  },
  dateValue: {
    fontFamily: Fonts.display,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    textAlign: 'left',
    width: '100%',
    marginBottom: 12,
    lineHeight: 18,
  },
  features: { gap: 10, width: '100%' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  featureDesc: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
});

// ── Main controller ───────────────────────────────────────────────────────────
export default function Solution() {
  const [index, setIndex] = useState(0);
  const th = THEMES[index];

  const goBack = () => {
    if (index === 0) router.back();
    else setIndex(index - 1);
  };

  const goNext = () => {
    if (index === TOTAL - 1) {
      // "Get Kovered Now" → paywall
      router.replace('/paywall');
    } else {
      setIndex(index + 1);
    }
  };

  const tileColor = `rgba(${th.isDark ? '255,255,240' : '0,0,0'},0.08)`;

  // Screen 1: Welcome to Kover (logo variant)
  if (index === 1) {
    return <WelcomeScreen th={th} index={index} onBack={goBack} onContinue={goNext} />;
  }

  // Screen 5: Social proof
  if (index === 5) {
    return <QuotesScreen th={th} index={index} onBack={goBack} onContinue={goNext} />;
  }

  // Screen 6: Building plan (timed, auto-advances)
  if (index === 6) {
    return <BuildingPlanScreen th={th} index={index} onComplete={goNext} />;
  }

  // Screen 7: Plan ready
  if (index === 7) {
    return <PlanReadyScreen th={th} index={index} onBack={goBack} onContinue={goNext} />;
  }

  // Screens 0, 2, 3, 4: Statement screens
  const STATEMENTS = [
    {
      icon: <SunriseIcon color={th.ink} />,
      title: 'Change starts now.',
      body: 'Overcoming porn is possible — and you\'ve come to the right place. By rejecting porn, re-wiring your brain, and anchoring yourself in God, you can not just recover but live a transformed life.',
    },
    null, // index 1 handled above (Welcome)
    {
      icon: <ShieldIcon />,
      title: 'Reject porn.',
      body: 'Kover Shield stands guard 24/7 by blocking all adult content on your device, learning your habits and triggers to help you overcome temptation the moment it strikes.',
    },
    {
      icon: <FaithIcon color={th.ink} />,
      title: 'Stay connected to God.',
      body: 'Daily lessons and faith-based practices help deepen your faith and guard against setbacks — one steady day at a time.',
      quote: {
        text: 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.',
        ref: '1 Corinthians 10:13',
      },
    },
    {
      icon: <ThriveIcon color={th.accent} tileColor={tileColor} />,
      title: 'Thrive in life.',
      body: 'Kover builds a plan to help you re-wire your habits, grow strong, deepen your faith, and live to your fullest God-given potential.',
    },
  ];

  const s = STATEMENTS[index]!;
  return (
    <StatementScreen
      th={th}
      index={index}
      icon={s.icon}
      title={s.title}
      body={s.body}
      quote={(s as any).quote}
      onBack={goBack}
      onContinue={goNext}
    />
  );
}
