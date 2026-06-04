import { create } from 'zustand';
import { getCurrentStreakCount, getTodayStreak, upsertTodayStreak, StreakDay } from '../lib/supabase';

interface StreakState {
  currentStreak: number;
  todayStreak: StreakDay | null;
  isLoading: boolean;

  load: (userId: string) => Promise<void>;
  updateLessonProgress: (userId: string, progress: number) => Promise<void>;
  markLessonComplete: (userId: string) => Promise<void>;
  markCheckInComplete: (userId: string) => Promise<void>;
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

  markCheckInComplete: async (userId) => {
    await upsertTodayStreak(userId, { checkin_completed: true });
    const today = await getTodayStreak(userId);
    set({ todayStreak: today });
  },

  markJournalComplete: async (userId) => {
    await upsertTodayStreak(userId, { journal_completed: true });
    const today = await getTodayStreak(userId);
    set({ todayStreak: today });
  },
}));
