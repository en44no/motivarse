import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type IconButtonVariant =
  | 'ghost'
  | 'outline'
  | 'solid'
  | 'subtle'
  | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Accesibilidad: SIEMPRE pasar aria-label porque no hay texto */
  'aria-label': string;
  children: ReactNode;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'w-9 h-9',   // 36px — solo para toolbars compactas, no es mobile-touch ideal
  md: 'w-11 h-11', // 44px — DEFAULT, cumple WCAG touch target
  lg: 'w-12 h-12', // 48px — CTAs prominentes
};

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    'text-text-muted hover:text-text-primary hover:bg-surface-hover',
  subtle:
    'bg-surface-light text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  outline:
    'border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  solid:
    'bg-primary text-primary-contrast hover:bg-primary-hover shadow-sm',
  danger:
    'text-danger hover:bg-danger/10',
};

/**
 * Boton de un solo icono. Wrapper reusable que asegura touch targets,
 * focus visible y consistencia visual.
 *
 * - `md` (44x44) es el default y cumple WCAG.
 * - `sm` (36x36) solo para toolbars dentro de cards (no para mobile-critical).
 * - SIEMPRE pasar `aria-label`.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = 'ghost', size = 'md', className, children, type, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cn(
          'inline-flex items-center justify-center rounded-xl shrink-0',
          'transition-colors duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'disabled:opacity-40 disabled:pointer-events-none',
          'active:scale-[0.96]',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
