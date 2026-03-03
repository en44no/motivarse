import { subDays, parseISO } from 'date-fns';
import { formatDate } from './date-utils';

export interface StreakPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  length: number;    // days
  isCurrent: boolean;
}

/**
 * Compute all streak periods from a sorted array of completed dates.
 * A streak is consecutive days with at least one completed habit.
 * Returns periods sorted by startDate descending (most recent first).
 */
export function computeStreakHistory(
  completedDates: string[],
  today: string
): StreakPeriod[] {
  if (completedDates.length === 0) return [];

  const sorted = [...new Set(completedDates)].sort();
  const periods: StreakPeriod[] = [];

  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(end);
    const curr = parseISO(sorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day — extend the streak
      end = sorted[i];
    } else {
      // Gap — save current period and start new one
      const length = Math.round(
        (parseISO(end).getTime() - parseISO(start).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      periods.push({ startDate: start, endDate: end, length, isCurrent: false });
      start = sorted[i];
      end = sorted[i];
    }
  }

  // Push the last period
  const length = Math.round(
    (parseISO(end).getTime() - parseISO(start).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  periods.push({ startDate: start, endDate: end, length, isCurrent: false });

  // Mark the last period as current if it includes today or yesterday
  const yesterday = formatDate(subDays(parseISO(today), 1));
  const lastPeriod = periods[periods.length - 1];
  if (lastPeriod && (lastPeriod.endDate === today || lastPeriod.endDate === yesterday)) {
    lastPeriod.isCurrent = true;
  }

  // Return sorted by startDate descending (most recent first)
  return periods.sort((a, b) => (a.startDate > b.startDate ? -1 : 1));
}
