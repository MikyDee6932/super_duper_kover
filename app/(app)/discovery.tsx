import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Line, G, Path } from 'react-native-svg';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KCard } from '@/components/ui/KCard';
import { KEyebrow } from '@/components/ui/KEyebrow';

// ── Category motifs — abstract SVGs from the design kit, never literal ─────────

function SoundMotif() {
  const bars = [10, 22, 38, 50, 38, 22, 10, 18, 30, 18];
  return (
    <Svg width={86} height={72} viewBox="0 0 120 100">
      {bars.map((h, i) => (
        <Rect
          key={i}
          x={6 + i * 11}
          y={50 - h / 2}
          width={6}
          height={h}
          rx={3}
          fill={Colors.emerald400}
          opacity={0.55 + (i % 3) * 0.12}
        />
      ))}
    </Svg>
  );
}

function BreathMotif() {
  return (
    <Svg width={86} height={72} viewBox="0 0 120 100">
      <Circle cx={80} cy={50} r={40} stroke={Colors.emerald400} strokeOpacity={0.35} fill="none" strokeWidth={1.2} />
      <Circle cx={80} cy={50} r={28} stroke={Colors.emerald400} strokeOpacity={0.55} fill="none" strokeWidth={1.2} />
      <Circle cx={80} cy={50} r={16} stroke={Colors.emerald300} strokeOpacity={0.85} fill="none" strokeWidth={1.4} />
      <Circle cx={80} cy={50} r={4} fill={Colors.emerald300} />
    </Svg>
  );
}

function GamesMotif() {
  const dots = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 6; x++) {
      dots.push(
        <Circle key={`${x}-${y}`} cx={10 + x * 18} cy={10 + y * 18} r={1.6} fill={Colors.amber300} opacity={0.5} />,
      );
    }
  }
  return (
    <Svg width={86} height={72} viewBox="0 0 120 100">
      {dots}
      <Rect x={60} y={34} width={44} height={44} rx={10} fill="none" stroke={Colors.amber300} strokeWidth={1.4} opacity={0.7} />
      <Circle cx={72} cy={46} r={3} fill={Colors.amber300} opacity={0.9} />
      <Circle cx={92} cy={66} r={3} fill={Colors.amber300} opacity={0.9} />
      <Circle cx={82} cy={56} r={3} fill={Colors.amber300} opacity={0.9} />
    </Svg>
  );
}

function ScienceMotif() {
  return (
    <Svg width={86} height={72} viewBox="0 0 120 100">
      <G stroke={Colors.dusk300} strokeOpacity={0.55} strokeWidth={1.2} fill="none">
        <Circle cx={46} cy={38} r={4} />
        <Circle cx={78} cy={34} r={4} />
        <Circle cx={64} cy={62} r={4} />
        <Circle cx={94} cy={62} r={4} />
        <Line x1={50} y1={38} x2={74} y2={34} />
        <Line x1={78} y1={38} x2={64} y2={58} />
        <Line x1={46} y1={42} x2={60} y2={58} />
        <Line x1={68} y1={62} x2={90} y2={62} />
      </G>
      <G fill={Colors.dusk300} fillOpacity={0.85}>
        <Circle cx={46} cy={38} r={2} />
        <Circle cx={78} cy={34} r={2} />
        <Circle cx={64} cy={62} r={2} />
        <Circle cx={94} cy={62} r={2} />
      </G>
    </Svg>
  );
}

function ArrowRightIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={Colors.cream50} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Categories — copy, tints, and accents from the design kit ──────────────────

type CategoryId = 'sound' | 'meditation' | 'games' | 'science';

interface Category {
  id: CategoryId;
  title: string;
  desc: string;
  count: string | null;
  soon?: boolean;
  tint: string;
  gradient?: readonly [string, string];
  border: string;
  accent: string;
  Motif: () => React.ReactElement;
}

const CATEGORIES: Category[] = [
  {
    id: 'sound',
    title: 'Soundscapes',
    desc: 'Calm the system. Forest rain, low hum, ocean.',
    count: null,
    soon: true,
    tint: 'rgba(20,164,132,0.10)',
    border: Colors.hairlineEmerald,
    accent: Colors.emerald300,
    Motif: SoundMotif,
  },
  {
    id: 'meditation',
    title: 'Guided Meditations & Prayers',
    desc: 'Sit with what is. Audio guidance, 3–20 minutes.',
    count: '18 sessions',
    tint: Colors.forest900,
    gradient: [Colors.forest900, Colors.forest800],
    border: Colors.hairlineEmerald,
    accent: Colors.cream50,
    Motif: BreathMotif,
  },
  {
    id: 'games',
    title: 'Games & Surveys',
    desc: 'Quick interactive practice. Notice patterns, play.',
    count: null,
    soon: true,
    tint: 'rgba(224,166,99,0.10)',
    border: 'rgba(224,166,99,0.30)',
    accent: Colors.amber300,
    Motif: GamesMotif,
  },
  {
    id: 'science',
    title: 'Learn the Science',
    desc: 'Bite-sized lessons on the brain, urges, and rewiring.',
    count: null,
    soon: true,
    tint: Colors.forest800,
    border: Colors.hairline,
    accent: Colors.dusk300,
    Motif: ScienceMotif,
  },
];

