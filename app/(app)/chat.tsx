import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import {
  sendChatMessage, getChatHistory, createChatSession, endChatSession,
  saveChatMessage, ChatMessage,
} from '@/lib/coach';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const listRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sid = await createChatSession(user.id);
      setSessionId(sid);
      const history = await getChatHistory(sid);
      if (history.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hey, I'm Coach Sloan. I'm here with you — how are you doing today?",
        }]);
      } else {
        setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content })));
      }
      setLoading(false);
    })();

    return () => {
      if (sessionId && user) endChatSession(user.id, sessionId).catch(() => {});
    };
  }, [user?.id]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || !sessionId || streaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    await saveChatMessage(user.id, sessionId, 'user', userMsg.content);

    let fullResponse = '';
    try {
      await sendChatMessage(
        user.id,
        sessionId,
        userMsg.content,
        (chunk) => {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: fullResponse } : m)
          );
        },
        async () => {
          await saveChatMessage(user.id, sessionId, 'assistant', fullResponse);
          setStreaming(false);
        },
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'I\'m having trouble connecting right now. Try again in a moment.' }
            : m
        )
      );
      setStreaming(false);
    }
  }, [input, user, sessionId, streaming]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content || (streaming ? '...' : '')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.emerald500} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.coachInfo}>
          <View style={styles.coachAvatar}><Text style={styles.coachAvatarText}>S</Text></View>
          <View>
            <Text style={styles.coachName}>Coach Sloan</Text>
            <Text style={styles.coachStatus}>● Online</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Message Sloan..."
          placeholderTextColor={Colors.fg4}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || streaming}
        >
          {streaming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    backgroundColor: Colors.bg1,
  },
  coachInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coachAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.emerald500,
    alignItems: 'center', justifyContent: 'center',
  },
  coachAvatarText: { fontFamily: Fonts.sansBold, fontSize: 18, fontWeight: '700', color: '#fff' },
  coachName: { fontFamily: Fonts.sansBold, fontSize: 16, fontWeight: '700', color: Colors.fg1 },
  coachStatus: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.emerald500, fontWeight: '500' },
  messageList: { padding: Spacing.lg, gap: 12 },
  messageRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  messageRowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.emerald500 + '33',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: Fonts.sansBold, fontSize: 12, fontWeight: '700', color: Colors.emerald500 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.emerald500,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontFamily: Fonts.sans, fontSize: 15, color: Colors.fg1, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.bg1,
  },
  input: {
    fontFamily: Fonts.sans,
    flex: 1,
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: Colors.fg1,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.emerald500,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontFamily: Fonts.sansBold, fontSize: 20, color: '#fff', fontWeight: '700' },
});
