import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPush(token: string, title: string, body: string) {
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

function getStreakMessage(streak: number): { title: string; body: string } {
  const milestones: Record<number, { title: string; body: string }> = {
    1: { title: '🌱 Day 1 Complete!', body: 'The first step is always the hardest. You showed up today. Come back tomorrow.' },
    7: { title: '🔥 One Week Strong!', body: 'Seven days of choosing freedom. Your brain is changing. Keep going.' },
    14: { title: '💪 Two Weeks!', body: 'Two weeks of victory. You are building something real. Coach Sloan is proud of you.' },
    21: { title: '🏆 21 Days!', body: 'Habits form at 21 days. You just proved it. Keep going — it only gets better.' },
    30: { title: '👑 30 Days Free!', body: 'One full month. This is a new you. Celebrate today.' },
  };
  return milestones[streak] ?? { title: '✨ Keep Going', body: `Day ${streak} — you are on a streak. Check in today.` };
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Get all active users with push tokens
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, expo_push_token, subscription_status')
    .eq('subscription_status', 'active')
    .not('expo_push_token', 'is', null);

  if (!profiles?.length) return new Response('No users', { status: 200 });

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay(); // 0=Sun, 3=Wed

  for (const profile of profiles) {
    if (!profile.expo_push_token) continue;

    // Check today's streak
    const { data: todayStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .single();

    // Already checked in today — send encouragement
    if (todayStreak?.checkin_completed && todayStreak?.lesson_completed) {
      continue;
    }

    // Get current streak count
    const { data: streaks } = await supabase
      .from('streaks')
      .select('date')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(100);

    let streak = 0;
    const dates = streaks?.map(s => s.date) ?? [];
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i - 1);
      if (dates[i] === expected.toISOString().split('T')[0]) streak++;
      else break;
    }

    // Milestone notification
    const milestoneStreaks = [1, 7, 14, 21, 30, 60, 90];
    if (milestoneStreaks.includes(streak)) {
      const msg = getStreakMessage(streak);
      await sendPush(profile.expo_push_token, msg.title, msg.body);
      continue;
    }

    // Wednesday mid-week check-in
    if (dayOfWeek === 3) {
      await sendPush(profile.expo_push_token, '💬 Mid-week check-in', 'How is your week going? Coach Sloan is here whenever you need to talk.');
      continue;
    }

    // Silence nudge — no activity in 25+ hours
    const lastActivity = streaks?.[0]?.date;
    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const hoursSince = (Date.now() - lastDate.getTime()) / 3600000;
      if (hoursSince > 25) {
        await sendPush(profile.expo_push_token, '🌅 We miss you', 'Your streak is waiting. Take 2 minutes to check in today.');
      }
    }
  }

  return new Response('Done', { status: 200 });
});
