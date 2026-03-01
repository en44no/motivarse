import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import {
  createHabit,
  toggleHabitLog,
  updateStreak,
  deleteHabit,
  updateHabit,
} from '../services/habits.service';
import { calculateStreak } from '../lib/streak-utils';
import { getToday, isHabitScheduledForDate } from '../lib/date-utils';
import type { Habit } from '../types/habit';

export function useHabits() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const { habits, habitLogs: logs, loading } = useDataContext();

  // Use couple.coupleId as fallback when profile is slow to load (couple is cached in localStorage)
  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // My habits: habits I created + shared habits (regardless of creator)
  const myHabits = habits.filter((h) => h.userId === userId || h.scope === 'shared');

  // Filter habits scheduled for today (respects frequency: daily/weekdays/weekends/custom)
  const todayHabits = myHabits.filter((h) => isHabitScheduledForDate(h));

  const todayLogs = logs.filter((l) => l.date === getToday());
  const myTodayLogs = todayLogs.filter((l) => l.userId === userId);
  const partnerTodayLogs = todayLogs.filter((l) => l.userId !== userId);

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

  async function toggle(habitId: string, completed: boolean, value?: string, metGoal?: boolean) {
    if (!userId || !coupleId) {
      toast.error('Error: sesion no lista. Intenta de nuevo en unos segundos.');
      return;
    }
    try {
      await toggleHabitLog(habitId, userId, coupleId, getToday(), completed, value, metGoal);

      // Recalculate streak
      const habitLogs = logs
        .filter((l) => l.habitId === habitId && l.userId === userId && l.completed)
        .map((l) => l.date);
      if (completed) habitLogs.push(getToday());
      const uniqueDates = [...new Set(habitLogs)];
      const { current, longest } = calculateStreak(uniqueDates);
      await updateStreak(habitId, userId, {
        currentStreak: current,
        longestStreak: longest,
        lastCompletedDate: completed ? getToday() : uniqueDates.sort().reverse()[0] || '',
      });
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast.error('No se pudo actualizar el habito. Intenta de nuevo.');
    }
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
  }) {
    if (!userId || !coupleId) return;
    try {
      await createHabit({
        ...data,
        scope: data.scope || 'individual',
        completionMode: data.scope === 'shared' ? (data.completionMode || 'both') : undefined,
        userId,
        coupleId,
        isPreset: false,
        isActive: true,
        order: habits.length,
        createdAt: Date.now(),
      });
      toast.success('Habito creado!');
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error('No se pudo crear el habito. Intenta de nuevo.');
    }
  }

  function removeHabit(id: string) {
    // Undo pattern: show toast with undo, soft-delete after 3s
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    let cancelled = false;
    toast('Habito eliminado', {
      action: {
        label: 'Deshacer',
        onClick: () => { cancelled = true; },
      },
      duration: 3000,
    });

    undoTimerRef.current = setTimeout(async () => {
      if (cancelled) return;
      try {
        await deleteHabit(id);
      } catch (error) {
        console.error('Error removing habit:', error);
        toast.error('No se pudo eliminar el habito.');
      }
    }, 3200);
  }

  async function editHabit(id: string, data: Partial<Habit>) {
    try {
      await updateHabit(id, data);
      toast.success('Habito actualizado!');
    } catch (error) {
      console.error('Error editing habit:', error);
      toast.error('No se pudo actualizar el habito.');
    }
  }

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
    todayProgress,
  };
}
