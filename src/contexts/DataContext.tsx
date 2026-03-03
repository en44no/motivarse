import { createContext, useContext, useEffect, useState, useRef, useMemo, type ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { useCoupleContext } from './CoupleContext';
import { subscribeToHabits, subscribeToHabitLogs, subscribeToStreaks, deleteOrphanedStreaks } from '../services/habits.service';
import { subscribeToRunLogs, subscribeToRunProgress } from '../services/running.service';
import { subscribeToTodos, subscribeToPurchaseHistory } from '../services/shared.service';
import { getToday, formatDate } from '../lib/date-utils';
import { subDays } from 'date-fns';
import type { Habit, HabitLog, HabitStreak } from '../types/habit';
import type { RunLog, RunProgress } from '../types/running';
import type { SharedTodo, PurchaseRecord } from '../types/shared';

interface DataContextType {
  habits: Habit[];
  habitLogs: HabitLog[];
  streaks: HabitStreak[];
  runLogs: RunLog[];
  runProgress: RunProgress | null;
  todos: SharedTodo[];
  purchaseHistory: PurchaseRecord[];
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  habits: [],
  habitLogs: [],
  streaks: [],
  runLogs: [],
  runProgress: null,
  todos: [],
  purchaseHistory: [],
  loading: true,
  error: null,
});

function clearAllData(
  setHabits: (v: Habit[]) => void,
  setHabitLogs: (v: HabitLog[]) => void,
  setStreaks: (v: HabitStreak[]) => void,
  setRunLogs: (v: RunLog[]) => void,
  setRunProgress: (v: RunProgress | null) => void,
  setTodos: (v: SharedTodo[]) => void,
  setPurchaseHistory: (v: PurchaseRecord[]) => void,
) {
  setHabits([]);
  setHabitLogs([]);
  setStreaks([]);
  setRunLogs([]);
  setRunProgress(null);
  setTodos([]);
  setPurchaseHistory([]);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuthContext();
  const { couple } = useCoupleContext();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [runProgress, setRunProgress] = useState<RunProgress | null>(null);
  const [todos, setTodos] = useState<SharedTodo[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use couple.coupleId as fallback (couple is cached in localStorage)
  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid || null;

  // Track how many subscriptions have responded at least once
  const respondedRef = useRef(0);
  const expectedRef = useRef(0);
  // Once data has loaded, don't regress to loading state on re-subscriptions
  const hasLoadedRef = useRef(false);
  const orphanCleanedRef = useRef(false);

  useEffect(() => {
    // Auth still loading → wait
    if (authLoading) return;

    // No user = logged out → clear everything
    if (!user) {
      clearAllData(setHabits, setHabitLogs, setStreaks, setRunLogs, setRunProgress, setTodos, setPurchaseHistory);
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }

    if (!coupleId) {
      if (profile && !profile.coupleId) {
        clearAllData(setHabits, setHabitLogs, setStreaks, setRunLogs, setRunProgress, setTodos, setPurchaseHistory);
        hasLoadedRef.current = false;
        setLoading(false);
        return;
      }
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    // We have a coupleId → subscribe to all data
    let cancelled = false;
    respondedRef.current = 0;
    expectedRef.current = userId ? 7 : 6;
    setError(null);
    // Only show loading on first load; on re-subscriptions keep showing existing data
    if (!hasLoadedRef.current) setLoading(true);

    const unsubs: (() => void)[] = [];

    function onResponse() {
      respondedRef.current += 1;
      if (respondedRef.current >= expectedRef.current) {
        hasLoadedRef.current = true;
        setLoading(false);
      }
    }

    // 5s timeout fallback
    const timeout = setTimeout(() => setLoading(false), 5000);

    // Couple-scoped subscriptions
    let habitsFirst = true;
    unsubs.push(subscribeToHabits(coupleId, (h) => {
      if (cancelled) return;
      setHabits(h);
      if (habitsFirst) { habitsFirst = false; onResponse(); }
    }));

    let logsFirst = true;
    const endDate = getToday();
    const startDate = formatDate(subDays(new Date(), 35));
    unsubs.push(subscribeToHabitLogs(coupleId, startDate, endDate, (l) => {
      if (cancelled) return;
      setHabitLogs(l);
      if (logsFirst) { logsFirst = false; onResponse(); }
    }));

    let runLogsFirst = true;
    unsubs.push(subscribeToRunLogs(coupleId, (logs) => {
      if (cancelled) return;
      setRunLogs(logs);
      if (runLogsFirst) { runLogsFirst = false; onResponse(); }
    }));

    let todosFirst = true;
    unsubs.push(subscribeToTodos(coupleId, (t) => {
      if (cancelled) return;
      setTodos(t);
      if (todosFirst) { todosFirst = false; onResponse(); }
    }));

    let purchaseFirst = true;
    unsubs.push(subscribeToPurchaseHistory(coupleId, (records) => {
      if (cancelled) return;
      setPurchaseHistory(records);
      if (purchaseFirst) { purchaseFirst = false; onResponse(); }
    }));

    let progressFirst = true;
    unsubs.push(subscribeToRunProgress(coupleId, (p) => {
      if (cancelled) return;
      setRunProgress(p);
      if (progressFirst) { progressFirst = false; onResponse(); }
    }));

    // User-scoped subscriptions
    if (userId) {
      let streaksFirst = true;
      unsubs.push(subscribeToStreaks(userId, (s) => {
        if (cancelled) return;
        setStreaks(s);
        if (streaksFirst) { streaksFirst = false; onResponse(); }
      }));
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubs.forEach((u) => u());
    };
  }, [coupleId, userId, authLoading]);

  // Clean up orphaned streaks once per session after data is loaded
  useEffect(() => {
    if (!userId || loading || streaks.length === 0 || orphanCleanedRef.current) return;
    const activeIds = habits.map((h) => h.id);
    const hasOrphans = streaks.some((s) => !activeIds.includes(s.habitId));
    if (!hasOrphans) return;
    orphanCleanedRef.current = true;
    deleteOrphanedStreaks(userId, activeIds).catch(console.error);
  }, [userId, loading, habits, streaks]);

  const value = useMemo(() => ({
    habits, habitLogs, streaks, runLogs, runProgress, todos, purchaseHistory, loading, error,
  }), [habits, habitLogs, streaks, runLogs, runProgress, todos, purchaseHistory, loading, error]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  return useContext(DataContext);
}
