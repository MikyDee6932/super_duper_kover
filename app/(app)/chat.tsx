import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Radius, Fonts } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import {
  sendChatMessage, getChatHistory, createChatSession, endChatSession,
} from '@/lib/coach';

// ── Types ──────────────────────────────────────────────────────────────────────
type Message = { id: string; role: 'user' | 'assistant'; content: string };

// ── Mic icon ───────────────────────────────────────────────────────────────────
function MicIcon({ color = Colors.fg4, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
        fill={color}
      />
      <Path
        d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.47 6.22 20.22 10.5 20.88V23H13.5V20.88C17.78 20.22 21 16.47 21 12V10H19Z"
        fill={color}
      />
    </Svg>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const listRef = useRef<FlatList>(null);
  const sessionIdRef = useRef<string | null>(null);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'friend';

  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [crisis, setCrisis]       = useState(false);

  // ── Initialise session + history ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Create session (falls back to local-UUID when Supabase unavailable)
        const sid = user
          ? await createChatSession(user.id)
          : `local-${Date.now()}`;

        if (cancelled) return;
        sessionIdRef.current = sid;

        // Load history (returns [] for local sessions)
        const history = user ? await getChatHistory(sid) : [];

        if (cancelled) return;

        if (history.length === 0) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hey ${firstName} 👋 How's today going?`,
          }]);
        } else {
          setMessages(history.map(m => ({ id: m.id, role: m.role, content: m.content })));
        }
      } catch {
        // Any error → still show welcome so screen never stays blank
        if (!cancelled) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hey ${firstName} 👋 How's today going?`,
          }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      const sid = sessionIdRef.current;
      if (sid && user && !sid.startsWith('local-')) {
        endChatSession(user.id, sid).catch(() => {});
      }
    };
  }, [user?.id]);                         // re-init if user logs in mid-session

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    const sid  = sessionIdRef.current;
    if (!text || streaming || !sid) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantId = `asst-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    // NOTE: both turns are persisted server-side by the Edge Function — no
    // client-side inserts, or every turn would be duplicated in history.

    let fullResponse = '';
    try {
      await sendChatMessage(
        user?.id ?? 'dev',
        sid,
        text,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, content: fullResponse } : m)
          );
        },
        async () => {
          setStreaming(false);
        },
        (meta) => {
          // Server may rotate to a fresh session (24h idle) or create one
          if (meta.session_id) sessionIdRef.current = meta.session_id;
          if (meta.crisis) setCrisis(true);
        },
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "I'm having trouble connecting right now. Try again in a moment." }
            : m
        )
      );
      setStreaming(false);
    }
  }, [input, streaming, user]);

  // ── Render message bubble ──────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content || (streaming && item.role === 'assistant' ? '...' : '')}
          </Text>
        </View>
      </View>
    );
  };

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.emerald500} size="large" />
      </View>
    );
  }

  // ── Chat UI ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.coachRow}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachAvatarText}>S</Text>
          </View>
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>Coach Sloan</Text>
            <Text style={styles.coachOnline}>● Online</Text>
          </View>
        </View>
      </View>

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messageList,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Crisis resource card (pinned when self-harm signals detected) ── */}
      {crisis && (
        <TouchableOpacity
          style={styles.crisisCard}
          onPress={() => Linking.openURL('tel:988').catch(() => {})}
          activeOpacity={0.85}
        >
          <Text style={styles.crisisTitle}>You matter, and help is close.</Text>
          <Text style={styles.crisisText}>
            988 Suicide & Crisis Lifeline — call or text 988, free, 24/7. Tap to call.
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
        <TextInput
          style={styles.input}
          placeholder="Tell Coach Sloan how you're doing..."
          placeholderTextColor={Colors.fg4}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || streaming}
          activeOpacity={0.8}
        >
          {streaming ? (
            <ActivityIndicator color={Colors.fg3} size="small" />
          ) : input.trim() ? (
            <Text style={styles.sendArrow}>↑</Text>
          ) : (
            <MicIcon color={Colors.fg4} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.bg1,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachAvatarText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  coachInfo: {
    gap: 2,
  },
  coachName: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.fg1,
  },
  coachOnline: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.emerald400,
  },

  // Messages
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.emerald500 + '30',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald400,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  bubbleAssistant: {
    backgroundColor: Colors.bgSurface,
    borderBottomLeftRadius: 5,
  },
  bubbleUser: {
    backgroundColor: Colors.emerald600,
    borderBottomRightRadius: 5,
  },
  bubbleText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.fg1,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: Colors.fg1,
  },

  // Crisis resource card
  crisisCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.bgSurface2,
    borderWidth: 1,
    borderColor: Colors.emerald500 + '60',
    gap: 3,
  },
  crisisTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.fg1,
  },
  crisisText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.fg3,
    lineHeight: 18,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.bg1,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 11,
    color: Colors.fg1,
    fontSize: 15,
    fontFamily: Fonts.sans,
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bgSurface2,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendArrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    color: Colors.emerald400,
    fontWeight: '800',
    lineHeight: 24,
  },
});
