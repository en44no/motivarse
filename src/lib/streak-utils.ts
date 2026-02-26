import { subDays } from 'date-fns';
import { formatDate } from './date-utils';

export function calculateStreak(completedDates: string[]): { current: number; longest: number } {
  if (completedDates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...completedDates].sort().reverse();
  const today = formatDate(new Date());
  const yesterday = formatDate(subDays(new Date(), 1));

  // Current streak must include today or yesterday
  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const expected = formatDate(subDays(new Date(sorted[0]), i));
      if (sorted[i] === expected) {
        current++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longest = 0;
  let streak = 1;
  const ascending = [...completedDates].sort();
  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1]);
    const curr = new Date(ascending[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak, current);

  return { current, longest };
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '👑';
  if (streak >= 14) return '💪';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '⚡';
  return '✨';
}
