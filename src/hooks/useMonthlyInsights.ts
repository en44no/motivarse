import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useDataContext } from '../contexts/DataContext';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useJournal } from './useJournal';
import { isHabitScheduledForDate, formatDate } from '../lib/date-utils';
import { MOOD_OPTIONS } from '../config/constants';
import type { Habit, HabitLog } from '../types/habit';
import type { RunLog } from '../types/running';
import type { JournalEntry } from '../types/journal';

export interface MonthlyInsights {
  // Month info
  monthLabel: string;
  year: number;
  month: number;

  // Stats overview
  habitsCompleted: number;
  habitsScheduled: number;
  habitsPercent: number;
  habitsDelta: number | null; // % change vs prev month, null if no prev data
  totalKm: number;
  kmDelta: number | null;
  journalEntries: number;
  bestStreak: number;

  // Habit consistency (per habit)
  habitConsistency: {
    name: string;
    icon: string;
    myPercent: number;
    partnerPercent: number;
  }[];

  // Mood trend
  moodData: { date: string; label: string; mood: number; emoji: string }[];
  averageMood: number | null;

  // Running summary
  runningSessions: number;
  runningTotalKm: number;
  runningAvgPace: string | null;
  bestRun: { distance: number; duration: number; date: string } | null;
  cacoWeeksCompleted: number;

  // Weekly breakdown
  weeklyBreakdown: { label: string; completed: number }[];

  // Highlights (auto-generated text)
  highlights: string[];

  // Has any data
  hasData: boolean;
}

function getMonthRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return { start, end, startStr: formatDate(start), endStr: formatDate(end) };
}

function countScheduledDays(habit: Habit, days: Date[]): number {
  return days.filter((d) => isHabitScheduledForDate(habit, d)).length;
}

function logsInRange(logs: HabitLog[], startStr: string, endStr: string): HabitLog[] {
  return logs.filter((l) => l.date >= startStr && l.date <= endStr && l.completed);
}

function runLogsInRange(logs: RunLog[], startStr: string, endStr: string): RunLog[] {
  return logs.filter((l) => l.date >= startStr && l.date <= endStr);
}

function journalInRange(entries: JournalEntry[], startStr: string, endStr: string): JournalEntry[] {
  return entries.filter((e) => e.date >= startStr && e.date <= endStr);
}

