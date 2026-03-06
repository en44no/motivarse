import { useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { addWaterLog, resetWaterLogs } from '../services/water.service';
import { toggleHabitLog, updateStreak } from '../services/habits.service';
import { calculateStreak } from '../lib/streak-utils';
import { getToday } from '../lib/date-utils';
import { WATER_GOAL_ML } from '../types/water';

const notifyHabitCompleted = httpsCallable(getFunctions(), 'notifyHabitCompleted');

export function useWater(habitId: string, selectedDate?: string) {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { waterLogs, habitLogs: logs, habits } = useDataContext();

  const userId = user?.uid || '';
  const coupleId = couple?.coupleId || '';
  const today = getToday();
  const date = selectedDate || today;

  const myTotal = useMemo(
    () => waterLogs
      .filter((l) => l.userId === userId && l.date === date)
      .reduce((sum, l) => sum + l.amount, 0),
    [waterLogs, userId, date]
  );

  const partnerTotal = useMemo(
    () => waterLogs
      .filter((l) => l.userId !== userId && l.date === date)
      .reduce((sum, l) => sum + l.amount, 0),
    [waterLogs, userId, date]
  );

  const isGoalMet = myTotal >= WATER_GOAL_ML;

  const isHabitCompleted = useMemo(
    () => logs.some((l) => l.habitId === habitId && l.userId === userId && l.date === date && l.completed),
    [logs, habitId, userId, date]
  );

  const recalcStreak = useCallback(async (completed: boolean) => {
    const habitLogs = logs
      .filter((l) => l.habitId === habitId && l.userId === userId && l.completed)
      .map((l) => l.date);
    if (completed) habitLogs.push(date);
    else {
      const idx = habitLogs.indexOf(date);
      if (idx !== -1) habitLogs.splice(idx, 1);
    }
    const uniqueDates = [...new Set(habitLogs)];
    const { current, longest } = calculateStreak(uniqueDates);
    await updateStreak(habitId, userId, {
      currentStreak: current,
      longestStreak: longest,
      lastCompletedDate: completed ? date : uniqueDates.sort().reverse()[0] || '',
    });
  }, [logs, habitId, userId, date]);

  // Auto-complete habit when goal is met (only for today)
  const autoCompletingRef = useRef(false);
  useEffect(() => {
    if (date !== today) return;
    if (isGoalMet && !isHabitCompleted && !autoCompletingRef.current) {
      autoCompletingRef.current = true;
      (async () => {
        try {
          await toggleHabitLog(habitId, userId, coupleId, today, true);
          await recalcStreak(true);
          // Notify partner for shared water habits
          if (coupleId) {
            const habit = habits.find((h) => h.id === habitId);
            if (habit?.scope === 'shared') {
              notifyHabitCompleted({ coupleId, habitName: habit.name }).catch(() => {});
            }
          }
        } finally {
          autoCompletingRef.current = false;
        }
      })();
    }
  }, [isGoalMet, isHabitCompleted, habitId, userId, coupleId, today, date, recalcStreak, habits]);

  const addIntake = useCallback(async (amount: number) => {
    if (!userId || !coupleId) return;
    try {
      await addWaterLog({
        userId,
        coupleId,
        date,
        amount,
        timestamp: Date.now(),
      });
    } catch {
      toast.error('No se pudo registrar el agua.');
    }
  }, [userId, coupleId, date]);

  const resetDay = useCallback(async () => {
    if (!userId || !coupleId) return;
    try {
      await resetWaterLogs(userId, coupleId, date);
      if (isHabitCompleted) {
        await toggleHabitLog(habitId, userId, coupleId, date, false);
        await recalcStreak(false);
      }
    } catch {
      toast.error('No se pudo reiniciar el agua.');
    }
  }, [userId, coupleId, date, isHabitCompleted, habitId, recalcStreak]);

  return { myTotal, partnerTotal, isGoalMet, addIntake, resetDay };
}
