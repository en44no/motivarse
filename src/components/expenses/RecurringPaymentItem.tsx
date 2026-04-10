import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, CreditCard, Calendar, Check, AlertCircle, User, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/currency-utils';
import { Badge } from '../ui/Badge';
import { useDensity } from '../../contexts/DensityContext';
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

type StatusTone = 'paid' | 'overdue' | 'today' | 'soon' | 'upcoming';

interface StatusInfo {
  label: string;
  tone: StatusTone;
  icon: typeof Check;
}

function getStatusInfo(item: RecurringPayment): StatusInfo {
  if (isPaidThisMonth(item)) {
    return { label: 'Pagado este mes', tone: 'paid', icon: Check };
  }

  const daysUntil = getDaysUntilDue(item.dayOfMonth);

  if (daysUntil < 0) {
    return { label: `Vencido hace ${Math.abs(daysUntil)}d`, tone: 'overdue', icon: AlertCircle };
  }
  if (daysUntil === 0) {
    return { label: 'Vence hoy', tone: 'today', icon: AlertCircle };
  }
  if (daysUntil <= 3) {
    return { label: `Vence en ${daysUntil}d`, tone: 'soon', icon: Calendar };
  }
  return { label: `Vence en ${daysUntil}d`, tone: 'upcoming', icon: Calendar };
}

const toneClasses: Record<StatusTone, string> = {
  paid: 'bg-primary-soft text-primary border border-primary/25',
  overdue: 'bg-danger-soft text-danger border border-danger/25',
  today: 'bg-warning-soft text-warning border border-warning/30',
  soon: 'bg-warning-soft text-warning border border-warning/20',
  upcoming: 'bg-surface-light text-text-muted border border-border/60',
};

export const RecurringPaymentItem = memo(function RecurringPaymentItem({
  item,
  card,
  category,
  assignedToLabel,
  onSelect,
  onDelete,
}: RecurringPaymentItemProps) {
  const { isCompact } = useDensity();

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  const status = getStatusInfo(item);
  const paid = status.tone === 'paid';
  const StatusIcon = status.icon;

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
          'bg-surface rounded-xl border border-border/60 shadow-sm relative cursor-pointer active:bg-surface-hover transition-colors',
          isCompact ? 'p-3' : 'p-4',
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
        {/* Title row */}
        <div className={cn('flex items-start justify-between gap-3', isCompact ? 'mb-1.5' : 'mb-2')}>
          <p
            className={cn(
              'text-sm font-semibold truncate flex-1 min-w-0',
              paid ? 'text-text-secondary' : 'text-text-primary',
            )}
          >
            {item.name}
          </p>
          <p className="text-sm font-bold shrink-0 text-text-primary tabular-nums">
            {formatCurrency(item.suggestedAmount, item.currency)}
          </p>
        </div>

        {/* Status pill */}
        <div className={cn('flex items-center gap-1.5 flex-wrap', isCompact ? 'mb-0' : 'mb-2.5')}>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
              toneClasses[status.tone],
            )}
          >
            <StatusIcon size={11} />
            {status.label}
          </span>
          <span className="text-2xs text-text-muted">
            día {item.dayOfMonth} de cada mes
          </span>
        </div>

        {/* Tags row — hidden in compact */}
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
            {item.reminders.length > 0 && (
              <Badge variant="default" className="text-2xs py-0.5">
                <Bell size={10} />
                {item.reminders.length}
              </Badge>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
