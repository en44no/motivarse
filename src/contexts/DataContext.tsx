import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { useCoupleContext } from './CoupleContext';
import { subscribeToHabits, subscribeToHabitLogs, subscribeToStreaks } from '../services/habits.service';
import { subscribeToRunLogs, subscribeToRunProgress } from '../services/running.service';
import { subscribeToTodos } from '../services/shared.service';
import { getToday, formatDate } from '../lib/date-utils';
import { subDays } from 'date-fns';
import type { Habit, HabitLog, HabitStreak } from '../types/habit';
import type { RunLog, RunProgress } from '../types/running';
import type { SharedTodo } from '../types/shared';

interface DataContextType {
  habits: Habit[];
  habitLogs: HabitLog[];
  streaks: HabitStreak[];
  runLogs: RunLog[];
  runProgress: RunProgress | null;
  todos: SharedTodo[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  habits: [],
  habitLogs: [],
  streaks: [],
  runLogs: [],
  runProgress: null,
  todos: [],
  loading: true,
});

function clearAllData(
  setHabits: (v: Habit[]) => void,
  setHabitLogs: (v: HabitLog[]) => void,
  setStreaks: (v: HabitStreak[]) => void,
  setRunLogs: (v: RunLog[]) => void,
  setRunProgress: (v: RunProgress | null) => void,
  setTodos: (v: SharedTodo[]) => void,
) {
  setHabits([]);
  setHabitLogs([]);
  setStreaks([]);
  setRunLogs([]);
  setRunProgress(null);
  setTodos([]);
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
  const [loading, setLoading] = useState(true);

  // Use couple.coupleId as fallback (couple is cached in localStorage)
  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid || null;

  // Track how many subscriptions have responded at least once
  const respondedRef = useRef(0);
  const expectedRef = useRef(0);

  useEffect(() => {
    // Auth still loading → wait
    if (authLoading) return;

    // No user = logged out → clear everything
    if (!user) {
      clearAllData(setHabits, setHabitLogs, setStreaks, setRunLogs, setRunProgress, setTodos);
      setLoading(false);
      return;
    }

    // User exists but no coupleId yet (profile still loading or genuinely no couple)
    // If profile hasn't loaded yet AND couple cache is null, stay loading briefly
    if (!coupleId) {
      // Profile explicitly loaded with no coupleId → genuinely no data
      if (profile && !profile.coupleId) {
        clearAllData(setHabits, setHabitLogs, setStreaks, setRunLogs, setRunProgress, setTodos);
        setLoading(false);
        return;
      }
      // Profile not loaded yet, no couple cache → wait with timeout
      const timeout = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeout);
    }

    // We have a coupleId → subscribe to all data
    let cancelled = false;
    respondedRef.current = 0;
    expectedRef.current = userId ? 6 : 4;
    setLoading(true);

    const unsubs: (() => void)[] = [];

    function onResponse() {
      respondedRef.current += 1;
      if (respondedRef.current >= expectedRef.current) {
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

    // User-scoped subscriptions
    if (userId) {
      let streaksFirst = true;
      unsubs.push(subscribeToStreaks(userId, (s) => {
        if (cancelled) return;
        setStreaks(s);
        if (streaksFirst) { streaksFirst = false; onResponse(); }
      }));

      let progressFirst = true;
      unsubs.push(subscribeToRunProgress(userId, (p) => {
        if (cancelled) return;
        setRunProgress(p);
        if (progressFirst) { progressFirst = false; onResponse(); }
      }));
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubs.forEach((u) => u());
    };
  }, [coupleId, userId, authLoading]);

  return (
    <DataContext.Provider value={{ habits, habitLogs, streaks, runLogs, runProgress, todos, loading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  return useContext(DataContext);
}
