import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '@/constants/colors';
import { KEyebrow } from '@/components/ui/KEyebrow';
import { KCard } from '@/components/ui/KCard';
import { supabase, JournalEntry } from '@/lib/supabase';

export default function JournalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setEntry(data as JournalEntry | null));
  }, [id]);

  if (!entry) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Journal</Text>
      </TouchableOpacity>

      <Text style={styles.date}>
        {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </Text>

      {entry.prompt && (
        <KCard style={styles.promptCard}>
          <KEyebrow color={Colors.emerald500}>Prompt</KEyebrow>
          <Text style={styles.promptText}>{entry.prompt}</Text>
        </KCard>
      )}

      <Text style={styles.content}>{entry.content}</Text>

      {entry.ai_reflection && (
        <KCard variant="earned" style={styles.reflectionCard}>
          <KEyebrow color={Colors.emerald500}>Coach Sloan's Reflection</KEyebrow>
          <Text style={styles.reflectionText}>{entry.ai_reflection}</Text>
        </KCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, gap: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 15, color: Colors.fg3 },
  date: { fontFamily: Fonts.display, fontSize: 22, fontWeight: '700', color: Colors.fg1 },
  promptCard: { gap: 8 },
  promptText: { fontSize: 15, color: Colors.fg2, fontStyle: 'italic', lineHeight: 22 },
  content: { fontSize: 16, color: Colors.fg1, lineHeight: 26 },
  reflectionCard: { gap: 10 },
  reflectionText: { fontSize: 15, color: Colors.fg2, lineHeight: 24, fontStyle: 'italic' },
});
