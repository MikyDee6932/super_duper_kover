import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { supabase, JournalEntry } from '@/lib/supabase';

// ── Date helpers ───────────────────────────────────────────────────────────────

/** "June 2026" */
function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** "Tuesday, Jun 9" */
function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

interface Section {
  title: string;      // "June 2026"
  data: JournalEntry[];
}

function groupByMonth(entries: JournalEntry[]): Section[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const key = monthLabel(e.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function PastEntries() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSections(groupByMonth((data ?? []) as JournalEntry[]));
        setLoading(false);
      });
  }, [user?.id]);

  // ── Empty / no-auth state ──────────────────────────────────────────────────
  const isEmpty = !loading && sections.length === 0;

  // ── Entry row ──────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={styles.entryRow}
      onPress={() => router.push(`/(app)/journal/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.entryLeft}>
        <Text style={styles.entryDay}>{dayLabel(item.created_at)}</Text>
        {item.prompt ? (
          <Text style={styles.entryPrompt} numberOfLines={1}>{item.prompt}</Text>
        ) : null}
        <Text style={styles.entryPreview} numberOfLines={2}>{item.content}</Text>
      </View>
      <View style={styles.entryRight}>
        {item.ai_reflection ? (
          <View style={styles.sloanBadge}>
            <Text style={styles.sloanBadgeText}>✦ Sloan</Text>
          </View>
        ) : null}
        <Text style={styles.entryChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  // ── Section header ────────────────────────────────────────────────────────
  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Past Entries</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/journal/today')}
          style={styles.newBtn}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        /* ── Empty state ─────────────────────────────────────────────────── */
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📔</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySub}>
            Your journal entries will appear here after you complete your first reflection with Coach Sloan.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(app)/journal/today')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>Write today's entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Entry list ──────────────────────────────────────────────────── */
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  backBtn: { width: 36 },
  backText: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.fg3,
    fontWeight: '700',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.fg1,
    letterSpacing: -0.2,
  },
  newBtn: {
    backgroundColor: Colors.emerald500 + '22',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.emerald500 + '55',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald400,
  },

  // List
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.fg4,
    letterSpacing: 2,
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.hairline,
  },

  // Entry row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginBottom: 8,
  },
  entryLeft: {
    flex: 1,
    gap: 3,
  },
  entryDay: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.fg1,
  },
  entryPrompt: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.emerald400,
    lineHeight: 18,
  },
  entryPreview: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
    lineHeight: 19,
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  sloanBadge: {
    backgroundColor: Colors.emerald500 + '22',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.emerald500 + '44',
  },
  sloanBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald400,
  },
  entryChevron: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.fg4,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.fg1,
  },
  emptySub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.fg3,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.emerald500,
    borderRadius: Radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
