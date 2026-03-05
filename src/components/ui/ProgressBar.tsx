import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const colorStyles = {
  primary: 'bg-gradient-to-r from-primary to-primary-hover shadow-[var(--shadow-glow-primary)]',
  secondary: 'bg-gradient-to-r from-secondary to-secondary-hover shadow-[var(--shadow-glow-secondary)]',
  accent: 'bg-gradient-to-r from-accent to-accent-hover shadow-[var(--shadow-glow-accent)]',
};

export function ProgressBar({ value, color = 'primary', size = 'md', showLabel, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-surface-light overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <motion.div
          className={cn('h-full rounded-full', colorStyles[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-text-muted min-w-[2.5rem] text-right">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
