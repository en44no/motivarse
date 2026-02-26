import { useDataContext } from '../contexts/DataContext';
import type { HabitStreak } from '../types/habit';

export function useStreaks() {
  const { streaks } = useDataContext();

  function getStreak(habitId: string): HabitStreak | undefined {
    return streaks.find((s) => s.habitId === habitId);
  }

  const bestStreak = streaks.reduce(
    (best, s) => (s.currentStreak > (best?.currentStreak || 0) ? s : best),
    null as HabitStreak | null
  );

  return { streaks, getStreak, bestStreak };
}
