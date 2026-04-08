import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, CreditCard, Calendar, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/currency-utils';
import { Badge } from '../ui/Badge';
import { getDaysUntilDue, isPaidThisMonth } from '../../hooks/useRecurringPayments';
import type { RecurringPayment, ExpenseCard, ExpenseCategory } from '../../types/expense';

interface RecurringPaymentItemProps {
  item: RecurringPayment;
  card?: ExpenseCard;
  category?: ExpenseCategory;
  assignedToLabel: string;
  onSelect: () => void;
  onDelete: () => void;
}

function getStatusInfo(item: RecurringPayment) {
  const paid = isPaidThisMonth(item);
  if (paid) {
    return {
      label: 'Pagado este mes',
      tone: 'paid' as const,
      icon: Check,
    };
  }

  const daysUntil = getDaysUntilDue(item.dayOfMonth);

  if (daysUntil < 0) {
    return {
      label: `Vencido hace ${Math.abs(daysUntil)}d`,
      tone: 'overdue' as const,
      icon: AlertCircle,
    };
  }
  if (daysUntil === 0) {
    return {
      label: 'Vence hoy',
      tone: 'today' as const,
      icon: AlertCircle,
    };
  }
  if (daysUntil <= 3) {
    return {
      label: `Vence en ${daysUntil}d`,
      tone: 'soon' as const,
      icon: Calendar,
    };
  }
  return {
    label: `Vence en ${daysUntil}d`,
    tone: 'upcoming' as const,
    icon: Calendar,
  };
}

export const RecurringPaymentItem = memo(function RecurringPaymentItem({
  item,
  card,
  category,
  assignedToLabel,
  onSelect,
  onDelete,
}: RecurringPaymentItemProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  const status = getStatusInfo(item);
  const paid = status.tone === 'paid';
  const StatusIcon = status.icon;

  const toneClasses: Record<typeof status.tone, string> = {
    paid: 'bg-primary/15 text-primary border border-primary/25',
    overdue: 'bg-danger/15 text-danger border border-danger/25',
    today: 'bg-accent/20 text-accent border border-accent/30',
    soon: 'bg-accent/10 text-accent border border-accent/20',
    upcoming: 'bg-surface-light text-text-muted border border-border',
  };

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
          paid && 'opacity-70',
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
              <p
                className={cn(
                  'text-sm font-semibold',
                  paid ? 'text-text-secondary' : 'text-text-primary',
                )}
              >
                {item.name}
              </p>
              {category && (
                <span className="text-xs">
                  {category.emoji} {category.label}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm font-bold shrink-0 text-text-primary">
            {formatCurrency(item.suggestedAmount, item.currency)}
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              toneClasses[status.tone],
            )}
          >
            <StatusIcon size={11} />
            {status.label}
          </span>
          <span className="text-[11px] text-text-muted">
            · día {item.dayOfMonth} de cada mes
          </span>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {card && (
            <Badge variant="default" className="text-[10px]">
              <CreditCard size={10} />
              {card.name}
            </Badge>
          )}
          <span className="text-[10px] text-text-muted">{assignedToLabel}</span>
          {item.reminders.length > 0 && (
            <span className="text-[10px] text-text-muted">
              · {item.reminders.length} recordatorio{item.reminders.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
