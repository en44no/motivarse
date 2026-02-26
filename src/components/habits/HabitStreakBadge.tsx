import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStreakEmoji } from '../../lib/streak-utils';

interface HabitStreakBadgeProps {
  streak: number;
  className?: string;
}

export function HabitStreakBadge({ streak, className }: HabitStreakBadgeProps) {
  if (streak === 0) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
        streak >= 7
          ? 'bg-secondary-soft text-secondary'
          : 'bg-surface-light text-text-secondary',
        className
      )}
    >
      {streak >= 7 ? <Flame size={12} className="text-secondary" /> : <span>{getStreakEmoji(streak)}</span>}
      <span className="font-mono">{streak}</span>
    </div>
  );
}
