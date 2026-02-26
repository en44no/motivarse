import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
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

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuthContext();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [runProgress, setRunProgress] = useState<RunProgress | null>(null);
  const [todos, setTodos] = useState<SharedTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = profile?.coupleId || null;
  const userId = user?.uid || null;

  // Track how many subscriptions have responded at least once
  const respondedRef = useRef(0);
  const expectedRef = useRef(0);

  useEffect(() => {
    // Profile not loaded yet → stay in loading
    if (!profile) return;

    // Profile loaded but no coupleId → no data to load
    if (!coupleId) {
      setHabits([]);
      setHabitLogs([]);
      setRunLogs([]);
      setTodos([]);
      setLoading(false);
      return;
    }

    respondedRef.current = 0;
    // We expect: habits, habitLogs, runLogs, todos + (userId ? streaks, runProgress : 0)
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
      setHabits(h);
      if (habitsFirst) { habitsFirst = false; onResponse(); }
    }));

    let logsFirst = true;
    const endDate = getToday();
    const startDate = formatDate(subDays(new Date(), 35));
    unsubs.push(subscribeToHabitLogs(coupleId, startDate, endDate, (l) => {
      setHabitLogs(l);
      if (logsFirst) { logsFirst = false; onResponse(); }
    }));

    let runLogsFirst = true;
    unsubs.push(subscribeToRunLogs(coupleId, (logs) => {
      setRunLogs(logs);
      if (runLogsFirst) { runLogsFirst = false; onResponse(); }
    }));

    let todosFirst = true;
    unsubs.push(subscribeToTodos(coupleId, (t) => {
      setTodos(t);
      if (todosFirst) { todosFirst = false; onResponse(); }
    }));

    // User-scoped subscriptions
    if (userId) {
      let streaksFirst = true;
      unsubs.push(subscribeToStreaks(userId, (s) => {
        setStreaks(s);
        if (streaksFirst) { streaksFirst = false; onResponse(); }
      }));

      let progressFirst = true;
      unsubs.push(subscribeToRunProgress(userId, (p) => {
        setRunProgress(p);
        if (progressFirst) { progressFirst = false; onResponse(); }
      }));
    }

    return () => {
      clearTimeout(timeout);
      unsubs.forEach((u) => u());
    };
  }, [coupleId, userId, profile]);

  return (
    <DataContext.Provider value={{ habits, habitLogs, streaks, runLogs, runProgress, todos, loading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  return useContext(DataContext);
}
