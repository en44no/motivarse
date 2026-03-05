import { useState } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDate, getToday, isHabitScheduledForDate } from '../../lib/date-utils';
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

  const [selectedDate, setSelectedDate] = useState(todayStr);

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

  // Selected day detail
  const selectedDayDate = new Date(selectedDate + 'T12:00:00');
  const isFutureSelected = selectedDate > todayStr;
  const scheduledForSelected = habits.filter((h) => isHabitScheduledForDate(h, selectedDayDate));
  const completedSetSelected = completionMap.get(selectedDate);
  const selectedLabel = format(selectedDayDate, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-3">
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-secondary">
            {start.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </h3>
          <span className="text-xs text-text-muted">{perfectDays} días perfectos</span>
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
            const isSelected = date === selectedDate;
            const completedSet = completionMap.get(date);
            const completedCount = completedSet?.size || 0;
            const allDone = totalHabits > 0 && completedCount >= totalHabits;
            const someDone = completedCount > 0 && !allDone;

            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                onClick={() => !isFuture && setSelectedDate(date)}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all relative',
                  allDone && 'bg-primary/20',
                  someDone && !isFuture && 'bg-surface-light/80',
                  !completedCount && !isFuture && 'bg-surface-light/30',
                  isFuture && 'opacity-30 cursor-default',
                  !isFuture && 'cursor-pointer active:scale-90',
                  isSelected && 'ring-2 ring-primary',
                  !isSelected && isToday && 'ring-1 ring-primary/40',
                )}
              >
                <span className={cn(
                  'text-[11px] font-medium leading-none',
                  allDone ? 'text-primary font-bold' : 'text-text-muted',
                  isSelected && 'text-text-primary font-bold',
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-2.5">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider capitalize">
          {selectedLabel}
        </h4>

        {isFutureSelected ? (
          <p className="text-xs text-text-muted">Este dia todavia no llego.</p>
        ) : scheduledForSelected.length === 0 ? (
          <p className="text-xs text-text-muted">Sin habitos programados para este dia.</p>
        ) : (
          <div className="space-y-1.5">
            {scheduledForSelected.map((habit) => {
              const done = completedSetSelected?.has(habit.id) || false;
              return (
                <div key={habit.id} className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
                      done ? 'bg-primary/20' : 'bg-surface-light',
                    )}
                  >
                    {done ? (
                      <Check size={12} className="text-primary" />
                    ) : (
                      <X size={10} className="text-text-muted/50" />
                    )}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className={cn(
                    'text-sm',
                    done ? 'text-text-primary' : 'text-text-muted',
                  )}>
                    {habit.name}
                  </span>
                </div>
              );
            })}
            {/* Summary */}
            <div className="pt-1.5 border-t border-border/50">
              <span className="text-[10px] text-text-muted">
                {scheduledForSelected.filter((h) => completedSetSelected?.has(h.id)).length}/{scheduledForSelected.length} completados
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
