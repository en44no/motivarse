import { motion } from 'framer-motion';

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

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80">
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 280 280"
      >
        {/* Background circle */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          fill="none"
          stroke="var(--color-surface-light)"
          strokeWidth="10"
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
        />
      </svg>

      {/* Timer text inside ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-6xl sm:text-7xl font-extrabold font-mono text-text-primary tracking-tight"
          key={secondsLeft}
          initial={false}
          animate={
            secondsLeft <= 5 && state === 'running'
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ duration: 0.3 }}
        >
          {formatTime(secondsLeft)}
        </motion.span>
        <span className="text-sm text-text-muted mt-2 font-medium">
          {state === 'idle'
            ? 'Listo para empezar'
            : state === 'paused'
            ? 'En pausa'
            : `${isRunPhase ? runMinutes : walkMinutes} min`}
        </span>
      </div>
    </div>
  );
}
