import { useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { deleteOrphanedStreaks } from '../services/habits.service';
import { useAuthContext } from '../contexts/AuthContext';
import type { HabitStreak } from '../types/habit';

export function useStreaks() {
  const { streaks, habits } = useDataContext();
  const { user } = useAuthContext();

  const habitIds = new Set(habits.map((h) => h.id));
  const activeStreaks = streaks.filter((s) => habitIds.has(s.habitId));

  // Delete orphaned streaks from Firestore when detected
  useEffect(() => {
    if (!user?.uid || streaks.length === 0 || streaks.length === activeStreaks.length) return;
    const activeIds = Array.from(habitIds);
    deleteOrphanedStreaks(user.uid, activeIds).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaks.length, activeStreaks.length, user?.uid]);

  function getStreak(habitId: string): HabitStreak | undefined {
    return activeStreaks.find((s) => s.habitId === habitId);
  }

  const bestStreak = activeStreaks.reduce(
    (best, s) => (s.currentStreak > (best?.currentStreak || 0) ? s : best),
    null as HabitStreak | null
  );

  return { streaks: activeStreaks, getStreak, bestStreak };
}
