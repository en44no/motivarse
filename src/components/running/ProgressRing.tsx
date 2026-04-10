import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
  progress: number;
  secondsLeft: number;
  state: string;
  phaseColor: string;
  isRunPhase: boolean;
  runMinutes: number;
  walkMinutes: number;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ProgressRing({
  progress,
  secondsLeft,
  state,
  phaseColor,
  isRunPhase,
  runMinutes,
  walkMinutes,
}: ProgressRingProps) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const isPaused = state === 'paused';

  return (
    <div className="relative h-72 w-72 sm:h-80 sm:w-80">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 280 280">
        {/* Background circle */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke="var(--color-surface-light)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke={phaseColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
          style={{ opacity: isPaused ? 0.4 : 1 }}
        />
      </svg>

      {/* Timer text inside ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn(
            'font-mono text-6xl font-extrabold tracking-tight text-text-primary tabular-nums sm:text-7xl',
            isPaused && 'opacity-50',
          )}
          key={secondsLeft}
          initial={false}
          animate={
            secondsLeft <= 5 && state === 'running'
              ? { scale: [1, 1.04, 1] }
              : {}
          }
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {formatTime(secondsLeft)}
        </motion.span>
        <span className="mt-2 text-2xs font-semibold uppercase tracking-wide text-text-muted">
          {state === 'idle'
            ? 'Listo para empezar'
            : state === 'paused'
            ? 'En pausa'
            : `${isRunPhase ? runMinutes : walkMinutes} min total`}
        </span>
      </div>
    </div>
  );
}
