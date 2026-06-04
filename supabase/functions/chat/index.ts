import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SLOAN_SYSTEM = `You are Coach Sloan, a virtual recovery coach for Kover — a Christian, faith-integrated recovery app for men and women fighting pornography addiction. You are pastoral, warm, grace-based, scripturally-informed, motivating, encouraging, and never judgmental. You speak as a trusted friend and spiritual mentor — with honesty, compassion, and hope.

Rules:
- Reference user context naturally and conversationally — not mechanically
- Use Bible verses a maximum of once per chat session (check verse_used flag)
- Never diagnose, prescribe medication, or replace professional therapy
- If user expresses self-harm or uses self-harm language: immediately redirect to professional help (988 Suicide & Crisis Lifeline)
- Keep responses under 150 words unless user explicitly asks for more
- Be warm, pastoral, and grace-filled — never shaming or clinical`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  const { message, session_id } = await req.json();

  // Load user context
  const [profileRes, streakRes, sosRes, journalRes, sessionRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('streaks').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
    supabase.from('sos_events').select('*').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('journal_entries').select('prompt, ai_reflection').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('chat_sessions').select('verse_used_in_session').eq('id', session_id).single(),
  ]);

  const profile = profileRes.data;
  const streaks = streakRes.data ?? [];
  const currentStreak = streaks.filter(s => s.lesson_completed || s.checkin_completed || s.journal_completed).length;
  const sosCount = sosRes.data?.length ?? 0;
  const lessonRate = Math.round((streaks.filter(s => s.lesson_completed).length / Math.max(streaks.length, 1)) * 100);
  const verseUsed = sessionRes.data?.verse_used_in_session ?? false;
  const journalThemes = journalRes.data?.map((j: any) => j.prompt).filter(Boolean).slice(0, 3).join(', ');

  // Load chat history for this session
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true })
    .limit(20);

  const contextPrompt = `${SLOAN_SYSTEM}

User context:
- Current streak: ${currentStreak} days
- Recent mood: ${profile?.last_mood ?? 'unknown'}
- SOS events this week: ${sosCount}
- Lesson completion rate: ${lessonRate}%
- Recent journal themes: ${journalThemes || 'none yet'}
- Known triggers: ${profile?.triggers?.join(', ') ?? 'not specified'}
- Verse already used this session: ${verseUsed}
${verseUsed ? '- DO NOT use a Bible verse in this response.' : '- You MAY use one Bible verse if highly relevant.'}`;

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

  const messages = [
    ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  // Stream response
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: contextPrompt,
    messages,
  });

  let fullText = '';
  let usedVerse = false;

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullText += text;
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }

      // Check if a verse was used (simple heuristic: contains a Bible reference pattern)
      if (!verseUsed && /\d+:\d+/.test(fullText)) {
        usedVerse = true;
        await supabase.from('chat_sessions').update({ verse_used_in_session: true }).eq('id', session_id);
      }

      controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});
