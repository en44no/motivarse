import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TodaySummaryProps {
  progress: number;
  completedCount: number;
  totalCount: number;
}

export function TodaySummary({ progress, completedCount, totalCount }: TodaySummaryProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-5 bg-surface rounded-2xl border border-border p-5">
      <div className="relative w-28 h-28 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-surface-light)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={progress >= 100 ? 'var(--color-primary)' : 'var(--color-secondary)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold font-mono text-text-primary">{progress}%</span>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          {progress >= 100 ? '¡Día perfecto!' : progress > 50 ? '¡Vas bien!' : 'Dale que se puede'}
        </h2>
        <p className="text-sm text-text-muted mt-1">
          {completedCount} de {totalCount} hábitos completados hoy
        </p>
        {progress >= 100 && (
          <p className="text-xs text-primary mt-2 font-semibold">Todos los hábitos listos 🎉</p>
        )}
      </div>
    </div>
  );
}
