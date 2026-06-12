import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/colors';
import { KButton } from '../ui/KButton';
import { useAuthStore } from '../../store/authStore';
import { useStreakStore } from '../../store/streakStore';
import { saveCheckIn } from '../../lib/supabase';
import { getVersesForState } from '../../constants/verses';

const FEELINGS = [
  { label: 'Strong', emoji: '💪', state: 'strong' },
  { label: 'Calm', emoji: '😌', state: 'calm' },
  { label: 'Grateful', emoji: '🙏', state: 'grateful' },
  { label: 'Hopeful', emoji: '🌅', state: 'hopeful' },
  { label: 'Anxious', emoji: '😰', state: 'anxious' },
  { label: 'Lonely', emoji: '😔', state: 'lonely' },
  { label: 'Stressed', emoji: '😤', state: 'stressed' },
  { label: 'Struggling', emoji: '🌊', state: 'struggling' },
];

interface CheckInSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 'mood' | 'note' | 'verse';

export function CheckInSheet({ visible, onClose, onComplete }: CheckInSheetProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { markCheckInComplete, markCheckInCompleteLocal } = useStreakStore();

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<typeof FEELINGS[0] | null>(null);
  const [note, setNote] = useState('');
  const [verse, setVerse] = useState<{ text: string; reference: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep('mood');
    setSelectedMood(null);
    setNote('');
    setVerse(null);
  };

  const handleMoodSelect = (feeling: typeof FEELINGS[0]) => {
    setSelectedMood(feeling);
    const verses = getVersesForState(feeling.state as any);
    const picked = verses[Math.floor(Math.random() * verses.length)];
    setVerse(picked ? { text: picked.text, reference: picked.reference } : null);
  };

  const handleNext = () => {
    if (step === 'mood' && selectedMood) setStep('note');
    else if (step === 'note') setStep('verse');
  };

  const handleComplete = async () => {
    if (!selectedMood) return;
    setSaving(true);
    try {
      if (user) {
        // Authenticated: persist check-in data to Supabase
        await saveCheckIn(user.id, {
          feeling: selectedMood.label,
          note: note.trim() || undefined,
          verse_shown: verse?.reference ?? undefined,
        });
        await markCheckInComplete(user.id);
      } else {
        // Dev / null-user: update streak store locally so the home screen
        // reflects the completed check-in without a Supabase call.
        markCheckInCompleteLocal();
      }
      reset();
      onComplete?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'mood' ? 'How are you feeling?' : step === 'note' ? 'Add a note' : 'A word for you'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {step === 'mood' && (
            <View style={styles.moodGrid}>
              {FEELINGS.map((feeling) => (
                <TouchableOpacity
                  key={feeling.state}
                  style={[styles.moodItem, selectedMood?.state === feeling.state && styles.moodItemActive]}
                  onPress={() => handleMoodSelect(feeling)}
                >
                  <Text style={styles.moodEmoji}>{feeling.emoji}</Text>
                  <Text style={[styles.moodLabel, selectedMood?.state === feeling.state && styles.moodLabelActive]}>
                    {feeling.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === 'note' && (
            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="What's on your mind? (optional)"
                placeholderTextColor={Colors.fg4}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={300}
                autoFocus
              />
              <Text style={styles.charCount}>{note.length}/300</Text>
            </View>
          )}

          {step === 'verse' && verse && (
            <View style={styles.verseContainer}>
              <Text style={styles.selectedMoodEmoji}>{selectedMood?.emoji}</Text>
              <Text style={styles.verseText}>"{verse.text}"</Text>
              <Text style={styles.verseRef}>— {verse.reference}</Text>
            </View>
          )}

          <View style={styles.footer}>
            {step === 'mood' && (
              <KButton variant="primary" full disabled={!selectedMood} onPress={handleNext}>
                Continue
              </KButton>
            )}
            {step === 'note' && (
              <KButton variant="primary" full onPress={handleNext}>
                {note.trim() ? 'Continue' : 'Skip'}
              </KButton>
            )}
            {step === 'verse' && (
              <KButton variant="primary" full loading={saving} onPress={handleComplete}>
                Done
              </KButton>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairlineStrong,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.fg1,
  },
  closeText: {
    fontSize: 18,
    color: Colors.fg4,
    padding: 4,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  moodItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moodItemActive: {
    borderColor: Colors.emerald500,
    backgroundColor: Colors.emerald500 + '18',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 11,
    color: Colors.fg3,
    fontWeight: '500',
  },
  moodLabelActive: {
    color: Colors.emerald500,
    fontWeight: '600',
  },
  noteContainer: {
    flex: 1,
    gap: 8,
  },
  noteInput: {
    flex: 1,
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    color: Colors.fg1,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.fg4,
    textAlign: 'right',
  },
  verseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: Spacing.md,
  },
  selectedMoodEmoji: {
    fontSize: 48,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 30,
    color: Colors.fg1,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  verseRef: {
    fontSize: 14,
    color: Colors.emerald500,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.lg,
  },
});
