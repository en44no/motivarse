import { cn } from '../../lib/utils';
import { getWeekDays, formatDate, formatDayName, getToday } from '../../lib/date-utils';
import type { HabitLog } from '../../types/habit';

interface HabitWeekViewProps {
  logs: HabitLog[];
  color: string;
  className?: string;
}

export function HabitWeekView({ logs, color, className }: HabitWeekViewProps) {
  const days = getWeekDays(); // Lunes a Domingo de la semana actual
  const today = getToday();
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  return (
    <div className={cn('flex items-center justify-between gap-1', className)}>
      {days.map((day) => {
        const date = formatDate(day);
        const isToday = date === today;
        const completed = completedDates.has(date);
        const isFuture = date > today;

        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <span className={cn(
              'text-[10px] font-medium uppercase',
              isToday ? 'text-text-primary' : 'text-text-muted'
            )}>
              {formatDayName(day).slice(0, 2)}
            </span>
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                completed && 'text-white shadow-sm',
                !completed && !isFuture && 'bg-surface-light text-text-muted',
                isFuture && 'bg-transparent border border-border text-text-muted/50',
                isToday && !completed && 'ring-2 ring-primary/30'
              )}
              style={completed ? { backgroundColor: color } : {}}
            >
              {day.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
