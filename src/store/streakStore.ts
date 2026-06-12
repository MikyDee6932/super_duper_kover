import { create } from 'zustand';
import { getCurrentStreakCount, getTodayStreak, upsertTodayStreak, StreakDay } from '../lib/supabase';

interface StreakState {
  currentStreak: number;
  todayStreak: StreakDay | null;
  isLoading: boolean;

  load: (userId: string) => Promise<void>;
  updateLessonProgress: (userId: string, progress: number) => Promise<void>;
  markLessonComplete: (userId: string) => Promise<void>;
  /** Dev/offline fallback: bump streak locally without a Supabase call. */
  markLessonCompleteLocal: () => void;
  markCheckInComplete: (userId: string) => Promise<void>;
  /** Dev/offline fallback: mark check-in locally without a Supabase call. */
  markCheckInCompleteLocal: () => void;
  markJournalComplete: (userId: string) => Promise<void>;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  todayStreak: null,
  isLoading: false,

  load: async (userId) => {
    set({ isLoading: true });
    const [streak, today] = await Promise.all([
      getCurrentStreakCount(userId),
      getTodayStreak(userId),
    ]);
    set({ currentStreak: streak, todayStreak: today, isLoading: false });
  },

  updateLessonProgress: async (userId, progress) => {
    await upsertTodayStreak(userId, { lesson_progress: progress });
    const today = await getTodayStreak(userId);
    set({ todayStreak: today });
  },

  markLessonComplete: async (userId) => {
    await upsertTodayStreak(userId, { lesson_completed: true, lesson_progress: 4 });
    const [streak, today] = await Promise.all([
      getCurrentStreakCount(userId),
      getTodayStreak(userId),
    ]);
    set({ currentStreak: streak, todayStreak: today });
  },

  markLessonCompleteLocal: () => {
    const { currentStreak, todayStreak } = get();
    const today = new Date().toISOString().split('T')[0];
    // Build a synthetic streak record if none exists (dev / no-auth mode)
    const base: StreakDay = todayStreak ?? {
      id: 'local',
      user_id: 'local',
      date: today,
      lesson_completed: false,
      lesson_progress: 0,
      checkin_completed: false,
      journal_completed: false,
      sos_triggered: false,
      created_at: today,
    };
    set({
      currentStreak: currentStreak + 1,
      todayStreak: { ...base, lesson_completed: true, lesson_progress: 4 },
    });
  },

  markCheckInComplete: async (userId) => {
    await upsertTodayStreak(userId, { checkin_completed: true });
    const today = await getTodayStreak(userId);
    set({ todayStreak: today });
  },

  markCheckInCompleteLocal: () => {
    const { todayStreak } = get();
    const today = new Date().toISOString().split('T')[0];
    const base: StreakDay = todayStreak ?? {
      id: 'local',
      user_id: 'local',
      date: today,
      lesson_completed: false,
      lesson_progress: 0,
      checkin_completed: false,
      journal_completed: false,
      sos_triggered: false,
      created_at: today,
    };
    set({ todayStreak: { ...base, checkin_completed: true } });
  },

  markJournalComplete: async (userId) => {
    await upsertTodayStreak(userId, { journal_completed: true });
    const today = await getTodayStreak(userId);
    set({ todayStreak: today });
  },
}));
