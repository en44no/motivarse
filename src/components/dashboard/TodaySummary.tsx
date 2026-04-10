import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Confetti } from '../ui/Confetti';
import { playCelebration } from '../../lib/sound-utils';
import { vibrateMilestone } from '../../lib/celebration-utils';

interface TodaySummaryProps {
  progress: number;
  completedCount: number;
  totalCount: number;
  soundEnabled?: boolean;
}

const EASE = [0.32, 0.72, 0, 1] as const;

export const TodaySummary = memo(function TodaySummary({
  progress,
  completedCount,
  totalCount,
  soundEnabled = true,
}: TodaySummaryProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const prevProgressRef = useRef(progress);

  // Trigger confetti only when progress transitions to 100%
  useEffect(() => {
    if (progress >= 100 && prevProgressRef.current < 100 && totalCount > 0) {
      setShowConfetti(true);
      if (soundEnabled) playCelebration();
      vibrateMilestone();
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = progress;
  }, [progress, totalCount, soundEnabled]);

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isComplete = progress >= 100;
  const isEmpty = totalCount === 0;

  // Title: short, calm, intimate
  const title = isEmpty
    ? 'Sin hábitos hoy'
    : isComplete
      ? 'Día completo'
      : progress > 50
        ? 'Vas muy bien'
        : progress > 0
          ? 'En marcha'
          : 'Empezá el día';

  const subtitle = isEmpty
    ? 'Agregá un hábito para empezar'
    : `${completedCount} de ${totalCount} hábitos completados`;

  return (
    <>
      {showConfetti && <Confetti count={50} />}
      <section
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-sm',
          'transition-colors duration-200',
        )}
        aria-label="Progreso de hoy"
      >
        {/* Subtle top accent that reflects state, never dominates */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-px transition-colors duration-200',
            isComplete
              ? 'bg-primary/40'
              : progress > 0
                ? 'bg-primary/20'
                : 'bg-border/60',
          )}
          aria-hidden
        />

        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 shrink-0">
            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 120 120"
              role="img"
              aria-label={`Progreso ${progress}%`}
            >
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--color-surface-light)"
                strokeWidth="7"
              />
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.9, ease: EASE }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-text-primary">
                {progress}
                <span className="text-base font-semibold text-text-muted">%</span>
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
              Hoy
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-text-primary">
              {title}
            </h2>
            <p className="mt-1 text-sm text-text-muted leading-snug">{subtitle}</p>
          </div>
        </div>
      </section>
    </>
  );
});
