import { supabase } from './supabase';

const EDGE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function sendChatMessage(
  userId: string,
  sessionId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => Promise<void>,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${EDGE_FUNCTION_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!response.ok) throw new Error(`Chat error: ${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          await onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) onChunk(parsed.text);
        } catch { /* partial chunk */ }
      }
    }
  }
  await onDone();
}

export async function getJournalReflection(
  userId: string,
  journalText: string,
  prompt: string,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${EDGE_FUNCTION_URL}/journal-reflect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ journal_text: journalText, prompt }),
  });

  if (!response.ok) throw new Error('Journal reflection failed');
  const data = await response.json();
  return data.reflection as string;
}

export async function createChatSession(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, verse_used_in_session: false })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

export async function endChatSession(userId: string, sessionId: string): Promise<void> {
  await supabase
    .from('chat_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(50);

  return (data ?? []) as ChatMessage[];
}

export async function saveChatMessage(
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    user_id: userId,
    role,
    content,
  });
}
