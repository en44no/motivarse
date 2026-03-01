import { useState, useEffect, useRef } from 'react';
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

export function TodaySummary({ progress, completedCount, totalCount, soundEnabled = true }: TodaySummaryProps) {
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
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
    {showConfetti && <Confetti count={50} />}
    <div className={cn(
      'flex items-center gap-5 rounded-2xl border border-border p-5 shadow-md',
      'bg-gradient-to-br from-surface via-surface to-surface-light',
      progress >= 100 ? 'border-t-2 border-t-primary' : progress > 50 ? 'border-t-2 border-t-secondary' : 'border-t-2 border-t-border'
    )}>
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
            style={progress >= 100 ? { filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))' } : {}}
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
    </>
  );
}
