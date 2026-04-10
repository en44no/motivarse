import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  CreditCard,
  Calendar,
  DollarSign,
  Trash2,
  Pencil,
  Bell,
  User,
  X as XIcon,
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { formatCurrency } from '../../lib/currency-utils';
import { cn } from '../../lib/utils';
import {
  getCurrentYearMonth,
  getDaysUntilDue,
  isPaidThisMonth,
} from '../../hooks/useRecurringPayments';
import type {
  RecurringPayment,
  ExpenseCard,
  ExpenseCategory,
} from '../../types/expense';

interface RecurringPaymentDetailDialogProps {
  item: RecurringPayment | null;
  cards: ExpenseCard[];
  categories: ExpenseCategory[];
  memberNames: Record<string, string>;
  onClose: () => void;
  onMarkPaid: (id: string, yearMonth: string, amount: number) => Promise<void>;
  onUnmarkPaid: (id: string, yearMonth: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: RecurringPayment) => void;
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const REMINDER_LABELS: Record<number, string> = {
  0: 'El día',
  1: '1 día antes',
  3: '3 días antes',
  7: '1 semana antes',
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-');
  const monthIdx = parseInt(m) - 1;
  return `${MONTH_NAMES[monthIdx]} ${y}`;
}

/**
 * Devuelve los últimos N meses (hasta el mes actual) como array de YYYY-MM.
 */
function getLastMonths(count: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    result.push(`${y}-${m}`);
  }
  return result;
}

