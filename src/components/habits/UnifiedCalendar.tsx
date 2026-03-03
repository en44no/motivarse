import { useState, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { formatDate, getToday, isHabitScheduledForDate } from '../../lib/date-utils';
import type { Habit, HabitLog } from '../../types/habit';
import type { RunLog } from '../../types/running';
import type { SharedTodo } from '../../types/shared';

interface UnifiedCalendarProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  runLogs: RunLog[];
  todos: SharedTodo[];
  userId?: string;
}

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export function UnifiedCalendar({
  habits,
  habitLogs,
  runLogs,
  todos,
  userId,
}: UnifiedCalendarProps) {
  const todayStr = getToday();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDate(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1));
    setSelectedDate(null);
  }, []);

  // Days of the current month
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Offset for first day of month (Monday = 0)
  const offset = useMemo(() => {
    const startDay = getDay(startOfMonth(currentMonth));
    return startDay === 0 ? 6 : startDay - 1;
  }, [currentMonth]);

  // Habit completion map: date -> Set<habitId>
  const habitCompletionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const userLogs = userId
      ? habitLogs.filter((l) => l.userId === userId && l.completed)
      : habitLogs.filter((l) => l.completed);
    for (const log of userLogs) {
      if (!map.has(log.date)) map.set(log.date, new Set());
      map.get(log.date)!.add(log.habitId);
    }
    return map;
  }, [habitLogs, userId]);

  // Run logs map: date -> RunLog[]
  const runLogMap = useMemo(() => {
    const map = new Map<string, RunLog[]>();
    const userRuns = userId
      ? runLogs.filter((r) => r.userId === userId)
      : runLogs;
    for (const run of userRuns) {
      if (!map.has(run.date)) map.set(run.date, []);
      map.get(run.date)!.push(run);
    }
    return map;
  }, [runLogs, userId]);

  // Completed todos map: date (YYYY-MM-DD) -> SharedTodo[]
  const todoMap = useMemo(() => {
    const map = new Map<string, SharedTodo[]>();
    const completed = todos.filter((t) => t.completed && t.completedAt);
    for (const todo of completed) {
      const date = formatDate(new Date(todo.completedAt!));
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(todo);
    }
    return map;
  }, [todos]);

  // Month/year label
  const monthLabel = useMemo(
    () => format(currentMonth, 'MMMM yyyy', { locale: es }),
    [currentMonth]
  );

  // Selected day detail data
  const selectedDetail = useMemo(() => {
    if (!selectedDate) return null;

    const dateObj = new Date(selectedDate + 'T12:00:00');
    const isFuture = selectedDate > todayStr;
    const label = format(dateObj, "EEEE d 'de' MMMM", { locale: es });

    const scheduledHabits = habits.filter((h) =>
      isHabitScheduledForDate(h, dateObj)
    );
    const completedHabitIds = habitCompletionMap.get(selectedDate);
    const dayRuns = runLogMap.get(selectedDate) || [];
    const dayTodos = todoMap.get(selectedDate) || [];

    const hasActivity =
      scheduledHabits.length > 0 || dayRuns.length > 0 || dayTodos.length > 0;

    return {
      label,
      isFuture,
      scheduledHabits,
      completedHabitIds,
      dayRuns,
      dayTodos,
      hasActivity,
    };
  }, [selectedDate, todayStr, habits, habitCompletionMap, runLogMap, todoMap]);

  return (
    <div className="space-y-3">
      {/* Calendar card */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
        {/* Header with month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold text-text-primary capitalize">
            {monthLabel}
          </h3>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day names row */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] text-text-muted font-medium py-0.5"
            >
              {d}
            </div>
          ))}

          {/* Empty cells for offset */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const date = formatDate(day);
            const isToday = date === todayStr;
            const isFuture = date > todayStr;
            const isSelected = date === selectedDate;

            const completedSet = habitCompletionMap.get(date);
            const completedCount = completedSet?.size || 0;
            const scheduledCount = habits.filter((h) =>
              isHabitScheduledForDate(h, day)
            ).length;
            const allDone =
              scheduledCount > 0 && completedCount >= scheduledCount;
            const someDone = completedCount > 0 && !allDone;

            const hasRun = runLogMap.has(date);
            const hasTodo = todoMap.has(date);

            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                onClick={() =>
                  !isFuture &&
                  setSelectedDate((prev) => (prev === date ? null : date))
                }
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all relative',
                  isFuture && 'opacity-30 cursor-default',
                  !isFuture && 'cursor-pointer active:scale-90',
                  isSelected && 'ring-2 ring-primary bg-primary/10',
                  !isSelected && isToday && 'ring-1 ring-primary/50',
                  !isSelected && !isToday && !isFuture && 'hover:bg-surface-hover',
                )}
              >
                {/* Day number */}
                <span
                  className={cn(
                    'text-[11px] font-medium leading-none',
                    isSelected
                      ? 'text-primary font-bold'
                      : isToday
                        ? 'text-text-primary font-bold'
                        : 'text-text-muted',
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Indicators row */}
                {!isFuture && (
                  <div className="flex items-center gap-px justify-center">
                    {/* Habit status dot */}
                    {scheduledCount > 0 && (
                      <div
                        className={cn(
                          'w-[5px] h-[5px] rounded-full',
                          allDone && 'bg-emerald-500',
                          someDone && 'bg-amber-500',
                          !allDone && !someDone && 'bg-border',
                        )}
                      />
                    )}
                    {/* Run indicator */}
                    {hasRun && (
                      <span className="text-[7px] leading-none">
                        {'\u{1F3C3}'}
                      </span>
                    )}
                    {/* Todo indicator */}
                    {hasTodo && (
                      <span className="text-[7px] leading-none">
                        {'\u{1F6D2}'}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <AnimatePresence mode="wait">
        {selectedDate && selectedDetail && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
              {/* Date header */}
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider capitalize">
                {selectedDetail.label}
              </h4>

              {selectedDetail.isFuture ? (
                <p className="text-xs text-text-muted">
                  Este dia todavia no llego.
                </p>
              ) : !selectedDetail.hasActivity ? (
                <p className="text-xs text-text-muted">
                  Sin actividad este dia
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Habits section */}
                  {selectedDetail.scheduledHabits.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        Habitos
                      </p>
                      {selectedDetail.scheduledHabits.map((habit) => {
                        const done =
                          selectedDetail.completedHabitIds?.has(habit.id) ||
                          false;
                        return (
                          <div
                            key={habit.id}
                            className="flex items-center gap-2.5"
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
                                done ? 'bg-primary/20' : 'bg-surface-light',
                              )}
                            >
                              {done ? (
                                <Check size={12} className="text-primary" />
                              ) : (
                                <X
                                  size={10}
                                  className="text-text-muted/50"
                                />
                              )}
                            </div>
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: habit.color }}
                            />
                            <span
                              className={cn(
                                'text-sm',
                                done
                                  ? 'text-text-primary'
                                  : 'text-text-muted',
                              )}
                            >
                              {habit.name}
                            </span>
                          </div>
                        );
                      })}
                      {/* Summary */}
                      <div className="pt-1 border-t border-border/50">
                        <span className="text-[10px] text-text-muted">
                          {
                            selectedDetail.scheduledHabits.filter((h) =>
                              selectedDetail.completedHabitIds?.has(h.id)
                            ).length
                          }
                          /{selectedDetail.scheduledHabits.length} completados
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Runs section */}
                  {selectedDetail.dayRuns.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        Carreras
                      </p>
                      {selectedDetail.dayRuns.map((run) => {
                        const label = run.isFreeRun
                          ? 'Carrera libre'
                          : run.cacoPlanWeek
                            ? `CaCo S${run.cacoPlanWeek}`
                            : 'Carrera';
                        return (
                          <div
                            key={run.id}
                            className="flex items-center gap-2 text-sm text-text-primary"
                          >
                            <span className="text-base leading-none">
                              {'\u{1F3C3}'}
                            </span>
                            <span>
                              {label} — {run.durationMinutes} min
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Todos section */}
                  {selectedDetail.dayTodos.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        Mandados
                      </p>
                      {selectedDetail.dayTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-2 text-sm text-text-primary"
                        >
                          <span className="text-base leading-none">
                            {'\u{1F6D2}'}
                          </span>
                          <span>{todo.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
