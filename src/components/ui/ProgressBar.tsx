import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const colorStyles = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
};

export function ProgressBar({ value, color = 'primary', size = 'md', showLabel, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-surface-light overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorStyles[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-text-muted min-w-[2.5rem] text-right">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
