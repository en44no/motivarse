import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { addWaterLog, resetWaterLogs } from '../services/water.service';
import { toggleHabitLog, updateStreak } from '../services/habits.service';
import { calculateStreak } from '../lib/streak-utils';
import { getToday } from '../lib/date-utils';
import { WATER_GOAL_ML } from '../types/water';

export function useWater(habitId: string) {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { waterLogs, habitLogs: logs } = useDataContext();

  const userId = user?.uid || '';
  const coupleId = couple?.coupleId || '';
  const today = getToday();

  const myTotal = useMemo(
    () => waterLogs
      .filter((l) => l.userId === userId && l.date === today)
      .reduce((sum, l) => sum + l.amount, 0),
    [waterLogs, userId, today]
  );

  const partnerTotal = useMemo(
    () => waterLogs
      .filter((l) => l.userId !== userId && l.date === today)
      .reduce((sum, l) => sum + l.amount, 0),
    [waterLogs, userId, today]
  );

  const isGoalMet = myTotal >= WATER_GOAL_ML;

  const isHabitCompleted = useMemo(
    () => logs.some((l) => l.habitId === habitId && l.userId === userId && l.date === today && l.completed),
    [logs, habitId, userId, today]
  );

  const recalcStreak = useCallback(async (completed: boolean) => {
    const habitLogs = logs
      .filter((l) => l.habitId === habitId && l.userId === userId && l.completed)
      .map((l) => l.date);
    if (completed) habitLogs.push(today);
    else {
      const idx = habitLogs.indexOf(today);
      if (idx !== -1) habitLogs.splice(idx, 1);
    }
    const uniqueDates = [...new Set(habitLogs)];
    const { current, longest } = calculateStreak(uniqueDates);
    await updateStreak(habitId, userId, {
      currentStreak: current,
      longestStreak: longest,
      lastCompletedDate: completed ? today : uniqueDates.sort().reverse()[0] || '',
    });
  }, [logs, habitId, userId, today]);

  const addIntake = useCallback(async (amount: number) => {
    if (!userId || !coupleId) return;
    try {
      await addWaterLog({
        userId,
        coupleId,
        date: today,
        amount,
        timestamp: Date.now(),
      });

      const newTotal = myTotal + amount;
      if (newTotal >= WATER_GOAL_ML && !isHabitCompleted) {
        await toggleHabitLog(habitId, userId, coupleId, today, true);
        await recalcStreak(true);
      }
    } catch {
      toast.error('No se pudo registrar el agua.');
    }
  }, [userId, coupleId, today, myTotal, isHabitCompleted, habitId, recalcStreak]);

  const resetDay = useCallback(async () => {
    if (!userId || !coupleId) return;
    try {
      await resetWaterLogs(userId, coupleId, today);
      if (isHabitCompleted) {
        await toggleHabitLog(habitId, userId, coupleId, today, false);
        await recalcStreak(false);
      }
    } catch {
      toast.error('No se pudo reiniciar el agua.');
    }
  }, [userId, coupleId, today, isHabitCompleted, habitId, recalcStreak]);

  return { myTotal, partnerTotal, isGoalMet, addIntake, resetDay };
}
