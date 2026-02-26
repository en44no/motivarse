import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'highlighted';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-4',
        variant === 'interactive' && 'cursor-pointer hover:bg-surface-hover hover:border-border-light transition-all duration-200 active:scale-[0.98]',
        variant === 'highlighted' && 'border-primary/30 bg-primary-soft',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
