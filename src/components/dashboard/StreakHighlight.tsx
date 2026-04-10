import { memo } from 'react';
import { Flame } from 'lucide-react';
import { Card } from '../ui/Card';
import type { HabitStreak } from '../../types/habit';
import type { Habit } from '../../types/habit';

interface StreakHighlightProps {
  bestStreak: HabitStreak | null;
  habits: Habit[];
}

export const StreakHighlight = memo(function StreakHighlight({
  bestStreak,
  habits,
}: StreakHighlightProps) {
  if (!bestStreak || bestStreak.currentStreak === 0) return null;

  const habit = habits.find((h) => h.id === bestStreak.habitId);
  const days = bestStreak.currentStreak;
  const record = bestStreak.longestStreak;
  const isRecord = days >= record && record > 0;

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-soft">
        <Flame size={20} className="text-warning" strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
          Racha activa
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-text-secondary">
          {habit?.name || 'Hábito'}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-2xl font-bold tabular-nums text-text-primary leading-none">
          {days}
          <span className="ml-1 text-xs font-semibold text-text-muted">
            {days === 1 ? 'día' : 'días'}
          </span>
        </p>
        <p className="mt-1 text-2xs text-text-muted">
          {isRecord ? 'Nuevo récord' : `Récord ${record}`}
        </p>
      </div>
    </Card>
  );
});
