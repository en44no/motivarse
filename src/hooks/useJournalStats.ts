import { useMemo } from 'react';
import { subDays, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { formatDate, getToday } from '../lib/date-utils';
import type { JournalEntry } from '../types/journal';

interface JournalStats {
  totalEntries: number;
  streak: number;
  topMood: [string, number] | undefined;
  thisMonthEntries: number;
}

export function useJournalStats(entries: JournalEntry[]): JournalStats | null {
  return useMemo(() => {
    if (entries.length === 0) return null;

    const totalEntries = entries.length;

    // Writing streak: consecutive days with entries ending today or yesterday
    const today = getToday();
    let streak = 0;
    let checkDate = today;
    for (let i = 0; i < 60; i++) {
      if (entries.some((e) => e.date === checkDate)) {
        streak++;
        checkDate = formatDate(subDays(parseISO(checkDate), 1));
      } else if (i === 0) {
        checkDate = formatDate(subDays(parseISO(checkDate), 1));
        continue;
      } else {
        break;
      }
    }

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });
    const topMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0] as [string, number] | undefined;

    // Days with entries this month
    const thisMonth = format(new Date(), 'yyyy-MM');
    const thisMonthEntries = entries.filter((e) => e.date.startsWith(thisMonth)).length;

    return { totalEntries, streak, topMood, thisMonthEntries };
  }, [entries]);
}
