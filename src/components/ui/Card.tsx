import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'highlighted';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-4 shadow-sm border-t-white/[0.04]',
        variant === 'interactive' && 'cursor-pointer hover:bg-surface-hover hover:border-border-light hover:shadow-md hover:border-t-white/[0.06] transition-all duration-200 active:scale-[0.98]',
        variant === 'highlighted' && 'border-primary/30 bg-primary-soft shadow-[0_0_20px_rgba(34,197,94,0.08)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
