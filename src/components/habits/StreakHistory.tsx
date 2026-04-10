import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, HeartCrack } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { computeStreakHistory } from '../../lib/streak-history';
import { isHabitScheduledForDate, formatDate, getToday } from '../../lib/date-utils';
import type { Habit, HabitLog } from '../../types/habit';
import type { StreakPeriod } from '../../lib/streak-history';

interface StreakHistoryProps {
  habits: Habit[];
  logs: HabitLog[];
  userId?: string;
}

const MAX_SHOWN = 10;

export function StreakHistory({ habits, logs, userId }: StreakHistoryProps) {
  const streakPeriods = useMemo(() => {
    if (!userId || habits.length === 0) return [];

    const today = getToday();
    const todayDate = parseISO(today);

    // Determine perfect days: dates where user completed ALL scheduled habits
    // Scan last 90 days (or as far as logs go)
    const perfectDates: string[] = [];

    for (let i = 0; i < 90; i++) {
      const d = subDays(todayDate, i);
      const dateStr = formatDate(d);

      // Don't count future dates
      if (dateStr > today) continue;

      const scheduled = habits.filter((h) => isHabitScheduledForDate(h, d));
      if (scheduled.length === 0) continue;

      const allCompleted = scheduled.every((h) =>
        logs.some(
          (l) =>
            l.habitId === h.id &&
            l.userId === userId &&
            l.date === dateStr &&
            l.completed
        )
      );

      if (allCompleted) {
        perfectDates.push(dateStr);
      }
    }

    return computeStreakHistory(perfectDates, today);
  }, [habits, logs, userId]);

  // Don't render if no habits
  if (!userId || habits.length === 0) return null;

  const shown = streakPeriods.slice(0, MAX_SHOWN);
  const maxLength = Math.max(...shown.map((s) => s.length), 1);

  function formatRange(period: StreakPeriod): string {
    const start = format(parseISO(period.startDate), 'd MMM', { locale: es });
    const end = format(parseISO(period.endDate), 'd MMM', { locale: es });
    if (period.length === 1) return start;
    return `${start} → ${end}`;
  }

  return (
    <div className="bg-surface rounded-2xl border border-border/60 p-4 space-y-3 shadow-sm border-t-white/[0.04]">
      <div className="flex items-center gap-2">
        <Flame size={16} className="text-secondary" />
        <h3 className="text-base font-semibold text-text-primary">
          Historial de rachas
        </h3>
      </div>

      {shown.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          Completá todos tus hábitos un día para iniciar una racha
        </p>
      ) : (
        <div className="space-y-2.5">
          {shown.map((period, i) => (
            <motion.div
              key={period.startDate}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2, ease: 'easeOut' }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                {period.isCurrent ? (
                  <Flame size={14} className="text-primary shrink-0" />
                ) : (
                  <HeartCrack size={14} className="text-text-muted shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    period.isCurrent ? 'text-primary' : 'text-text-primary'
                  )}
                >
                  {period.length} {period.length === 1 ? 'día' : 'días'}
                </span>
                {period.isCurrent && (
                  <span className="text-2xs font-semibold text-primary bg-primary-soft rounded-full px-1.5 py-0.5">
                    actual
                  </span>
                )}
                <span className="text-2xs text-text-muted ml-auto tabular-nums">
                  {formatRange(period)}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-surface-light overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    period.isCurrent ? 'bg-primary' : 'bg-text-muted/40'
                  )}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max((period.length / maxLength) * 100, 4)}%`,
                  }}
                  transition={{
                    delay: i * 0.05 + 0.1,
                    duration: 0.3,
                    ease: 'easeOut',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
