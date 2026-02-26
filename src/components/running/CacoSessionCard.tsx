import { Check, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import type { CacoWeek } from '../../types/running';
import { getRunPercentage } from '../../lib/caco-plan';

interface CacoSessionCardProps {
  week: CacoWeek;
  isCurrent: boolean;
  isCompleted: boolean;
  isLocked: boolean;
}

export function CacoSessionCard({ week, isCurrent, isCompleted, isLocked }: CacoSessionCardProps) {
  const runPct = getRunPercentage(week);

  return (
    <Card
      className={cn(
        'transition-all',
        isCurrent && 'border-primary/40 bg-primary-soft/20 shadow-lg shadow-primary/5',
        isCompleted && 'opacity-70',
        isLocked && 'opacity-40'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
            isCompleted ? 'bg-primary text-white' : isCurrent ? 'bg-primary-soft text-primary' : 'bg-surface-light text-text-muted'
          )}
        >
          {isCompleted ? <Check size={18} /> : isCurrent ? <Play size={16} /> : week.week}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn('text-sm font-bold', isCurrent ? 'text-primary' : 'text-text-primary')}>
              Semana {week.week}
            </h3>
            {isCurrent && (
              <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                ACTUAL
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{week.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-mono font-bold text-text-secondary">{week.totalMinutes}min</p>
          <p className="text-[10px] text-text-muted">{runPct}% corriendo</p>
        </div>
      </div>

      {/* Run/Walk visual bar */}
      {week.walkMinutes > 0 && (
        <div className="flex gap-0.5 mt-3 h-2 rounded-full overflow-hidden">
          {Array.from({ length: week.repetitions }).map((_, i) => (
            <div key={i} className="flex flex-1 gap-px">
              <div className="flex-1 bg-primary rounded-sm" style={{ flex: week.runMinutes }} />
              <div className="flex-1 bg-surface-light rounded-sm" style={{ flex: week.walkMinutes }} />
            </div>
          ))}
        </div>
      )}
      {week.walkMinutes === 0 && (
        <div className="mt-3 h-2 rounded-full bg-primary" />
      )}
    </Card>
  );
}
