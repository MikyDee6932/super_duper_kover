import { fetch as streamingFetch } from 'expo/fetch';
import { supabase } from './supabase';

// Guard against undefined env var producing "undefined/functions/v1"
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const EDGE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ── Dev-mode mock responses ────────────────────────────────────────────────────

const DEV_REFLECTION =
  "What you've written here takes real courage. The fact that you're pausing to reflect honestly — rather than pushing the feeling away — is already a form of victory. Recovery is built in these quiet places where you face yourself with truth.\n\nHold onto this: you are not defined by your struggle. You are defined by the grace you choose to walk in, one moment at a time. — Coach Sloan";

// Clearly labeled so a canned reply can never be mistaken for the real Sloan
// (this exact masking is what hid the broken pipeline before).
const DEV_CHAT_RESPONSE =
  "[Dev mode — you're not signed in, so this is a canned reply, not Sloan AI. Sign in to chat for real.] I hear you. Whatever brought you here today, I want you to know you're not alone in this. What's on your heart right now?";

// ── Journal reflection ─────────────────────────────────────────────────────────

export async function getJournalReflection(
  userId: string,
  journalText: string,
  prompt: string,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  // Dev / no-session fallback — return a meaningful local reflection
  if (!session) {
    if (__DEV__) {
      await new Promise(r => setTimeout(r, 900)); // simulate latency
      return DEV_REFLECTION;
    }
    throw new Error('Not authenticated');
  }

  if (!EDGE_FUNCTION_URL) {
    if (__DEV__) return DEV_REFLECTION;
    throw new Error('Supabase URL not configured');
  }

  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/journal-reflect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ journal_text: journalText, prompt }),
    });

    if (!response.ok) throw new Error(`Reflection error: ${response.status}`);
    const data = await response.json();
    return data.reflection as string;
  } catch {
    // Edge function down or ANTHROPIC_API_KEY not set — return local fallback
    return DEV_REFLECTION;
  }
}

// ── Chat message streaming ─────────────────────────────────────────────────────

export interface ChatMeta {
  session_id?: string;
  crisis?: boolean;
}

export async function sendChatMessage(
  userId: string,
  sessionId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => Promise<void>,
  onMeta?: (meta: ChatMeta) => void,
  source: 'tab' | 'sos' | 'checkin' = 'tab',
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  // Dev / no-session fallback — stream a mock response character-by-character
  if (!session) {
    if (__DEV__) {
      const words = DEV_CHAT_RESPONSE.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 55));
      }
      await onDone();
      return;
    }
    throw new Error('Not authenticated');
  }

  if (!EDGE_FUNCTION_URL) {
    if (__DEV__) {
      onChunk(DEV_CHAT_RESPONSE);
      await onDone();
      return;
    }
    throw new Error('Supabase URL not configured');
  }

  // NOTE: React Native's global fetch never exposes response.body as a
  // ReadableStream, so SSE streaming requires expo/fetch (SDK 52+).
  const response = await streamingFetch(`${EDGE_FUNCTION_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message,
      // Locally generated ids are meaningless to the server; let it create one
      session_id: sessionId.startsWith('local-') ? null : sessionId,
      source,
    }),
  });

  if (!response.ok) throw new Error(`Chat error: ${response.status}`);

  // SSE line parser shared by the streaming and buffered paths.
  // Returns true once the [DONE] sentinel is seen.
  let buffer = '';
  const processBuffer = (flush = false): boolean => {
    const lines = buffer.split('\n');
    // Keep the final (possibly partial) line in the buffer unless flushing
    buffer = flush ? '' : (lines.pop() ?? '');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return true;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) onChunk(parsed.text);
        if (parsed.session_id || parsed.crisis) onMeta?.(parsed);
      } catch { /* malformed line — skip */ }
    }
    return false;
  };

  const reader = response.body?.getReader();

  if (reader) {
    // Streaming path
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (processBuffer()) {
        await onDone();
        return;
      }
    }
    processBuffer(true);
  } else {
    // Fallback: body arrived buffered (older runtime / proxy) — parse it whole
    buffer = await response.text();
    processBuffer(true);
  }
  await onDone();
}

// ── Session helpers ────────────────────────────────────────────────────────────

export async function createChatSession(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, verse_used_in_session: false })
    .select()
    .single();
  // Fallback to a local UUID if Supabase fails (RLS, offline, dev mode)
  if (error) return `local-${Date.now()}`;
  return data.id;
}

export async function endChatSession(userId: string, sessionId: string): Promise<void> {
  if (sessionId.startsWith('local-')) return;
  await supabase
    .from('chat_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  if (sessionId.startsWith('local-')) return [];
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(50);
  return (data ?? []) as ChatMessage[];
}

// NOTE: chat messages are persisted server-side by the Edge Function (with the
// service-role key) — the client must not also insert them or every turn
// would be duplicated in history.
