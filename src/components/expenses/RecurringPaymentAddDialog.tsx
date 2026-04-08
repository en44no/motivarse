import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useRecurringPayments } from '../../hooks/useRecurringPayments';
import { useExpenseCards } from '../../hooks/useExpenseCards';
import { useExpenseCategories } from '../../hooks/useExpenseCategories';
import { cn } from '../../lib/utils';
import type { Currency, RecurringPayment } from '../../types/expense';

interface RecurringPaymentAddDialogProps {
  open: boolean;
  onClose: () => void;
  /** Si viene, estamos editando ese item. Si no, creamos uno nuevo. */
  editing?: RecurringPayment | null;
}

const REMINDER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'El día' },
  { value: 1, label: '1 día antes' },
  { value: 3, label: '3 días antes' },
  { value: 7, label: '1 semana antes' },
];

export function RecurringPaymentAddDialog({
  open,
  onClose,
  editing,
}: RecurringPaymentAddDialogProps) {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const { add, update } = useRecurringPayments();
  const { cards, add: addCard } = useExpenseCards();
  const { categories, add: addCategory } = useExpenseCategories();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [currency, setCurrency] = useState<Currency>('UYU');
  const [assignedTo, setAssignedTo] = useState<string>('both');
  const [selectedCard, setSelectedCard] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [reminders, setReminders] = useState<number[]>([0]);
  const [submitting, setSubmitting] = useState(false);

  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');

  const partnerId = couple?.members.find((m) => m !== user?.uid);

  const ASSIGNED_OPTIONS = [
    { value: user?.uid || '', label: 'Yo' },
    { value: partnerId || '', label: partnerName || 'Pareja' },
    { value: 'both', label: 'Los dos' },
  ];

  // Cargar datos al editar
  useEffect(() => {
    if (editing && open) {
      setName(editing.name);
      setAmount(String(editing.suggestedAmount));
      setDayOfMonth(String(editing.dayOfMonth));
      setCurrency(editing.currency);
      setAssignedTo(editing.assignedTo);
      setSelectedCard(editing.card);
      setSelectedCategory(editing.category);
      setReminders(editing.reminders);
    } else if (!editing && open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  function resetForm() {
    setName('');
    setAmount('');
    setDayOfMonth('1');
    setCurrency('UYU');
    setAssignedTo('both');
    setSelectedCard(undefined);
    setSelectedCategory(undefined);
    setReminders([0]);
    setShowNewCard(false);
    setNewCardName('');
    setShowNewCat(false);
    setNewCatEmoji('');
    setNewCatLabel('');
  }

  function toggleReminder(value: number) {
    setReminders((prev) => {
      if (prev.includes(value)) {
        return prev.filter((r) => r !== value);
      }
      if (prev.length >= 2) {
        // Reemplaza el más viejo (primero) para mantener max 2
        return [prev[1], value];
      }
      return [...prev, value].sort((a, b) => a - b);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    const parsedDay = parseInt(dayOfMonth) || 0;
    if (!name.trim() || parsedAmount <= 0 || parsedDay < 1 || parsedDay > 31) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        suggestedAmount: parsedAmount,
        currency,
        dayOfMonth: parsedDay,
        assignedTo,
        reminders: reminders.sort((a, b) => a - b),
        ...(selectedCard ? { card: selectedCard } : {}),
        ...(selectedCategory ? { category: selectedCategory } : {}),
      };

      if (editing) {
        await update(editing.id, payload);
      } else {
        await add(payload);
      }
      resetForm();
      onClose();
    } catch {
      toast.error('No se pudo guardar el pago recurrente');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCard() {
    if (!newCardName.trim()) return;
    await addCard(newCardName.trim());
    setShowNewCard(false);
    setNewCardName('');
  }

  async function handleAddCategory() {
    if (!newCatLabel.trim()) return;
    await addCategory(newCatLabel.trim(), newCatEmoji || '\uD83D\uDCE6');
    setShowNewCat(false);
    setNewCatEmoji('');
    setNewCatLabel('');
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Editar pago recurrente' : 'Nuevo pago recurrente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Ej: Youtube Premium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monto sugerido"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Día del mes"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            placeholder="5"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Moneda
            </label>
            <div className="flex gap-1.5">
              {(['UYU', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    currency === c
                      ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                      : 'bg-surface-hover text-text-muted',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recordatorios */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Recordatorios{' '}
            <span className="text-text-muted font-normal">(hasta 2)</span>
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {REMINDER_OPTIONS.map((opt) => {
              const active = reminders.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReminder(opt.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    active
                      ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                      : 'bg-surface-hover text-text-muted',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {reminders.length === 0 && (
            <p className="text-[11px] text-text-muted mt-1">
              Sin recordatorios — no vas a recibir push para este pago
            </p>
          )}
        </div>

        {/* Asignado a */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Asignado a
          </label>
          <div className="flex gap-1.5">
            {ASSIGNED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAssignedTo(opt.value)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
                  assignedTo === opt.value
                    ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                    : 'bg-surface-hover text-text-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Tarjeta
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  setSelectedCard(selectedCard === card.id ? undefined : card.id)
                }
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  selectedCard === card.id
                    ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                    : 'bg-surface-hover text-text-muted',
                )}
              >
                {card.name}
              </button>
            ))}
            {!showNewCard && (
              <button
                type="button"
                onClick={() => setShowNewCard(true)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-hover text-text-muted border border-dashed border-border"
              >
                + Nueva
              </button>
            )}
          </div>
          {showNewCard && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="Nombre tarjeta"
                className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={handleAddCard}
                className="text-primary text-sm font-bold"
              >
                &#x2713;
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCard(false);
                  setNewCardName('');
                }}
                className="text-text-muted text-sm"
              >
                &#x2717;
              </button>
            </div>
          )}
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Categoría
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? undefined : cat.id,
                  )
                }
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                    : 'bg-surface-hover text-text-muted',
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
            {!showNewCat && (
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-hover text-text-muted border border-dashed border-border"
              >
                + Nueva
              </button>
            )}
          </div>
          {showNewCat && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                placeholder={'\uD83D\uDCE6'}
                maxLength={2}
                className="w-10 rounded-lg border border-border bg-surface-hover px-2 py-1.5 text-xs text-center text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <input
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                placeholder="Nombre"
                className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="text-primary text-sm font-bold"
              >
                &#x2713;
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCat(false);
                  setNewCatEmoji('');
                  setNewCatLabel('');
                }}
                className="text-text-muted text-sm"
              >
                &#x2717;
              </button>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
          {editing ? 'Guardar cambios' : 'Crear pago recurrente'}
        </Button>
      </form>
    </Dialog>
  );
}
