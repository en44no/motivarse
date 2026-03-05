import { Fragment, type ReactNode, useEffect, useId, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Save previously focused element when opening
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Focus first focusable element on open, restore on close
  useEffect(() => {
    if (!open) {
      // Restore focus on close
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
      return;
    }
    // Small delay to allow animation to render DOM
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  // Focus trap + Escape handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
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
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              className={cn(
                'w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-surface border border-border p-6',
                'max-h-[85vh] overflow-y-auto outline-none',
                className
              )}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between mb-4">
                  <h2 id={titleId} className="text-lg font-bold text-text-primary">{title}</h2>
                  <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
