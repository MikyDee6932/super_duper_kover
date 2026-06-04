import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const body = await req.json();
  const event = body.event;
  if (!event) return new Response('No event', { status: 400 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const appUserId = event.app_user_id;
  const type = event.type as string;

  const activeEvents = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'TRIAL_CONVERTED'];
  const expiredEvents = ['EXPIRATION', 'CANCELLATION', 'SUBSCRIBER_ALIAS'];

  let status: string | null = null;
  if (activeEvents.includes(type)) status = 'active';
  if (expiredEvents.includes(type)) status = 'inactive';

  if (status) {
    await supabase
      .from('profiles')
      .update({ subscription_status: status })
      .eq('id', appUserId);
  }

  return new Response('OK', { status: 200 });
});
