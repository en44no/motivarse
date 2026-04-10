import { Check, Lock, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
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
    <div
      className={cn(
        'rounded-2xl border p-3.5 transition-colors duration-150',
        isCurrent
          ? 'border-primary/40 bg-primary-soft/30 shadow-[var(--shadow-glow-primary)]'
          : isCompleted
          ? 'border-border/50 bg-surface/60 opacity-80'
          : isLocked
          ? 'border-border/40 bg-surface/40 opacity-55'
          : 'border-border/60 bg-surface hover:border-border-light',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums',
            isCompleted
              ? 'bg-primary text-primary-contrast'
              : isCurrent
              ? 'bg-primary-soft text-primary ring-1 ring-primary/40'
              : isLocked
              ? 'bg-surface-light text-text-muted'
              : 'bg-surface-light text-text-secondary',
          )}
        >
          {isCompleted ? (
            <Check size={18} strokeWidth={2.5} />
          ) : isCurrent ? (
            <Play size={16} fill="currentColor" />
          ) : isLocked ? (
            <Lock size={14} />
          ) : (
            week.week
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-sm font-semibold',
                isCurrent ? 'text-primary' : 'text-text-primary',
              )}
            >
              Semana {week.week}
            </h3>
            {isCurrent && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-primary-contrast">
                Actual
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-text-muted">{week.description}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-text-secondary">
            {week.totalMinutes}
            <span className="ml-0.5 text-2xs font-medium text-text-muted">min</span>
          </p>
          <p className="text-2xs text-text-muted">{runPct}% correr</p>
        </div>
      </div>

      {/* Run/Walk visual bar */}
      {week.walkMinutes > 0 ? (
        <div
          className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          {Array.from({ length: week.repetitions }).map((_, i) => (
            <div key={i} className="flex flex-1 gap-px">
              <div className="rounded-sm bg-primary/80" style={{ flex: week.runMinutes }} />
              <div className="rounded-sm bg-surface-light" style={{ flex: week.walkMinutes }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 h-1.5 rounded-full bg-primary/80" aria-hidden="true" />
      )}
    </div>
  );
}
