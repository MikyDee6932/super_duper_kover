import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Type-safe DB helpers ────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  age_range: string | null;
  outcomes: string[] | null;
  relationship_status: string | null;
  faith_denomination: string | null;
  bible_translation: string;
  porn_frequency: string | null;
  days_since_clean: number;
  first_exposure_age: string | null;
  triggers: string[] | null;
  goals: string[] | null;
  onboarding_completed: boolean;
  referral_code_used: string | null;
  conquer_date: string | null;
  last_mood: string | null;
  current_lesson_day: number;
  subscription_status: string;
  revenuecat_customer_id: string | null;
  nextdns_profile_id: string | null;
  shield_activated: boolean;
  blocker_activated_at: string | null;
  lockdown_enabled: boolean;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreakDay {
  id: string;
  user_id: string;
  date: string;
  lesson_completed: boolean;
  lesson_progress: number; // 0-4
  checkin_completed: boolean;
  journal_completed: boolean;
  sos_triggered: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  verse_used_in_session: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  lesson_id: number | null;
  prompt: string | null;
  content: string;
  mood: string | null;
  ai_reflection: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  feeling: string;
  note: string | null;
  verse_shown: string | null;
  created_at: string;
}

export interface DailyLesson {
  id: string;
  day_number: number;
  verse_reference: string;
  verse_text_niv: string;
  verse_text_nlt: string;
  verse_text_msg: string;
  study_title: string;
  study_content: string;
  prayer_text: string;
  journal_prompt: string;
  theme: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getTodayStreak(userId: string): Promise<StreakDay | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();
  if (error) return null;
  return data as StreakDay;
}

export async function upsertTodayStreak(userId: string, updates: Partial<StreakDay>) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('streaks')
    .upsert({ user_id: userId, date: today, ...updates }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function getCurrentStreakCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from('streaks')
    .select('date, lesson_completed')
    .eq('user_id', userId)
    .eq('lesson_completed', true)
    .order('date', { ascending: false })
    .limit(365);

  if (!data || data.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (data[i].date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function logSOSEvent(userId: string, data: {
  emotional_state?: string;
  verse_shown?: string;
  action_taken?: string;
  duration_seconds?: number;
}) {
  await supabase.from('sos_events').insert({ user_id: userId, ...data });
  await upsertTodayStreak(userId, { sos_triggered: true });
}

export async function saveJournalEntry(userId: string, entry: {
  lesson_id?: number;
  prompt: string;
  content: string;
  mood?: string | null;
  ai_reflection?: string | null;
}) {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: userId, ...entry })
    .select()
    .single();
  if (error) throw error;
  await upsertTodayStreak(userId, { journal_completed: true });
  return data;
}

export async function saveCheckIn(userId: string, checkin: {
  feeling: string;
  note?: string;
  verse_shown?: string;
}) {
  await supabase.from('check_ins').insert({ user_id: userId, ...checkin });
  await upsertTodayStreak(userId, { checkin_completed: true });
}

export async function getDailyLesson(dayNumber: number): Promise<DailyLesson | null> {
  const { data } = await supabase
    .from('daily_lessons')
    .select('*')
    .eq('day_number', dayNumber)
    .single();
  return data as DailyLesson | null;
}