export function RecurringPaymentDetailDialog({
  item,
  cards,
  categories,
  memberNames,
  onClose,
  onMarkPaid,
  onUnmarkPaid,
  onDelete,
  onEdit,
}: RecurringPaymentDetailDialogProps) {
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Reset form state al cambiar de item
  useEffect(() => {
    setShowPaymentForm(false);
    setPaymentAmount('');
  }, [item?.id]);

  // Últimos 12 meses para la grilla de historial
  const monthsToShow = useMemo(() => getLastMonths(12), []);

  if (!item) return null;

  const card = cards.find((c) => c.id === item.card);
  const category = categories.find((c) => c.id === item.category);
  const currentYM = getCurrentYearMonth();
  const paidThisMonth = isPaidThisMonth(item, currentYM);
  const daysUntil = getDaysUntilDue(item.dayOfMonth);

  const paidMonthsMap = new Map(
    item.paymentHistory.map((r) => [r.yearMonth, r]),
  );

  // Stats
  const totalPaid = item.paymentHistory.reduce((s, r) => s + r.amount, 0);
  const paidCount = item.paymentHistory.length;

  async function handleMarkCurrentMonth() {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    setLoadingMonth(currentYM);
    try {
      await onMarkPaid(item!.id, currentYM, amount);
      setPaymentAmount('');
      setShowPaymentForm(false);
    } finally {
      setLoadingMonth(null);
    }
  }

  async function handleToggleMonth(yearMonth: string) {
    const existing = paidMonthsMap.get(yearMonth);
    setLoadingMonth(yearMonth);
    try {
      if (existing) {
        await onUnmarkPaid(item!.id, yearMonth);
      } else {
        await onMarkPaid(item!.id, yearMonth, item!.suggestedAmount);
      }
    } finally {
      setLoadingMonth(null);
    }
  }

  function openPaymentForm() {
    setPaymentAmount(String(item!.suggestedAmount));
    setShowPaymentForm(true);
  }

  // Subtitle: info util sin repetirla en el body
  const subtitle = `${formatCurrency(item.suggestedAmount, item.currency)} · día ${item.dayOfMonth} del mes`;

  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      title={item.name}
      subtitle={subtitle}
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={() => {
              onEdit(item);
              onClose();
            }}
          >
            <Pencil size={16} />
            Editar
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={async () => {
              await onDelete(item.id);
              onClose();
            }}
          >
            <Trash2 size={16} />
            Eliminar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-soft rounded-2xl p-4">
            <p className="text-2xs uppercase tracking-wide text-text-muted mb-1">
              Total pagado
            </p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(totalPaid, item.currency)}
            </p>
          </div>
          <div className="bg-accent-soft rounded-2xl p-4">
            <p className="text-2xs uppercase tracking-wide text-text-muted mb-1">
              Meses pagados
            </p>
            <p className="text-lg font-bold text-accent">{paidCount}</p>
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Badge variant="secondary">
              <span className="text-xs leading-none">{category.emoji}</span>
              {category.label}
            </Badge>
          )}
          {card && (
            <Badge variant="primary">
              <CreditCard size={12} />
              {card.name}
            </Badge>
          )}
          <Badge variant="default">
            <User size={12} />
            {memberNames[item.assignedTo] || 'Desconocido'}
          </Badge>
          <Badge variant="default">
            <DollarSign size={12} />
            {item.currency}
          </Badge>
        </div>

        {/* Recordatorios */}
        {item.reminders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Bell size={14} className="text-text-muted" />
            {item.reminders.map((r) => (
              <span
                key={r}
                className="text-2xs font-medium text-text-secondary bg-surface-light rounded-full px-2.5 py-1"
              >
                {REMINDER_LABELS[r] ?? `${r}d antes`}
              </span>
            ))}
          </div>
        )}

        {/* Fecha de creacion */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Calendar size={12} />
          Creado {formatDate(item.createdAt)}
        </div>

        {/* Acción mes actual */}
        <div
          className={cn(
            'rounded-2xl p-4 border',
            paidThisMonth
              ? 'bg-primary-soft border-primary/20'
              : daysUntil < 0
              ? 'bg-danger-soft border-danger/20'
              : daysUntil <= 3
              ? 'bg-warning-soft border-warning/20'
              : 'bg-surface-light border-border',
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xs uppercase tracking-wide text-text-muted mb-0.5">
                Este mes
              </p>
              <p className="text-sm font-bold text-text-primary">
                {formatYearMonth(currentYM)}
              </p>
            </div>
            {paidThisMonth ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Check size={14} /> Pagado
              </span>
            ) : daysUntil < 0 ? (
              <span className="text-xs font-semibold text-danger">
                Vencido hace {Math.abs(daysUntil)}d
              </span>
            ) : daysUntil === 0 ? (
              <span className="text-xs font-semibold text-warning">
                Vence hoy
              </span>
            ) : (
              <span className="text-xs font-semibold text-text-secondary">
                Vence en {daysUntil}d
              </span>
            )}
          </div>

          {!paidThisMonth && !showPaymentForm && (
            <Button onClick={openPaymentForm} className="w-full" size="md">
              Marcar como pagado
            </Button>
          )}

          {!paidThisMonth && showPaymentForm && (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={String(item.suggestedAmount)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <IconButton
                aria-label="Confirmar pago"
                variant="solid"
                onClick={handleMarkCurrentMonth}
                disabled={
                  loadingMonth === currentYM ||
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0
                }
              >
                <Check size={18} />
              </IconButton>
              <IconButton
                aria-label="Cancelar"
                variant="ghost"
                onClick={() => {
                  setShowPaymentForm(false);
                  setPaymentAmount('');
                }}
              >
                <XIcon size={18} />
              </IconButton>
            </div>
          )}

          {paidThisMonth && (
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => handleToggleMonth(currentYM)}
              isLoading={loadingMonth === currentYM}
            >
              Deshacer pago
            </Button>
          )}
        </div>

        {/* Historial mensual */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Últimos 12 meses
            </h3>
            <span className="text-2xs text-text-muted">
              Tocá para marcar/desmarcar
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {monthsToShow.map((ym) => {
              const record = paidMonthsMap.get(ym);
              const paid = !!record;
              const loading = loadingMonth === ym;
              const isCurrent = ym === currentYM;

              return (
                <button
                  key={ym}
                  onClick={() => handleToggleMonth(ym)}
                  disabled={loading}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-xl py-2.5 px-1 border transition-colors duration-150 min-h-[58px]',
                    paid
                      ? 'bg-primary-soft border-primary/30 text-primary'
                      : 'bg-surface-light border-border text-text-muted hover:border-primary/20 hover:text-text-secondary',
                    isCurrent && 'ring-1 ring-primary/40',
                    loading && 'opacity-50',
                  )}
                >
                  <span className="text-2xs font-medium">
                    {formatYearMonth(ym)}
                  </span>
                  {paid ? (
                    <Check size={12} className="mt-0.5" />
                  ) : (
                    <span className="h-3 w-3 mt-0.5" />
                  )}
                  {paid && record && (
                    <span className="text-2xs mt-0.5 font-semibold truncate max-w-full px-1">
                      {formatCurrency(record.amount, item.currency)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
