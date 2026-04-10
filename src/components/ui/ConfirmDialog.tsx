import { useEffect, useId, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Save previously focused element when opening
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Focus cancel button on open, restore on close
  useEffect(() => {
    if (!open) {
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
      return;
    }
    const timer = setTimeout(() => {
      cancelRef.current?.focus();
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
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="w-full max-w-sm rounded-2xl bg-surface border border-border p-6 outline-none"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  variant === 'danger' ? 'bg-danger-soft' : 'bg-secondary-soft'
                }`}>
                  <AlertTriangle size={20} className={variant === 'danger' ? 'text-danger' : 'text-secondary'} />
                </div>
                <h3 id={titleId} className="text-base font-bold text-text-primary">{title}</h3>
              </div>

              <p className="text-sm text-text-secondary mb-5 ml-[52px]">{description}</p>

              <div className="flex gap-3 justify-end">
                <Button ref={cancelRef} variant="ghost" onClick={onClose} disabled={isLoading}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={variant === 'danger' ? 'danger' : 'secondary'}
                  onClick={onConfirm}
                  isLoading={isLoading}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
