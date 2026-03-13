import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import {
  createHabit,
  toggleHabitLog,
  updateStreak,
  deleteHabit,
  updateHabit,
  batchUpdateHabitOrder,
} from '../services/habits.service';
import { calculateStreak } from '../lib/streak-utils';
import { getToday, isHabitScheduledForDate, getWeekDays, formatDate } from '../lib/date-utils';
import { subDays, startOfWeek, endOfWeek, format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Habit } from '../types/habit';

const notifyHabitCompleted = httpsCallable(getFunctions(), 'notifyHabitCompleted');

export function useHabits() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const { habits, habitLogs: logs, loading } = useDataContext();

  // Use couple.coupleId as fallback when profile is slow to load (couple is cached in localStorage)
  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid;

  // My active habits: habits I created + shared habits (active only)
  const myHabits = useMemo(
    () => habits.filter((h) => h.isActive && (h.userId === userId || h.scope === 'shared')),
    [habits, userId],
  );

  // Filter habits scheduled for today (respects frequency: daily/weekdays/weekends/custom)
  const todayHabits = useMemo(() => myHabits.filter((h) => isHabitScheduledForDate(h)), [myHabits]);

  const today = getToday();
  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const myTodayLogs = useMemo(() => todayLogs.filter((l) => l.userId === userId), [todayLogs, userId]);
  const partnerTodayLogs = useMemo(() => todayLogs.filter((l) => l.userId !== userId), [todayLogs, userId]);

  const getPartnerLog = useCallback(
    (habitId: string) =>
      todayLogs.find((l) => l.habitId === habitId && l.userId !== userId && l.completed),
    [todayLogs, userId]
  );

  const getLogsForHabit = useCallback(
    (habitId: string, uid?: string) =>
      logs.filter((l) => l.habitId === habitId && (uid ? l.userId === uid : true)),
    [logs]
  );

  const isCompletedToday = useCallback(
    (habitId: string, uid?: string) =>
      todayLogs.some((l) => l.habitId === habitId && l.userId === (uid || userId) && l.completed),
    [todayLogs, userId]
  );

  async function toggle(habitId: string, completed: boolean, value?: string, metGoal?: boolean, date?: string) {
    if (!userId || !coupleId) {
      toast.error('Error: sesion no lista. Intenta de nuevo en unos segundos.');
      return;
    }
    const targetDate = date || getToday();
    try {
      await toggleHabitLog(habitId, userId, coupleId, targetDate, completed, value, metGoal);

      // Recalculate streak (schedule-aware)
      const habit = habits.find((h) => h.id === habitId);
      const habitLogs = logs
        .filter((l) => l.habitId === habitId && l.userId === userId && l.completed)
        .map((l) => l.date);
      if (completed) habitLogs.push(targetDate);
      const uniqueDates = [...new Set(habitLogs)];
      const { current, longest } = calculateStreak(uniqueDates, habit ?? undefined);
      await updateStreak(habitId, userId, {
        currentStreak: current,
        longestStreak: longest,
        lastCompletedDate: completed ? targetDate : uniqueDates.sort().reverse()[0] || '',
      });

      // Fire-and-forget push notification to partner for shared habits
      if (completed && coupleId && habit?.scope === 'shared') {
        notifyHabitCompleted({ coupleId, habitName: habit.name }).catch(() => {});
      }
    } catch (error) {
      toast.error('No se pudo actualizar el habito. Intenta de nuevo.');
    }
  }

  function getLogsForDate(date: string) {
    return logs.filter((l) => l.date === date);
  }

  async function addCustomHabit(data: {
    name: string;
    type: Habit['type'];
    category: Habit['category'];
    icon: string;
    color: string;
    frequency: Habit['frequency'];
    customDays?: number[];
    goal?: Habit['goal'];
    scope?: Habit['scope'];
    completionMode?: Habit['completionMode'];
    reminder?: Habit['reminder'];
  }) {
    if (!userId || !coupleId) return;
    try {
      await createHabit({
        ...data,
        scope: data.scope || 'individual',
        completionMode: data.scope === 'shared' ? (data.completionMode || 'both') : undefined,
        ...(data.reminder ? { reminder: data.reminder } : {}),
        userId,
        coupleId,
        isPreset: false,
        isActive: true,
        order: habits.length,
        createdAt: Date.now(),
      });
      toast.success('Habito creado!');
    } catch (error) {
      toast.error('No se pudo crear el habito. Intenta de nuevo.');
    }
  }

  async function removeHabit(id: string) {
    if (!userId) return;
    try {
      await deleteHabit(id, userId);
      toast.success('Hábito eliminado');
    } catch (error) {
      toast.error('No se pudo eliminar el hábito.');
    }
  }

  async function reorderHabits(orderedIds: string[]) {
    try {
      await batchUpdateHabitOrder(orderedIds);
    } catch (error) {
      toast.error('No se pudo reordenar los hábitos.');
    }
  }

  async function editHabit(id: string, data: Partial<Habit>) {
    try {
      await updateHabit(id, data);
      toast.success('Habito actualizado!');
    } catch (error) {
      toast.error('No se pudo actualizar el habito.');
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statsData = useMemo(() => {
    const today = new Date();
    const todayStr = getToday();

    // --- Helper: get % for a date range ---
    function getPercentForRange(startDate: Date, endDate: Date, uid: string) {
      let totalScheduled = 0;
      let totalCompleted = 0;
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = formatDate(current);
        if (dateStr > todayStr) break; // don't count future days
        const scheduled = myHabits.filter((h) => isHabitScheduledForDate(h, current));
        totalScheduled += scheduled.length;
        totalCompleted += scheduled.filter((h) =>
          logs.some((l) => l.habitId === h.id && l.userId === uid && l.date === dateStr && l.completed)
        ).length;
        current.setDate(current.getDate() + 1);
      }
      return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    }

    // --- This week (Mon-today) ---
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weeklyPercent = getPercentForRange(thisWeekStart, today, userId || '');

    // --- Last week (full Mon-Sun) ---
    const lastWeekEnd = subDays(thisWeekStart, 1);
    const lastWeekStart = startOfWeek(lastWeekEnd, { weekStartsOn: 1 });
    const lastWeekPercent = getPercentForRange(lastWeekStart, lastWeekEnd, userId || '');

    // --- Best day of the week (historical) ---
    const dayTotals: Record<number, { scheduled: number; completed: number }> = {};
    for (let i = 0; i < 7; i++) dayTotals[i] = { scheduled: 0, completed: 0 };

    // Scan last 35 days
    for (let i = 0; i < 35; i++) {
      const d = subDays(today, i);
      const dateStr = formatDate(d);
      const dow = getDay(d);
      const scheduled = myHabits.filter((h) => isHabitScheduledForDate(h, d));
      dayTotals[dow].scheduled += scheduled.length;
      dayTotals[dow].completed += scheduled.filter((h) =>
        logs.some((l) => l.habitId === h.id && l.userId === userId && l.date === dateStr && l.completed)
      ).length;
    }

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let bestDayIdx = 0;
    let bestDayPct = 0;
    for (let i = 0; i < 7; i++) {
      const pct = dayTotals[i].scheduled > 0
        ? Math.round((dayTotals[i].completed / dayTotals[i].scheduled) * 100)
        : 0;
      if (pct > bestDayPct) {
        bestDayPct = pct;
        bestDayIdx = i;
      }
    }

    // --- Perfect days this month ---
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    let perfectDays = 0;
    const cursor = new Date(monthStart);
    while (cursor <= today) {
      const dateStr = formatDate(cursor);
      const scheduled = myHabits.filter((h) => isHabitScheduledForDate(h, cursor));
      if (scheduled.length > 0) {
        const completed = scheduled.filter((h) =>
          logs.some((l) => l.habitId === h.id && l.userId === userId && l.date === dateStr && l.completed)
        ).length;
        if (completed === scheduled.length) perfectDays++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // --- Daily data for last 14 days (chart) ---
    const dailyData: { date: string; label: string; myPercent: number; partnerPercent: number }[] = [];
    const partnerIds = logs
      .filter((l) => l.userId !== userId)
      .map((l) => l.userId);
    const partnerId = partnerIds.length > 0 ? partnerIds[0] : null;

    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = formatDate(d);
      const label = format(d, 'dd/MM');
      const scheduled = myHabits.filter((h) => isHabitScheduledForDate(h, d));
      const total = scheduled.length;

      const myCompleted = total > 0
        ? scheduled.filter((h) =>
            logs.some((l) => l.habitId === h.id && l.userId === userId && l.date === dateStr && l.completed)
          ).length
        : 0;

      const partnerCompleted = total > 0 && partnerId
        ? scheduled.filter((h) =>
            logs.some((l) => l.habitId === h.id && l.userId === partnerId && l.date === dateStr && l.completed)
          ).length
        : 0;

      dailyData.push({
        date: dateStr,
        label,
        myPercent: total > 0 ? Math.round((myCompleted / total) * 100) : 0,
        partnerPercent: total > 0 ? Math.round((partnerCompleted / total) * 100) : 0,
      });
    }

    return {
      weeklyPercent,
      lastWeekPercent,
      bestDayName: dayNames[bestDayIdx],
      bestDayPercent: bestDayPct,
      perfectDays,
      dailyData,
    };
  }, [myHabits, logs, userId]);

  // Fix: use todayHabits (filtered by day frequency) for progress calculation
  const todayProgress = todayHabits.length > 0
    ? Math.round(
        (myTodayLogs.filter((l) =>
          l.completed && todayHabits.some((h) => h.id === l.habitId)
        ).length / todayHabits.length) * 100
      )
    : 0;

  return {
    habits,
    myHabits,
    todayHabits,
    logs,
    todayLogs,
    partnerTodayLogs,
    loading,
    toggle,
    isCompletedToday,
    getLogsForHabit,
    getPartnerLog,
    addCustomHabit,
    removeHabit,
    editHabit,
    reorderHabits,
    todayProgress,
    statsData,
    getLogsForDate,
  };
}