// Sub-library content per category (from the design kit)
const LIBRARY: Record<CategoryId, { tag: string; title: string; desc: string }[]> = {
  sound: [
    { tag: '12 min', title: 'Pine forest, after rain', desc: 'Soft droplets, distant birds.' },
    { tag: 'Loop',   title: 'Low brown noise',          desc: 'A steady, calming floor.' },
    { tag: '18 min', title: 'Ocean at dawn',            desc: 'Slow waves, no music.' },
    { tag: '8 min',  title: 'Cabin fireplace',          desc: 'Wood crackle, no voice.' },
    { tag: 'Loop',   title: 'Cathedral hum',            desc: 'Reverb tail, very low.' },
  ],
  meditation: [
    { tag: '5 min',  title: 'The 90-second wave',       desc: 'Ride one urge without acting.' },
    { tag: '10 min', title: 'Body scan, lying down',    desc: 'Notice without naming.' },
    { tag: '7 min',  title: 'Evening examen',           desc: 'A gentle review of the day.' },
    { tag: '12 min', title: 'Psalm 23 · slow read',     desc: 'Lectio divina, guided.' },
    { tag: '3 min',  title: 'Box breathing',            desc: 'Inhale 4, hold 4, exhale 4.' },
  ],
  games: [
    { tag: 'Game',   title: 'Urge surfing',             desc: 'Tap to ride the wave.' },
    { tag: 'Survey', title: 'Trigger map',              desc: 'Find your hot moments.' },
    { tag: 'Game',   title: 'Name the thought',         desc: 'Quick cognitive sorting.' },
    { tag: 'Survey', title: 'Weekly check-up',          desc: '8 questions, ~2 minutes.' },
    { tag: 'Game',   title: 'Pause + 10 breaths',       desc: 'Beat your last hold.' },
  ],
  science: [],
};

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function Discovery() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<CategoryId | null>(null);

  const openCat = open ? CATEGORIES.find((c) => c.id === open)! : null;

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {openCat ? (
          // ── Sub-library ─────────────────────────────────────────────────────
          <>
            <View style={styles.backRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setOpen(null)} activeOpacity={0.7}>
                <ChevronLeftIcon />
              </TouchableOpacity>
              <KEyebrow color={openCat.accent}>Discovery</KEyebrow>
            </View>

            <View style={styles.subHeader}>
              <Text style={styles.subTitle}>{openCat.title}</Text>
              <Text style={styles.subDesc}>{openCat.desc}</Text>
            </View>

            <View style={styles.libraryList}>
              {LIBRARY[openCat.id].map((m) => (
                <KCard key={m.title} padding={16}>
                  <View style={styles.tagRow}>
                    <View style={styles.tagPill}>
                      <Text style={[styles.tagText, { color: openCat.accent }]}>{m.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemTitle}>{m.title}</Text>
                  <Text style={styles.itemDesc}>{m.desc}</Text>
                </KCard>
              ))}
            </View>
          </>
        ) : (
          // ── Discovery hub ───────────────────────────────────────────────────
          <>
            <View style={styles.header}>
              <KEyebrow>Discovery</KEyebrow>
              <Text style={styles.title}>Find what calms you.</Text>
              <Text style={styles.subtitle}>
                Tools you can reach for, anytime — sound, stillness, play, study.
              </Text>
            </View>

            <View style={styles.cardList}>
              {CATEGORIES.map((c) => {
                const inner = (
                  <>
                    {/* motif anchored to the right */}
                    <View style={styles.motif} pointerEvents="none">
                      <c.Motif />
                    </View>

                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle}>{c.title}</Text>
                      <Text style={styles.cardDesc}>{c.desc}</Text>
                    </View>

                    <View style={styles.cardFooter}>
                      {c.soon ? (
                        <View style={styles.soonPill}>
                          <Text style={styles.soonText}>Coming soon</Text>
                        </View>
                      ) : (
                        <Text style={[styles.count, { color: c.accent }]}>{c.count}</Text>
                      )}
                      {!c.soon && (
                        <View style={styles.arrowCircle}>
                          <ArrowRightIcon color={c.accent} />
                        </View>
                      )}
                    </View>
                  </>
                );

                const cardStyle = [
                  styles.card,
                  { borderColor: c.border },
                  c.soon && styles.cardSoon,
                ];

                return c.gradient ? (
                  <TouchableOpacity key={c.id} activeOpacity={0.85} onPress={() => setOpen(c.id)}>
                    <LinearGradient colors={c.gradient} style={cardStyle}>
                      {inner}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={c.id}
                    style={[cardStyle, { backgroundColor: c.tint }]}
                    onPress={() => !c.soon && setOpen(c.id)}
                    disabled={!!c.soon}
                    activeOpacity={0.85}
                  >
                    {inner}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg },

  // Hub header
  header: { gap: 4, marginBottom: 14 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '700',
    color: Colors.cream50,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.fg2,
    lineHeight: 19,
  },

  // Category cards
  cardList: { gap: 10 },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  cardSoon: { opacity: 0.78 },
  motif: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -36,
    opacity: 0.85,
  },
  cardCopy: { maxWidth: '70%' },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 16.5,
    fontWeight: '700',
    color: Colors.cream50,
    letterSpacing: -0.2,
    lineHeight: 20,
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.fg2,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  count: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  soonPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(190,192,220,0.12)',
  },
  soonText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dusk300,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,240,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sub-library
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,240,0.06)',
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeader: { gap: 4, marginBottom: 14 },
  subTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '700',
    color: Colors.cream50,
    letterSpacing: -0.5,
  },
  subDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.fg2,
    lineHeight: 20,
  },
  libraryList: { gap: 10 },
  tagRow: { flexDirection: 'row', marginBottom: 6 },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.forest700,
  },
  tagText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  itemTitle: {
    fontFamily: Fonts.display,
    fontSize: 16.5,
    fontWeight: '700',
    color: Colors.cream50,
    marginBottom: 4,
  },
  itemDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
  },
});
