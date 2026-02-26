import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-b from-primary to-emerald-600 text-white hover:from-primary-hover hover:to-emerald-700 active:scale-[0.97] shadow-[0_2px_8px_rgba(34,197,94,0.3)]',
  secondary: 'bg-gradient-to-b from-secondary to-orange-600 text-white hover:from-secondary-hover hover:to-orange-700 active:scale-[0.97] shadow-[0_2px_8px_rgba(249,115,22,0.3)]',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  danger: 'bg-gradient-to-b from-danger to-red-600 text-white hover:from-red-600 hover:to-red-700 active:scale-[0.97] shadow-[0_2px_8px_rgba(239,68,68,0.3)]',
  outline: 'border border-border text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 bg-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
