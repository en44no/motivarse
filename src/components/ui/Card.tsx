import type { HTMLAttributes, KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'highlighted';
}

export function Card({ className, variant = 'default', children, onClick, ...props }: CardProps) {
  const isClickable = variant === 'interactive' && !!onClick;

  const handleKeyDown = isClickable
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as any);
        }
      }
    : undefined;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-4 shadow-sm border-t-white/[0.04]',
        variant === 'interactive' && 'cursor-pointer hover:bg-surface-hover hover:border-border-light hover:shadow-md hover:border-t-white/[0.06] transition-all duration-200 active:scale-[0.98]',
        variant === 'highlighted' && 'border-primary/30 bg-primary-soft shadow-[var(--shadow-glow-primary)]',
        className
      )}
      onClick={onClick}
      {...(isClickable ? { tabIndex: 0, role: 'button', onKeyDown: handleKeyDown } : {})}
      {...props}
    >
      {children}
    </div>
  );
}
