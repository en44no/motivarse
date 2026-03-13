import { useEffect, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { deleteOrphanedStreaks } from '../services/habits.service';
import { useAuthContext } from '../contexts/AuthContext';
import { calculateStreak } from '../lib/streak-utils';
import type { HabitStreak } from '../types/habit';

export function useStreaks() {
  const { streaks, habits, habitLogs } = useDataContext();
  const { user } = useAuthContext();

  const habitIds = new Set(habits.map((h) => h.id));
  const firestoreStreaks = streaks.filter((s) => habitIds.has(s.habitId));

  // Recalculate currentStreak from actual logs + habit schedule (never trust stale Firestore value)
  const activeStreaks = useMemo(() => {
    if (!user?.uid) return firestoreStreaks;

    return firestoreStreaks.map((s) => {
      const habit = habits.find((h) => h.id === s.habitId);
      const completedDates = habitLogs
        .filter((l) => l.habitId === s.habitId && l.userId === user.uid && l.completed)
        .map((l) => l.date);
      const uniqueDates = [...new Set(completedDates)];
      const { current, longest } = calculateStreak(uniqueDates, habit ?? undefined);

      return {
        ...s,
        currentStreak: current,
        // Keep Firestore longestStreak as floor (logs only go back ~35 days)
        longestStreak: Math.max(s.longestStreak, longest),
      };
    });
  }, [firestoreStreaks, habits, habitLogs, user?.uid]);

  // Delete orphaned streaks from Firestore when detected
  useEffect(() => {
    if (!user?.uid || streaks.length === 0 || streaks.length === activeStreaks.length) return;
    const activeIds = Array.from(habitIds);
    deleteOrphanedStreaks(user.uid, activeIds).catch(() => {});
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
