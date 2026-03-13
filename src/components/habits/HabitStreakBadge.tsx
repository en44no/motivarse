import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HabitStreakBadgeProps {
  streak: number;
  className?: string;
}

export function HabitStreakBadge({ streak, className }: HabitStreakBadgeProps) {
  if (streak === 0) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold',
        streak >= 7
          ? 'bg-secondary-soft text-secondary'
          : 'bg-surface-light text-text-secondary',
        className
      )}
    >
      <Flame size={12} className={streak >= 7 ? 'text-secondary' : 'text-text-muted'} />
      <span className="font-mono">{streak}</span>
    </div>
  );
}
