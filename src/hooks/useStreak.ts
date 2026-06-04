import { useEffect } from 'react';
import { useStreakStore } from '../store/streakStore';
import { useUser } from './useUser';

export function useStreak() {
  const { user } = useUser();
  const { currentStreak, todayStreak, isLoading, load } = useStreakStore();

  useEffect(() => {
    if (user) load(user.id);
  }, [user?.id]);

  const todayProgress = todayStreak
    ? [
        todayStreak.lesson_completed,
        todayStreak.checkin_completed,
        todayStreak.journal_completed,
      ].filter(Boolean).length
    : 0;

  return { currentStreak, todayStreak, todayProgress, isLoading };
}
