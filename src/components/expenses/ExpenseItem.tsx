import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/currency-utils';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import type { Expense, ExpenseCard, ExpenseCategory } from '../../types/expense';

interface ExpenseItemProps {
  expense: Expense;
  card?: ExpenseCard;
  category?: ExpenseCategory;
  onSelect: () => void;
  onDelete: () => void;
}

export const ExpenseItem = memo(function ExpenseItem({
  expense,
  card,
  category,
  onSelect,
  onDelete,
}: ExpenseItemProps) {
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
          'bg-surface rounded-xl border border-border p-3.5 shadow-sm relative cursor-pointer active:bg-surface-hover transition-colors',
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
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn(
                'text-sm font-semibold',
                isCompleted ? 'text-text-muted line-through' : 'text-text-primary'
              )}>
                {expense.name}
              </p>
              {category && (
                <span className="text-xs">{category.emoji} {category.label}</span>
              )}
            </div>
          </div>
          <p className={cn(
            'text-sm font-bold shrink-0',
            isCompleted ? 'text-text-muted' : 'text-text-primary'
          )}>
            {formatCurrency(totalPrice, expense.currency)}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <ProgressBar value={progress} size="sm" className="flex-1" />
          <span className="text-[11px] font-medium text-text-muted shrink-0">
            {currentInstallment}/{expense.totalInstallments}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {card && (
            <Badge variant="default" className="text-[10px]">
              <CreditCard size={10} />
              {card.name}
            </Badge>
          )}
          <span className="text-[10px] text-text-muted">
            {formatCurrency(expense.installmentPrice, expense.currency)}/cuota
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});
