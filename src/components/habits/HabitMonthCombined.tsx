import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { cn } from '../../lib/utils';
import { formatDate, getToday } from '../../lib/date-utils';
import type { Habit, HabitLog } from '../../types/habit';

interface HabitMonthCombinedProps {
  habits: Habit[];
  getLogsForHabit: (habitId: string, uid?: string) => HabitLog[];
  userId?: string;
}

export function HabitMonthCombined({ habits, getLogsForHabit, userId }: HabitMonthCombinedProps) {
  const today = new Date();
  const todayStr = getToday();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  // Build completion map: date -> Set of completed habitIds
  const completionMap = new Map<string, Set<string>>();
  for (const habit of habits) {
    const logs = getLogsForHabit(habit.id, userId);
    for (const log of logs) {
      if (log.completed) {
        if (!completionMap.has(log.date)) completionMap.set(log.date, new Set());
        completionMap.get(log.date)!.add(habit.id);
      }
    }
  }

  const startDay = getDay(start);
  const offset = startDay === 0 ? 6 : startDay - 1;
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const totalHabits = habits.length;

  // Count total completed days (all habits done)
  const perfectDays = days.filter((day) => {
    const date = formatDate(day);
    if (date > todayStr) return false;
    const done = completionMap.get(date);
    return done && done.size >= totalHabits;
  }).length;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">
          {start.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
        </h3>
        <span className="text-xs text-text-muted">{perfectDays} dias perfectos</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] text-text-muted font-medium py-0.5">{d}</div>
        ))}

        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const date = formatDate(day);
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          const completedSet = completionMap.get(date);
          const completedCount = completedSet?.size || 0;
          const allDone = totalHabits > 0 && completedCount >= totalHabits;
          const someDone = completedCount > 0 && !allDone;

          return (
            <div
              key={date}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all relative',
                allDone && 'bg-primary/20 ring-1 ring-primary/30',
                someDone && !isFuture && 'bg-surface-light/80',
                !completedCount && !isFuture && 'bg-surface-light/30',
                isFuture && 'opacity-30',
                isToday && 'ring-2 ring-primary/60',
              )}
            >
              <span className={cn(
                'text-[11px] font-medium leading-none',
                allDone ? 'text-primary font-bold' : 'text-text-muted',
              )}>
                {day.getDate()}
              </span>

              {/* Habit dots */}
              {!isFuture && totalHabits > 0 && (
                <div className="flex gap-px justify-center flex-wrap max-w-[90%]">
                  {habits.slice(0, 5).map((habit) => {
                    const done = completedSet?.has(habit.id);
                    return (
                      <div
                        key={habit.id}
                        className="rounded-full"
                        style={{
                          width: totalHabits <= 3 ? 4 : 3,
                          height: totalHabits <= 3 ? 4 : 3,
                          backgroundColor: done ? habit.color : 'var(--color-border)',
                        }}
                      />
                    );
                  })}
                  {habits.length > 5 && (
                    <div
                      className="rounded-full bg-border"
                      style={{ width: 3, height: 3 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {habits.map((habit) => {
          const logs = getLogsForHabit(habit.id, userId);
          const count = logs.filter((l) => l.completed).length;
          return (
            <div key={habit.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
              <span className="text-[10px] text-text-muted">{habit.name} ({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
