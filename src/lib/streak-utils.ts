import { subDays } from 'date-fns';
import { formatDate, isHabitScheduledForDate } from './date-utils';
import type { Habit } from '../types/habit';

/**
 * Schedule-aware streak calculation.
 * Only counts days where the habit was scheduled.
 * Today is "grace" — if scheduled but not done yet, it doesn't break the streak.
 * lookbackDays should match how many days of logs are available (default 90).
 */
export function calculateStreak(
  completedDates: string[],
  habit?: Habit,
  lookbackDays = 90,
): { current: number; longest: number } {
  if (completedDates.length === 0) return { current: 0, longest: 0 };

  const completedSet = new Set(completedDates);
  const today = new Date();

  // --- Current streak ---
  let current = 0;
  let foundFirst = false;

  for (let i = 0; i < lookbackDays; i++) {
    const date = subDays(today, i);
    const dateStr = formatDate(date);

    // If no habit info, fall back to checking every day
    const isScheduled = habit ? isHabitScheduledForDate(habit, date) : true;
    if (!isScheduled) continue;

    if (completedSet.has(dateStr)) {
      current++;
      foundFirst = true;
    } else {
      // Scheduled but not completed
      if (i === 0) continue; // today — still has time, grace period
      break; // missed a scheduled day → streak broken
    }
  }

  // --- Longest streak (scan all available dates) ---
  // Build list of scheduled dates in ascending order
  const scheduledDates: string[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = formatDate(date);
    const isScheduled = habit ? isHabitScheduledForDate(habit, date) : true;
    if (isScheduled) scheduledDates.push(dateStr);
  }

  let longest = 0;
  let streak = 0;
  for (const dateStr of scheduledDates) {
    if (completedSet.has(dateStr)) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 0;
    }
  }
  longest = Math.max(longest, streak, current);

  return { current, longest };
}

