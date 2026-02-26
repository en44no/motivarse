import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import type { HabitStreak } from '../../types/habit';
import type { Habit } from '../../types/habit';

interface StreakHighlightProps {
  bestStreak: HabitStreak | null;
  habits: Habit[];
}

export function StreakHighlight({ bestStreak, habits }: StreakHighlightProps) {
  if (!bestStreak || bestStreak.currentStreak === 0) return null;

  const habit = habits.find((h) => h.id === bestStreak.habitId);

  return (
    <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary-soft flex items-center justify-center">
          <Flame
            size={22}
            className={cn(
              'text-secondary',
              bestStreak.currentStreak >= 7 && 'animate-pulse'
            )}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-secondary">
            🔥 {bestStreak.currentStreak} días seguidos
          </p>
          <p className="text-xs text-text-muted">
            {habit?.name || 'Hábito'} · Récord: {bestStreak.longestStreak}
          </p>
        </div>
      </div>
    </Card>
  );
}
