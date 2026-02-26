import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToHabits,
  subscribeToHabitLogs,
  createHabit,
  toggleHabitLog,
  updateStreak,
  deleteHabit,
  updateHabit,
} from '../services/habits.service';
import { calculateStreak } from '../lib/streak-utils';
import { getToday, formatDate } from '../lib/date-utils';
import { PRESET_HABITS } from '../config/constants';
import type { Habit, HabitLog } from '../types/habit';
import { subDays } from 'date-fns';

export function useHabits() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Use coupleId if linked, otherwise use own uid so app works solo
  const coupleId = profile?.coupleId || user?.uid || null;
  const userId = user?.uid;

  // Subscribe to habits
  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToHabits(coupleId, (h) => {
      setHabits(h);
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  // Subscribe to logs for last 35 days (for month view + streaks)
  useEffect(() => {
    if (!coupleId) return;
    const endDate = getToday();
    const startDate = formatDate(subDays(new Date(), 35));
    const unsub = subscribeToHabitLogs(coupleId, startDate, endDate, setLogs);
    return unsub;
  }, [coupleId]);

  // My habits: habits I created + shared habits (regardless of creator)
  const myHabits = habits.filter((h) => h.userId === userId || h.scope === 'shared');

  const todayLogs = logs.filter((l) => l.date === getToday());
  const myTodayLogs = todayLogs.filter((l) => l.userId === userId);
  const partnerTodayLogs = todayLogs.filter((l) => l.userId !== userId);

  const getPartnerLog = useCallback(
    (habitId: string): HabitLog | undefined =>
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
    if (!userId || !coupleId) return;
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
  }

  async function addPresetHabits() {
    if (!userId || !coupleId) {
      console.error('addPresetHabits: missing userId or coupleId', { userId, coupleId });
      return;
    }
    try {
      for (let i = 0; i < PRESET_HABITS.length; i++) {
        const preset = PRESET_HABITS[i];
        await createHabit({
          userId,
          coupleId,
          name: preset.name,
          type: preset.type,
          category: preset.category,
          icon: preset.icon,
          color: preset.color,
          isPreset: true,
          frequency: preset.frequency,
          customDays: 'customDays' in preset ? [...preset.customDays] : undefined,
          goal: 'goal' in preset ? { ...preset.goal } : undefined,
          scope: preset.scope,
          completionMode: preset.completionMode,
          isActive: true,
          order: i,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error creating preset habits:', err);
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
  }

  async function removeHabit(id: string) {
    await deleteHabit(id);
  }

  async function editHabit(id: string, data: Partial<Habit>) {
    await updateHabit(id, data);
  }

  const todayProgress = myHabits.length > 0
    ? Math.round((myTodayLogs.filter((l) => l.completed).length / myHabits.length) * 100)
    : 0;

  return {
    habits,
    myHabits,
    logs,
    todayLogs,
    partnerTodayLogs,
    loading,
    toggle,
    isCompletedToday,
    getLogsForHabit,
    getPartnerLog,
    addPresetHabits,
    addCustomHabit,
    removeHabit,
    editHabit,
    todayProgress,
  };
}
