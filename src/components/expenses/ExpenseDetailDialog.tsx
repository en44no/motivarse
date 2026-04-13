import { useState, useEffect } from 'react';
import {
  Check,
  CreditCard,
  Calendar,
  DollarSign,
  Trash2,
  Copy,
  AlertTriangle,
  User,
  StickyNote,
  Pencil,
  Target,
  X,
} from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { ProgressBar } from '../ui/ProgressBar';
import { formatCurrency } from '../../lib/currency-utils';
import { cn } from '../../lib/utils';
import {
  isPaymentMismatched,
  getMismatchedPayments,
} from '../../lib/expense-utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
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
  onUpdate: (id: string, data: Partial<Expense>) => Promise<void>;
}

// Convierte un timestamp al formato YYYY-MM-DD usando la fecha local del usuario
function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string): number {
  return new Date(`${value}T12:00:00`).getTime();
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
  onUpdate,
}: ExpenseDetailDialogProps) {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const partnerId = couple?.members.find((m) => m !== user?.uid);

  const [loadingInstallment, setLoadingInstallment] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paidByMode, setPaidByMode] = useState<string>('both');
  const [editingDate, setEditingDate] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingAssigned, setEditingAssigned] = useState(false);
  const [savingAssigned, setSavingAssigned] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Reset paidByMode al asignado del gasto cada vez que se abre/cambia
  useEffect(() => {
    if (expense) setPaidByMode(expense.assignedTo);
  }, [expense?.id, expense?.assignedTo]);

  if (!expense) return null;

  const PAID_BY_OPTIONS: { value: string; label: string }[] = [
    { value: user?.uid || '', label: 'Yo' },
    { value: partnerId || '', label: partnerName || 'Pareja' },
    { value: 'both', label: 'Ambos' },
  ].filter((o) => o.value);

  const card = cards.find((c) => c.id === expense.card);
  const category = categories.find((c) => c.id === expense.category);
  const paidCount = expense.payments.length;
  const isOpenEnded = expense.totalInstallments === 0;
  const hasGoal = isOpenEnded && !!expense.goalTotal && expense.goalTotal > 0;

  const paidAmount = expense.payments.reduce((s, p) => s + p.amount, 0);
  // Open-ended con goal: usar goal como total; sin goal: usar lo registrado
  const totalPrice = isOpenEnded
    ? hasGoal
      ? expense.goalTotal!
      : paidAmount
    : expense.installmentPrice * expense.totalInstallments;
  const remainingAmount = isOpenEnded
    ? hasGoal
      ? Math.max(expense.goalTotal! - paidAmount, 0)
      : 0
    : totalPrice - paidAmount;
  const progressPercent = isOpenEnded
    ? hasGoal
      ? Math.min((paidAmount / expense.goalTotal!) * 100, 100)
      : 0
    : expense.totalInstallments > 0
      ? (paidCount / expense.totalInstallments) * 100
      : 0;

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
          paidBy: paidByMode || expense!.assignedTo,
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
        paidBy: paidByMode || expense!.assignedTo,
      });
      setPaymentAmount('');
      setShowPaymentForm(false);
    } finally {
      setLoadingInstallment(null);
    }
  }

  const mismatchedPayments = getMismatchedPayments(expense);
  const hasMismatch = mismatchedPayments.length > 0;

  async function handleSaveDate(value: string) {
    if (!value || !expense) return;
    const newTs = fromDateInputValue(value);
    if (Number.isNaN(newTs) || newTs === expense.createdAt) {
      setEditingDate(false);
      return;
    }
    setSavingDate(true);
    try {
      await onUpdate(expense.id, { createdAt: newTs });
      setEditingDate(false);
    } finally {
      setSavingDate(false);
    }
  }

  function startEditingDescription() {
    if (!expense) return;
    setDescriptionDraft(expense.description ?? '');
    setEditingDescription(true);
  }

  async function handleSaveDescription() {
    if (!expense) return;
    const trimmed = descriptionDraft.trim();
    const current = (expense.description ?? '').trim();
    if (trimmed === current) {
      setEditingDescription(false);
      return;
    }
    setSavingDescription(true);
    try {
      await onUpdate(expense.id, { description: trimmed });
      setEditingDescription(false);
    } finally {
      setSavingDescription(false);
    }
  }

  async function handleSaveAssigned(value: string) {
    if (!expense || !value || value === expense.assignedTo) {
      setEditingAssigned(false);
      return;
    }
    setSavingAssigned(true);
    try {
      await onUpdate(expense.id, { assignedTo: value });
      setEditingAssigned(false);
    } finally {
      setSavingAssigned(false);
    }
  }

  function startEditingGoal() {
    if (!expense) return;
    setGoalDraft(expense.goalTotal ? String(expense.goalTotal) : '');
    setEditingGoal(true);
  }

  async function handleSaveGoal() {
    if (!expense) return;
    const trimmed = goalDraft.trim();
    const parsed = parseFloat(trimmed);
    const nextGoal = trimmed === '' || isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    const currentGoal = expense.goalTotal ?? 0;
    if (nextGoal === currentGoal) {
      setEditingGoal(false);
      return;
    }
    setSavingGoal(true);
    try {
      // 0 = sin objetivo (se trata como "no hay goal" en todas las vistas)
      await onUpdate(expense.id, { goalTotal: nextGoal });
      setEditingGoal(false);
    } finally {
      setSavingGoal(false);
    }
  }

  const subtitleText = [
    category ? `${category.emoji} ${category.label}` : null,
    card?.name,
    memberNames[expense.assignedTo],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Dialog
      open={expense !== null}
      onClose={onClose}
      title={expense.name}
      subtitle={subtitleText || undefined}
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
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
            size="md"
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
      }
    >
      {/* Info section */}
      <div className="space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-light rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">
              {isOpenEnded ? (hasGoal ? 'Objetivo' : 'Total registrado') : 'Precio total'}
            </p>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {formatCurrency(totalPrice, expense.currency)}
            </p>
          </div>
          <div className="bg-surface-light rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">
              {isOpenEnded ? 'Pagos' : 'Por cuota'}
            </p>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {isOpenEnded
                ? `${paidCount}`
                : formatCurrency(expense.installmentPrice, expense.currency)}
            </p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3">
            <p className="text-xs text-text-muted mb-0.5">Pagado</p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {formatCurrency(paidAmount, expense.currency)}
            </p>
          </div>
          {isOpenEnded && !hasGoal ? (
            <div className="bg-info-soft rounded-xl p-3">
              <p className="text-xs text-text-muted mb-0.5">Tipo</p>
              <p className="text-sm font-bold text-info">Variable</p>
            </div>
          ) : (
            <div className="bg-accent/10 rounded-xl p-3">
              <p className="text-xs text-text-muted mb-0.5">Restante</p>
              <p className="text-sm font-bold text-accent tabular-nums">
                {formatCurrency(remainingAmount, expense.currency)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Badge variant="secondary">
              <span className="text-sm leading-none">{category.emoji}</span>
              {category.label}
            </Badge>
          )}
          {card && (
            <Badge variant="primary">
              <CreditCard size={12} />
              {card.name}
            </Badge>
          )}
          <button
            type="button"
            onClick={() => setEditingAssigned((v) => !v)}
            disabled={savingAssigned}
            aria-label="Editar asignado"
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-surface-light text-text-secondary hover:bg-surface-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <User size={12} />
            {memberNames[expense.assignedTo] || 'Desconocido'}
            <Pencil size={10} className="opacity-60" />
          </button>
          <Badge variant="default">
            <DollarSign size={12} />
            {expense.currency}
          </Badge>
        </div>

        {/* Pills inline para editar assignedTo */}
        {editingAssigned && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-2xs text-text-muted uppercase tracking-wider mr-1">
              Asignar a
            </span>
            {PAID_BY_OPTIONS.map((opt) => {
              const active = expense.assignedTo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSaveAssigned(opt.value)}
                  disabled={savingAssigned}
                  className={cn(
                    'inline-flex items-center justify-center min-h-9 px-3 rounded-full text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    active
                      ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                      : 'bg-surface-hover text-text-muted hover:text-text-secondary',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
          {editingDate ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} />
              <input
                type="date"
                defaultValue={toDateInputValue(expense.createdAt)}
                max={toDateInputValue(Date.now())}
                disabled={savingDate}
                onChange={(e) => handleSaveDate(e.target.value)}
                onBlur={() => setEditingDate(false)}
                className="rounded-md border border-border bg-surface-hover px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className="inline-flex items-center gap-1 hover:text-text-secondary transition-colors"
              aria-label="Editar fecha de creacion"
            >
              <Calendar size={12} />
              Creado {formatDate(expense.createdAt)}
            </button>
          )}
          {expense.updatedAt !== expense.createdAt && (
            <span>Editado {formatDate(expense.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Progress: fijos siempre, variables solo cuando hay objetivo */}
      {(!isOpenEnded || hasGoal) && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-text-secondary">Progreso</span>
            <span className="text-xs font-bold text-text-primary tabular-nums">
              {isOpenEnded
                ? `${formatCurrency(paidAmount, expense.currency)} / ${formatCurrency(expense.goalTotal!, expense.currency)}`
                : `${paidCount}/${expense.totalInstallments} cuotas`}
            </span>
          </div>
          <ProgressBar
            value={progressPercent}
            color={progressPercent >= 100 ? 'accent' : 'primary'}
          />
        </div>
      )}

      {/* Objetivo opcional (variables open-ended) */}
      {isOpenEnded && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <Target size={12} className="text-text-muted" />
              Objetivo
            </span>
            {!editingGoal && hasGoal && (
              <button
                type="button"
                onClick={startEditingGoal}
                className="inline-flex items-center gap-1 text-2xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg px-1 py-0.5"
              >
                <Pencil size={10} />
                Editar
              </button>
            )}
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  placeholder="Dejar vacio para quitar"
                  disabled={savingGoal}
                  className="w-full h-11 pl-8 pr-3 text-sm rounded-xl bg-surface-light border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <IconButton
                variant="solid"
                aria-label="Guardar objetivo"
                onClick={handleSaveGoal}
                disabled={savingGoal}
              >
                <Check size={18} />
              </IconButton>
              <IconButton
                variant="ghost"
                aria-label="Cancelar"
                onClick={() => setEditingGoal(false)}
                disabled={savingGoal}
              >
                <X size={18} />
              </IconButton>
            </div>
          ) : hasGoal ? (
            <p className="text-sm text-text-secondary bg-surface-light rounded-xl px-3 py-2.5 tabular-nums">
              {formatCurrency(expense.goalTotal!, expense.currency)}
            </p>
          ) : (
            <button
              type="button"
              onClick={startEditingGoal}
              className="w-full text-left text-sm text-text-muted bg-surface-light hover:bg-surface-hover rounded-xl px-3 py-2.5 border border-dashed border-border transition-colors"
            >
              + Definir un objetivo para ver progreso
            </button>
          )}
        </div>
      )}

      {/* Mismatch banner */}
      {hasMismatch && (
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-warning-soft border border-warning/30 flex items-start gap-2">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-xs leading-snug">
            <p className="font-semibold text-warning">
              {mismatchedPayments.length}{' '}
              {mismatchedPayments.length === 1 ? 'cuota no la pago' : 'cuotas no las pago'}{' '}
              quien correspondia
            </p>
            <p className="text-text-muted mt-0.5">
              El gasto esta asignado a{' '}
              <span className="font-medium text-text-secondary">
                {memberNames[expense.assignedTo] || 'Desconocido'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Payment section */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            {isOpenEnded ? 'Pagos' : 'Cuotas'}
          </h3>
          <p className="text-2xs text-text-muted mb-1.5">Marcar como pagado por</p>
          <div className="flex gap-1.5">
            {PAID_BY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaidByMode(opt.value)}
                className={cn(
                  'inline-flex items-center justify-center min-h-9 px-3 rounded-full text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  paidByMode === opt.value
                    ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                    : 'bg-surface-hover text-text-muted hover:text-text-secondary',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {expense.isFixedInstallment ? (
          /* Fixed installments */
          <div className="space-y-1.5">
            {Array.from({ length: expense.totalInstallments }, (_, i) => i + 1).map(
              (num) => {
                const paid = isInstallmentPaid(num);
                const payment = getPaymentForInstallment(num);
                const loading = loadingInstallment === num;

                const mismatch = paid && payment && isPaymentMismatched(payment, expense);
                const paidByLabel = payment?.paidBy ? memberNames[payment.paidBy] : null;

                return (
                  <button
                    key={num}
                    onClick={() => handleToggleFixed(num)}
                    disabled={loading}
                    className={cn(
                      'w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 ease-out',
                      mismatch
                        ? 'bg-warning-soft border border-warning/30'
                        : paid
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
                      {paid && paidByLabel && (
                        <span
                          className={cn(
                            'ml-1.5 text-2xs font-normal',
                            mismatch ? 'text-warning' : 'text-text-muted'
                          )}
                        >
                          {mismatch && <AlertTriangle size={10} className="inline -mt-0.5 mr-0.5" />}
                          pago {paidByLabel}
                        </span>
                      )}
                    </span>
                    <span className="text-2xs text-text-muted">
                      {formatCurrency(expense.installmentPrice, expense.currency)}
                    </span>
                    {paid && payment && (
                      <span className="text-2xs text-text-muted">
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
                  .map((payment) => {
                    const mismatch = isPaymentMismatched(payment, expense);
                    const paidByLabel = payment.paidBy ? memberNames[payment.paidBy] : null;
                    return (
                      <div
                        key={payment.installmentNumber}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl border',
                          mismatch
                            ? 'bg-warning-soft border-warning/30'
                            : 'bg-primary/10 border-primary/20'
                        )}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-contrast">
                          <Check size={14} />
                        </div>
                        <span className="text-sm font-medium text-text-primary flex-1">
                          Cuota {payment.installmentNumber}
                          {paidByLabel && (
                            <span
                              className={cn(
                                'ml-1.5 text-2xs font-normal',
                                mismatch ? 'text-warning' : 'text-text-muted'
                              )}
                            >
                              {mismatch && (
                                <AlertTriangle size={10} className="inline -mt-0.5 mr-0.5" />
                              )}
                              pago {paidByLabel}
                            </span>
                          )}
                        </span>
                        <span className="text-2xs text-text-muted">
                          {formatCurrency(payment.amount, expense.currency)}
                        </span>
                        <span className="text-2xs text-text-muted">
                          {formatDate(payment.paidAt)}
                        </span>
                      </div>
                    );
                  })}
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
                    placeholder={
                      expense.installmentPrice > 0
                        ? String(expense.installmentPrice)
                        : 'Monto'
                    }
                    className="w-full h-11 pl-8 pr-3 text-sm rounded-xl bg-surface-light border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <IconButton
                  variant="solid"
                  aria-label="Confirmar pago"
                  onClick={handleAddVariablePayment}
                  disabled={
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    loadingInstallment === -1
                  }
                >
                  <Check size={18} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  aria-label="Cancelar"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentAmount('');
                  }}
                >
                  <X size={18} />
                </IconButton>
              </div>
            ) : (
              <Button
                variant="outline"
                size="md"
                className="w-full mt-2"
                onClick={() => {
                  setPaymentAmount(
                    expense.installmentPrice > 0
                      ? String(expense.installmentPrice)
                      : '',
                  );
                  setShowPaymentForm(true);
                }}
              >
                Registrar pago
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Descripcion (nota libre opcional) */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-primary inline-flex items-center gap-1.5">
            <StickyNote size={14} className="text-text-muted" />
            Descripcion
          </h3>
          {!editingDescription && expense.description && (
            <button
              type="button"
              onClick={startEditingDescription}
              className="inline-flex items-center gap-1 min-h-11 px-2 -mr-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg"
            >
              <Pencil size={12} />
              Editar
            </button>
          )}
        </div>

        {editingDescription ? (
          <div className="space-y-2">
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Agrega una nota sobre este gasto..."
              rows={3}
              maxLength={500}
              disabled={savingDescription}
              className="w-full rounded-xl border border-border bg-surface-light px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs text-text-muted">
                {descriptionDraft.length}/500
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingDescription(false)}
                  disabled={savingDescription}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDescription}
                  isLoading={savingDescription}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        ) : expense.description ? (
          <p className="text-sm text-text-secondary leading-relaxed bg-surface-light rounded-xl px-3 py-2.5 whitespace-pre-wrap break-words">
            {expense.description}
          </p>
        ) : (
          <button
            type="button"
            onClick={startEditingDescription}
            className="w-full text-left text-sm text-text-muted bg-surface-light hover:bg-surface-hover rounded-xl px-3 py-2.5 border border-dashed border-border transition-colors"
          >
            + Agregar una nota
          </button>
        )}
      </div>

    </Dialog>
  );
}
