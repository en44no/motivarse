import {
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type DialogSize = 'sm' | 'md' | 'lg';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Subtitle opcional debajo del titulo */
  subtitle?: ReactNode;
  /** Slot opcional para acciones a la derecha del header (junto al close) */
  headerAction?: ReactNode;
  /** Slot opcional para footer sticky (CTAs principales) */
  footer?: ReactNode;
  /** max-width en desktop. Default: md (max-w-2xl) */
  size?: DialogSize;
  children: ReactNode;
  className?: string;
  /** Clase extra para el contenedor del scroll body */
  bodyClassName?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-3xl',
};

/**
 * Sheet/Dialog responsive.
 *
 * - **Mobile**: bottom sheet casi-fullscreen (h ~92vh) con drag handle visual,
 *   sticky header arriba y footer opcional sticky abajo. Slide-up con tween rapido.
 * - **Desktop**: modal centrado max-w-2xl. Misma estructura sticky.
 *
 * Animaciones cortas (tween 220ms ease-out estilo iOS), no spring.
 * Focus trap, restore focus on close, Escape, click backdrop to close.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  headerAction,
  footer,
  size = 'md',
  children,
  className,
  bodyClassName,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Save previously focused element when opening
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Focus first focusable on open, restore on close
  useEffect(() => {
    if (!open) {
      if (
        previouslyFocused.current &&
        typeof previouslyFocused.current.focus === 'function'
      ) {
        previouslyFocused.current.focus();
      }
      return;
    }
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        // Prefer focusing the dialog container itself (not auto-jumping into form fields,
        // que en mobile abre el teclado y se ve mal). Solo cae al primer focusable
        // si el container no es focusable.
        dialogRef.current.focus();
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap + Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  // Easing iOS-like (smooth, no bounce)
  const easing = [0.32, 0.72, 0, 1] as const;

  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: easing }}
            onClick={onClose}
          />

          {/* Sheet container */}
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
            onClick={onClose}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              className={cn(
                'relative w-full flex flex-col bg-surface outline-none',
                'h-[92vh] sm:h-auto sm:max-h-[88vh]',
                'rounded-t-3xl sm:rounded-3xl',
                'border-t border-l border-r border-border/60 sm:border',
                'shadow-[var(--shadow-lg)]',
                sizeClasses[size],
                className,
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: easing }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile only, visual) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border-light/80" />
              </div>

              {/* Sticky header */}
              {title && (
                <header className="flex items-start justify-between gap-3 px-5 py-3 sm:py-4 border-b border-border/60 shrink-0">
                  <div className="min-w-0 flex-1">
                    <h2
                      id={titleId}
                      className="text-lg font-semibold text-text-primary truncate"
                    >
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {headerAction}
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Cerrar"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </header>
              )}

              {/* Scroll body */}
              <div
                className={cn(
                  'flex-1 overflow-y-auto overscroll-contain px-5 py-5',
                  bodyClassName,
                )}
              >
                {children}
              </div>

              {/* Sticky footer */}
              {footer && (
                <footer className="px-5 py-4 border-t border-border/60 bg-surface/80 backdrop-blur-sm shrink-0 safe-bottom">
                  {footer}
                </footer>
              )}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