function parsePace(pace: string | undefined): number | null {
  if (!pace) return null;
  const parts = pace.split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function useMonthlyInsights(year: number, month: number): MonthlyInsights {
  const { habits, habitLogs, streaks, runLogs, runProgress } = useDataContext();
  const { user } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { entries: journalEntries } = useJournal();
  const userId = user?.uid || '';

  return useMemo(() => {
    const { start, end, startStr, endStr } = getMonthRange(year, month);
    const days = eachDayOfInterval({ start, end });
    const monthLabel = format(start, 'MMMM', { locale: es });

    // Previous month for comparison
    const prevStart = subMonths(start, 1);
    const prevEnd = endOfMonth(prevStart);
    const prevStartStr = formatDate(prevStart);
    const prevEndStr = formatDate(prevEnd);
    const prevDays = eachDayOfInterval({ start: prevStart, end: prevEnd });

    const activeHabits = habits.filter((h) => h.isActive);

    // --- My logs this month ---
    const myLogsThisMonth = logsInRange(habitLogs, startStr, endStr).filter(
      (l) => l.userId === userId
    );
    const partnerLogsThisMonth = logsInRange(habitLogs, startStr, endStr).filter(
      (l) => l.userId !== userId
    );

    // --- Habits completed / scheduled ---
    let totalScheduled = 0;
    let totalCompleted = 0;
    let prevScheduled = 0;
    let prevCompleted = 0;

    const habitConsistency = activeHabits.map((habit) => {
      const scheduled = countScheduledDays(habit, days);
      const myCompleted = myLogsThisMonth.filter((l) => l.habitId === habit.id).length;
      const partnerCompleted = partnerLogsThisMonth.filter((l) => l.habitId === habit.id).length;
      const partnerScheduled = scheduled; // same schedule

      totalScheduled += scheduled;
      totalCompleted += myCompleted;

      // Prev month
      const prevSched = countScheduledDays(habit, prevDays);
      const prevMyComp = logsInRange(habitLogs, prevStartStr, prevEndStr).filter(
        (l) => l.userId === userId && l.habitId === habit.id
      ).length;
      prevScheduled += prevSched;
      prevCompleted += prevMyComp;

      return {
        name: habit.name,
        icon: habit.icon,
        myPercent: scheduled > 0 ? Math.round((myCompleted / scheduled) * 100) : 0,
        partnerPercent: partnerScheduled > 0 ? Math.round((partnerCompleted / partnerScheduled) * 100) : 0,
      };
    });

    const habitsPercent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    const prevPercent = prevScheduled > 0 ? Math.round((prevCompleted / prevScheduled) * 100) : 0;
    const habitsDelta = prevScheduled > 0 ? habitsPercent - prevPercent : null;

    // --- Running ---
    const myRunsThisMonth = runLogsInRange(runLogs, startStr, endStr).filter(
      (l) => l.userId === userId
    );
    const prevMyRuns = runLogsInRange(runLogs, prevStartStr, prevEndStr).filter(
      (l) => l.userId === userId
    );

    const totalKm = myRunsThisMonth.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
    const prevKm = prevMyRuns.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
    const kmDelta = prevMyRuns.length > 0 ? totalKm - prevKm : null;

    const paces = myRunsThisMonth.map((r) => parsePace(r.paceMinKm)).filter((p): p is number => p !== null);
    const runningAvgPace = paces.length > 0 ? formatPace(paces.reduce((a, b) => a + b, 0) / paces.length) : null;

    const bestRun = myRunsThisMonth.length > 0
      ? myRunsThisMonth.reduce((best, r) => {
          const dist = r.distanceKm || 0;
          const bestDist = best.distanceKm || 0;
          return dist > bestDist ? r : best;
        })
      : null;

    // CaCo weeks completed this month
    const cacoWeeksThisMonth = new Set(
      myRunsThisMonth.filter((r) => r.cacoPlanWeek).map((r) => r.cacoPlanWeek)
    );

    // --- Journal ---
    const monthJournal = journalInRange(journalEntries, startStr, endStr);

    // Mood data
    const moodData = monthJournal
      .filter((e) => e.mood)
      .map((e) => {
        const moodOption = MOOD_OPTIONS.find((m) => m.emoji === e.mood);
        return {
          date: e.date,
          label: format(parseISO(e.date), 'd MMM', { locale: es }),
          mood: moodOption?.value ?? 3,
          emoji: e.mood!,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const averageMood = moodData.length > 0
      ? Math.round((moodData.reduce((sum, m) => sum + m.mood, 0) / moodData.length) * 10) / 10
      : null;

    // --- Best streak this month ---
    // Calculate from logs: for each habit, find longest consecutive run in the month
    let bestMonthStreak = 0;
    for (const habit of activeHabits) {
      const scheduledDates = days
        .filter((d) => isHabitScheduledForDate(habit, d))
        .map((d) => formatDate(d));
      const completedDates = new Set(
        myLogsThisMonth.filter((l) => l.habitId === habit.id).map((l) => l.date)
      );
      let current = 0;
      let longest = 0;
      for (const date of scheduledDates) {
        if (completedDates.has(date)) {
          current++;
          longest = Math.max(longest, current);
        } else {
          current = 0;
        }
      }
      bestMonthStreak = Math.max(bestMonthStreak, longest);
    }

    // --- Weekly breakdown ---
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    const weeklyBreakdown = weekStarts.map((weekStart, i) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const clampedEnd = weekEnd > end ? end : weekEnd;
      const clampedStart = weekStart < start ? start : weekStart;
      const wStartStr = formatDate(clampedStart);
      const wEndStr = formatDate(clampedEnd);
      const completed = myLogsThisMonth.filter(
        (l) => l.date >= wStartStr && l.date <= wEndStr
      ).length;
      return {
        label: `Sem ${i + 1}`,
        completed,
      };
    });

    // --- Highlights ---
    const highlights: string[] = [];

    if (habitConsistency.length > 0) {
      const best = [...habitConsistency].sort((a, b) => b.myPercent - a.myPercent)[0];
      if (best.myPercent > 0) {
        highlights.push(`Tu habito mas constante fue ${best.icon} ${best.name} con ${best.myPercent}% de completitud`);
      }
    }

    if (kmDelta !== null && kmDelta > 0) {
      highlights.push(`Corriste ${kmDelta.toFixed(1)}km mas que el mes pasado`);
    } else if (kmDelta !== null && kmDelta < 0) {
      highlights.push(`Corriste ${Math.abs(kmDelta).toFixed(1)}km menos que el mes pasado`);
    }

    if (weeklyBreakdown.length > 0) {
      const bestWeek = weeklyBreakdown.reduce((best, w) =>
        w.completed > best.completed ? w : best
      );
      if (bestWeek.completed > 0) {
        highlights.push(`Tu mejor semana fue ${bestWeek.label} con ${bestWeek.completed} habitos completados`);
      }
    }

    if (monthJournal.length > 0) {
      highlights.push(`Escribiste ${monthJournal.length} ${monthJournal.length === 1 ? 'entrada' : 'entradas'} en tu diario`);
    }

    if (bestMonthStreak >= 3) {
      highlights.push(`Tu mejor racha del mes fue de ${bestMonthStreak} dias seguidos`);
    }

    if (myRunsThisMonth.length > 0) {
      highlights.push(`Completaste ${myRunsThisMonth.length} ${myRunsThisMonth.length === 1 ? 'sesion' : 'sesiones'} de carrera`);
    }

    const hasData = totalCompleted > 0 || myRunsThisMonth.length > 0 || monthJournal.length > 0;

    return {
      monthLabel,
      year,
      month,
      habitsCompleted: totalCompleted,
      habitsScheduled: totalScheduled,
      habitsPercent,
      habitsDelta,
      totalKm: Math.round(totalKm * 10) / 10,
      kmDelta: kmDelta !== null ? Math.round(kmDelta * 10) / 10 : null,
      journalEntries: monthJournal.length,
      bestStreak: bestMonthStreak,
      habitConsistency,
      moodData,
      averageMood,
      runningSessions: myRunsThisMonth.length,
      runningTotalKm: Math.round(totalKm * 10) / 10,
      runningAvgPace,
      bestRun: bestRun
        ? { distance: bestRun.distanceKm || 0, duration: bestRun.durationMinutes, date: bestRun.date }
        : null,
      cacoWeeksCompleted: cacoWeeksThisMonth.size,
      weeklyBreakdown,
      highlights,
      hasData,
    };
  }, [habits, habitLogs, runLogs, journalEntries, userId, year, month]);
}
