import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '@/constants/colors';
import { KEyebrow } from '@/components/ui/KEyebrow';
import { KButton } from '@/components/ui/KButton';
import { useAuthStore } from '@/store/authStore';
import { supabase, JournalEntry } from '@/lib/supabase';

export default function JournalIndex() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries((data ?? []) as JournalEntry[]));
  }, [user?.id]);

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => router.push(`/(app)/journal/${item.id}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.entryDate}>
        {new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </Text>
      {item.prompt && <Text style={styles.entryPrompt}>{item.prompt}</Text>}
      <Text style={styles.entryPreview} numberOfLines={2}>
        {item.content}
      </Text>
      {item.ai_reflection && (
        <View style={styles.reflectionBadge}>
          <Text style={styles.reflectionBadgeText}>✦ Sloan reflected</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Journal</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📔</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySub}>Your journal entries from daily lessons will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          renderItem={renderEntry}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  title: { fontFamily: Fonts.display, fontSize: 28, fontWeight: '700', color: Colors.fg1 },
  list: { padding: Spacing.lg, gap: 12 },
  entryCard: {
    backgroundColor: Colors.bg2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    gap: 6,
  },
  entryDate: { fontSize: 12, color: Colors.fg4, fontWeight: '600' },
  entryPrompt: { fontSize: 13, color: Colors.emerald500, fontStyle: 'italic' },
  entryPreview: { fontSize: 14, color: Colors.fg2, lineHeight: 20 },
  reflectionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.emerald500 + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  reflectionBadgeText: { fontSize: 11, color: Colors.emerald500, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.fg1 },
  emptySub: { fontSize: 15, color: Colors.fg3, textAlign: 'center', lineHeight: 22 },
});
