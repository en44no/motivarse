import { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { subscribeToStreaks } from '../services/habits.service';
import type { HabitStreak } from '../types/habit';

export function useStreaks() {
  const { user } = useAuthContext();
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToStreaks(user.uid, setStreaks);
    return unsub;
  }, [user]);

  function getStreak(habitId: string): HabitStreak | undefined {
    return streaks.find((s) => s.habitId === habitId);
  }

  const bestStreak = streaks.reduce(
    (best, s) => (s.currentStreak > (best?.currentStreak || 0) ? s : best),
    null as HabitStreak | null
  );

  return { streaks, getStreak, bestStreak };
}
