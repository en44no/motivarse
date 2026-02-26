import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { cn } from '../../lib/utils';
import { formatDate, getToday } from '../../lib/date-utils';
import type { HabitLog } from '../../types/habit';

interface HabitMonthViewProps {
  logs: HabitLog[];
  color: string;
  habitName: string;
}

export function HabitMonthView({ logs, color, habitName }: HabitMonthViewProps) {
  const today = new Date();
  const todayStr = getToday();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  // Pad start of month
  const startDay = getDay(start); // 0=Sun
  const offset = startDay === 0 ? 6 : startDay - 1; // Monday-based

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-secondary">{habitName}</h3>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] text-text-muted font-medium py-1">{d}</div>
        ))}
        {/* Empty cells for offset */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* Day cells */}
        {days.map((day) => {
          const date = formatDate(day);
          const completed = completedDates.has(date);
          const isToday = date === todayStr;
          const isFuture = date > todayStr;

          return (
            <div
              key={date}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-all',
                completed && 'text-white shadow-sm ring-1 ring-white/10',
                !completed && !isFuture && 'bg-surface-light/50 text-text-muted',
                isFuture && 'text-text-muted/30',
                isToday && !completed && 'ring-2 ring-primary/50'
              )}
              style={completed ? { backgroundColor: color } : {}}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted text-center">
        {completedDates.size} días completados este mes
      </p>
    </div>
  );
}
