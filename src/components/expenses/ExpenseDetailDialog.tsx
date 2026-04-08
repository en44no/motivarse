import { useState } from 'react';
import { Check, CreditCard, Calendar, DollarSign, Trash2, Copy } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { formatCurrency } from '../../lib/currency-utils';
import { cn } from '../../lib/utils';
import type { Expense, ExpensePayment, ExpenseCard, ExpenseCategory } from '../../types/expense';

interface ExpenseDetailDialogProps {
  expense: Expense | null;
  cards: ExpenseCard[];
  categories: ExpenseCategory[];
  memberNames: Record<string, string>;
  onClose: () => void;
  onAddPayment: (expenseId: string, payment: ExpensePayment) => Promise<void>;
  onRemovePayment: (expenseId: string, installmentNumber: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function ExpenseDetailDialog({
  expense,
  cards,
  categories,
  memberNames,
  onClose,
  onAddPayment,
  onRemovePayment,
  onDelete,
  onDuplicate,
}: ExpenseDetailDialogProps) {
  const [loadingInstallment, setLoadingInstallment] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  if (!expense) return null;

  const card = cards.find((c) => c.id === expense.card);
  const category = categories.find((c) => c.id === expense.category);
  const paidCount = expense.payments.length;
  const progressPercent =
    expense.totalInstallments > 0
      ? (paidCount / expense.totalInstallments) * 100
      : 0;

  const totalPrice = expense.installmentPrice * expense.totalInstallments;
  const paidAmount = expense.payments.reduce((s, p) => s + p.amount, 0);
  const remainingAmount = totalPrice - paidAmount;

  const isInstallmentPaid = (num: number) =>
    expense.payments.some((p) => p.installmentNumber === num);

  const getPaymentForInstallment = (num: number) =>
    expense.payments.find((p) => p.installmentNumber === num);

  async function handleToggleFixed(installmentNumber: number) {
    setLoadingInstallment(installmentNumber);
    try {
      if (isInstallmentPaid(installmentNumber)) {
        await onRemovePayment(expense!.id, installmentNumber);
      } else {
        await onAddPayment(expense!.id, {
          installmentNumber,
          amount: expense!.installmentPrice,
          paidAt: Date.now(),
        });
      }
    } finally {
      setLoadingInstallment(null);
    }
  }

  async function handleAddVariablePayment() {
    const parsed = parseFloat(paymentAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    setLoadingInstallment(-1);
    try {
      await onAddPayment(expense!.id, {
        installmentNumber: expense!.payments.length + 1,
        amount: parsed,
        paidAt: Date.now(),
      });
      setPaymentAmount('');
      setShowPaymentForm(false);
    } finally {
      setLoadingInstallment(null);
    }
  }

  return (
    <Dialog open={expense !== null} onClose={onClose} title={expense.name}>
      {/* Info section */}
      <div className="space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-light rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">Precio total</p>
            <p className="text-sm font-bold text-text-primary">
              {formatCurrency(totalPrice, expense.currency)}
            </p>
          </div>
          <div className="bg-surface-light rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">Por cuota</p>
            <p className="text-sm font-bold text-text-primary">
              {formatCurrency(expense.installmentPrice, expense.currency)}
            </p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">Pagado</p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(paidAmount, expense.currency)}
            </p>
          </div>
          <div className="bg-accent/10 rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">Restante</p>
            <p className="text-sm font-bold text-accent">
              {formatCurrency(remainingAmount, expense.currency)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {card && (
            <Badge variant="primary">
              <CreditCard size={12} />
              {card.name}
            </Badge>
          )}
          {category && (
            <Badge variant="secondary">
              {category.emoji} {category.label}
            </Badge>
          )}
          <Badge variant="default">
            <DollarSign size={12} />
            {expense.currency}
          </Badge>
          <Badge variant="default">
            {memberNames[expense.assignedTo] || 'Desconocido'}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            Creado {formatDate(expense.createdAt)}
          </span>
          {expense.updatedAt !== expense.createdAt && (
            <span>Editado {formatDate(expense.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-text-secondary">Progreso</span>
          <span className="text-xs font-bold text-text-primary">
            {paidCount}/{expense.totalInstallments} cuotas
          </span>
        </div>
        <ProgressBar
          value={progressPercent}
          color={progressPercent >= 100 ? 'accent' : 'primary'}
        />
      </div>

      {/* Payment section */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Cuotas</h3>

        {expense.isFixedInstallment ? (
          /* Fixed installments */
          <div className="space-y-1.5">
            {Array.from({ length: expense.totalInstallments }, (_, i) => i + 1).map(
              (num) => {
                const paid = isInstallmentPaid(num);
                const payment = getPaymentForInstallment(num);
                const loading = loadingInstallment === num;

                return (
                  <button
                    key={num}
                    onClick={() => handleToggleFixed(num)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      paid
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-surface-light border border-transparent hover:border-border'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                        paid
                          ? 'bg-primary text-primary-contrast'
                          : 'bg-surface border-2 border-border'
                      )}
                    >
                      {paid && <Check size={14} />}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium flex-1 text-left',
                        paid ? 'text-text-primary' : 'text-text-secondary'
                      )}
                    >
                      Cuota {num}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatCurrency(expense.installmentPrice, expense.currency)}
                    </span>
                    {paid && payment && (
                      <span className="text-xs text-text-muted">
                        {formatDate(payment.paidAt)}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        ) : (
          /* Variable installments */
          <div className="space-y-2">
            {expense.payments.length > 0 ? (
              <div className="space-y-1.5">
                {expense.payments
                  .slice()
                  .sort((a, b) => a.installmentNumber - b.installmentNumber)
                  .map((payment) => (
                    <div
                      key={payment.installmentNumber}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-contrast">
                        <Check size={14} />
                      </div>
                      <span className="text-sm font-medium text-text-primary flex-1">
                        Cuota {payment.installmentNumber}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatCurrency(payment.amount, expense.currency)}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-3">
                Sin pagos registrados
              </p>
            )}

            {showPaymentForm ? (
              <div className="flex items-center gap-2 mt-2">
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
                    placeholder={String(expense.installmentPrice)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-light border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddVariablePayment}
                  isLoading={loadingInstallment === -1}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  <Check size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentAmount('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setPaymentAmount(String(expense.installmentPrice));
                  setShowPaymentForm(true);
                }}
              >
                Registrar pago
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-border flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={async () => {
            await onDuplicate(expense.id);
            onClose();
          }}
        >
          <Copy size={16} />
          Duplicar
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={async () => {
            await onDelete(expense.id);
            onClose();
          }}
        >
          <Trash2 size={16} />
          Eliminar
        </Button>
      </div>
    </Dialog>
  );
}
