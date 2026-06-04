import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const { journal_text, prompt } = await req.json();

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

  const { content } = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `You are Coach Sloan, a grace-based Christian recovery coach. A user has written a journal entry responding to this prompt: "${prompt}"

Their journal entry: "${journal_text}"

Write a warm, encouraging, faith-based reflection (50-100 words) that:
- Affirms what they shared without judgment
- Offers one brief spiritual insight or encouragement
- Closes with hope
Do not repeat their words back to them. Be specific to what they wrote. Be pastoral and warm.`,
    }],
  });

  const reflection = content[0].type === 'text' ? content[0].text : '';

  return new Response(JSON.stringify({ reflection }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
