import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={errorId}
          className={cn(
            'w-full rounded-xl border border-border bg-surface-hover px-4 py-3 text-base text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            'transition-all duration-200',
            error && 'border-danger focus:ring-danger/50',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} role="alert" className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
