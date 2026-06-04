import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEXTDNS_API = 'https://api.nextdns.io';

async function createNextDNSProfile(apiKey: string, profileName: string): Promise<string> {
  const res = await fetch(`${NEXTDNS_API}/profiles`, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: profileName }),
  });
  const data = await res.json();
  return data.data?.id;
}

async function configureProfile(apiKey: string, profileId: string) {
  const patchUrl = `${NEXTDNS_API}/profiles/${profileId}`;
  const headers = { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' };

  await Promise.all([
    fetch(`${patchUrl}/parentalcontrol/categories`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: 'porn', active: true }),
    }),
    fetch(`${patchUrl}/parentalcontrol/categories`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: 'gambling', active: true }),
    }),
    fetch(`${patchUrl}/parentalcontrol/categories`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: 'dating', active: true }),
    }),
    fetch(`${patchUrl}/parentalcontrol/categories`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: 'piracy', active: true }),
    }),
    fetch(`${patchUrl}/ads`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ blockAds: true, blockTrackers: true }),
    }),
    fetch(`${patchUrl}/parentalcontrol/safeSearch`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ enabled: true }),
    }),
    fetch(`${patchUrl}/parentalcontrol/youtubeRestrictedMode`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ enabled: true }),
    }),
  ]);
}

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

  const apiKey = Deno.env.get('NEXTDNS_API_KEY')!;

  try {
    const profileId = await createNextDNSProfile(apiKey, `Kover-${user.id.slice(0, 8)}`);
    await configureProfile(apiKey, profileId);

    await supabase.from('profiles').update({ nextdns_profile_id: profileId }).eq('id', user.id);

    return new Response(JSON.stringify({ profile_id: profileId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
