import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, CreditCard, AlertTriangle, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/currency-utils';
import { hasPaymentMismatch } from '../../lib/expense-utils';
import { useDensity } from '../../contexts/DensityContext';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import type { Expense, ExpenseCard, ExpenseCategory } from '../../types/expense';

interface ExpenseItemProps {
  expense: Expense;
  card?: ExpenseCard;
  category?: ExpenseCategory;
  assignedToLabel: string;
  onSelect: () => void;
  onDelete: () => void;
}

export const ExpenseItem = memo(function ExpenseItem({
  expense,
  card,
  category,
  assignedToLabel,
  onSelect,
  onDelete,
}: ExpenseItemProps) {
  const { isCompact } = useDensity();

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  const totalPrice = expense.installmentPrice * expense.totalInstallments;
  const paidAmount = expense.payments.reduce((s, p) => s + p.amount, 0);
  const currentInstallment = expense.payments.length;
  const isCompleted = currentInstallment >= expense.totalInstallments;
  const progress = expense.totalInstallments > 0
    ? (currentInstallment / expense.totalInstallments) * 100
    : 0;
  const mismatch = hasPaymentMismatch(expense);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-danger flex items-center justify-end pr-5 rounded-xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex items-center gap-1.5 text-white">
          <Trash2 size={16} />
          <span className="text-xs font-semibold">Eliminar</span>
        </motion.div>
      </motion.div>

      {/* Card content */}
      <motion.div
        className={cn(
          'bg-surface rounded-xl border shadow-sm relative cursor-pointer active:bg-surface-hover transition-colors',
          isCompact ? 'p-3' : 'p-4',
          mismatch ? 'border-warning/40' : 'border-border/60',
          isCompleted && 'opacity-60',
        )}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete();
        }}
        onClick={onSelect}
      >
        {/* Title row */}
        <div className={cn('flex items-start justify-between gap-3', isCompact ? 'mb-1.5' : 'mb-2')}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {mismatch && (
              <span
                title="Hay cuotas que no las pago quien correspondia"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning-soft text-warning shrink-0"
              >
                <AlertTriangle size={10} />
              </span>
            )}
            <p
              className={cn(
                'text-sm font-semibold truncate',
                isCompleted ? 'text-text-muted line-through' : 'text-text-primary',
              )}
            >
              {expense.name}
            </p>
          </div>
          <p
            className={cn(
              'text-sm font-bold shrink-0 tabular-nums',
              isCompleted ? 'text-text-muted' : 'text-text-primary',
            )}
          >
            {formatCurrency(totalPrice, expense.currency)}
          </p>
        </div>

        {/* Progress */}
        <div className={cn('flex items-center gap-2', isCompact ? 'mb-1.5' : 'mb-2')}>
          <ProgressBar value={progress} size="sm" className="flex-1" />
          <span className="text-2xs font-medium text-text-muted shrink-0 tabular-nums">
            {currentInstallment}/{expense.totalInstallments}
          </span>
        </div>

        {/* Amounts row — hidden in compact */}
        {!isCompleted && !isCompact && (
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <span className="text-2xs text-text-muted truncate">
              Pagado{' '}
              <span className="font-semibold text-text-secondary tabular-nums">
                {formatCurrency(paidAmount, expense.currency)}
              </span>
            </span>
            <span className="text-2xs text-text-muted truncate">
              Restante{' '}
              <span className="font-semibold text-accent tabular-nums">
                {formatCurrency(totalPrice - paidAmount, expense.currency)}
              </span>
            </span>
          </div>
        )}

        {/* Tags row — hidden in compact for more density */}
        {!isCompact && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {category && (
              <Badge variant="secondary" className="text-2xs py-0.5">
                <span className="text-2xs leading-none">{category.emoji}</span>
                {category.label}
              </Badge>
            )}
            {card && (
              <Badge variant="default" className="text-2xs py-0.5">
                <CreditCard size={10} />
                {card.name}
              </Badge>
            )}
            {assignedToLabel && (
              <Badge variant="default" className="text-2xs py-0.5">
                <User size={10} />
                {assignedToLabel}
              </Badge>
            )}
            <Badge variant="default" className="text-2xs py-0.5 tabular-nums">
              {formatCurrency(expense.installmentPrice, expense.currency)}/cuota
            </Badge>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
