import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles, Loader2, Check, X as XIcon } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useRecurringPayments } from '../../hooks/useRecurringPayments';
import { useExpenseCards } from '../../hooks/useExpenseCards';
import { useExpenseCategories } from '../../hooks/useExpenseCategories';
import { autocategorize } from '../../services/ai.service';
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

/** Estilo compartido para chips tipo pill (moneda, recordatorios, asignado, etc) */
const chipClass = (active: boolean) =>
  cn(
    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150',
    active
      ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
      : 'bg-surface-light text-text-muted hover:bg-surface-hover hover:text-text-secondary',
  );

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

  // AI autocategorize
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

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

  // ── AI autocategorize (debounced) ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (selectedCategory) {
      setSuggestion(null);
      setSuggesting(false);
      return;
    }
    if (name.trim().length < 3 || categories.length === 0) {
      setSuggestion(null);
      setSuggesting(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setSuggesting(true);
      try {
        const id = await autocategorize(name.trim(), categories);
        if (cancelled) return;
        setSuggestion(id && categories.some((c) => c.id === id) ? id : null);
      } catch {
        if (!cancelled) setSuggestion(null);
      } finally {
        if (!cancelled) setSuggesting(false);
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, categories.length, selectedCategory, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestedCategory = suggestion
    ? categories.find((c) => c.id === suggestion)
    : undefined;

  function applySuggestion() {
    if (suggestedCategory) {
      setSelectedCategory(suggestedCategory.id);
      setSuggestion(null);
    }
  }

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
    setSuggestion(null);
    setSuggesting(false);
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

  const parsedAmount = parseFloat(amount) || 0;
  const parsedDay = parseInt(dayOfMonth) || 0;
  const formValid =
    name.trim().length > 0 &&
    parsedAmount > 0 &&
    parsedDay >= 1 &&
    parsedDay <= 31;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!formValid) return;

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

  // Subtitle: si tenemos monto + dia, mostramos un preview compacto
  const subtitle =
    parsedAmount > 0 && parsedDay >= 1 && parsedDay <= 31
      ? `${currency} ${parsedAmount.toLocaleString('es-UY')} · día ${parsedDay} del mes`
      : editing
      ? 'Modificá cualquier campo y guardá los cambios'
      : 'Configurá un pago que se repite todos los meses';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Editar pago recurrente' : 'Nuevo pago recurrente'}
      subtitle={subtitle}
      footer={
        <Button
          type="button"
          className="w-full"
          size="lg"
          isLoading={submitting}
          disabled={!formValid}
          onClick={() => handleSubmit()}
        >
          {editing ? 'Guardar cambios' : 'Crear pago recurrente'}
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Moneda */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Moneda
          </label>
          <div className="flex gap-2">
            {(['UYU', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={chipClass(currency === c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Recordatorios */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Recordatorios{' '}
            <span className="text-text-muted font-normal">(hasta 2)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {REMINDER_OPTIONS.map((opt) => {
              const active = reminders.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReminder(opt.value)}
                  className={chipClass(active)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {reminders.length === 0 && (
            <p className="text-2xs text-warning mt-2">
              Sin recordatorios — no vas a recibir push para este pago
            </p>
          )}
        </div>

        {/* Asignado a */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Asignado a
          </label>
          <div className="flex gap-2 flex-wrap">
            {ASSIGNED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAssignedTo(opt.value)}
                className={chipClass(assignedTo === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Tarjeta
          </label>
          <div className="flex gap-2 flex-wrap">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  setSelectedCard(selectedCard === card.id ? undefined : card.id)
                }
                className={chipClass(selectedCard === card.id)}
              >
                {card.name}
              </button>
            ))}
            {!showNewCard && (
              <button
                type="button"
                onClick={() => setShowNewCard(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-light text-text-muted border border-dashed border-border hover:text-text-secondary hover:border-primary/40 transition-colors"
              >
                + Nueva
              </button>
            )}
          </div>
          {showNewCard && (
            <div className="flex items-center gap-2 mt-3">
              <input
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="Nombre tarjeta"
                className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <IconButton
                aria-label="Guardar tarjeta"
                variant="subtle"
                onClick={handleAddCard}
                className="text-primary"
              >
                <Check size={18} />
              </IconButton>
              <IconButton
                aria-label="Cancelar"
                variant="ghost"
                onClick={() => {
                  setShowNewCard(false);
                  setNewCardName('');
                }}
              >
                <XIcon size={18} />
              </IconButton>
            </div>
          )}
        </div>

        {/* Categoria */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-2">
            Categoría
            {suggesting && (
              <Loader2 size={12} className="animate-spin text-primary" />
            )}
          </label>
          {suggestedCategory && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-info-soft border border-info/20">
              <Sparkles size={14} className="text-info shrink-0" />
              <span className="text-xs text-text-secondary">
                Sugerido:{' '}
                <span className="font-semibold text-text-primary">
                  {suggestedCategory.emoji} {suggestedCategory.label}
                </span>
              </span>
              <button
                type="button"
                onClick={applySuggestion}
                className="ml-auto text-xs font-semibold text-info hover:underline"
              >
                Aplicar
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.id ? undefined : cat.id,
                  )
                }
                className={chipClass(selectedCategory === cat.id)}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
            {!showNewCat && (
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-light text-text-muted border border-dashed border-border hover:text-text-secondary hover:border-primary/40 transition-colors"
              >
                + Nueva
              </button>
            )}
          </div>
          {showNewCat && (
            <div className="flex items-center gap-2 mt-3">
              <input
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                placeholder={'\uD83D\uDCE6'}
                maxLength={2}
                className="w-12 rounded-lg border border-border bg-surface-hover px-2 py-2 text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <input
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                placeholder="Nombre"
                className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <IconButton
                aria-label="Guardar categoría"
                variant="subtle"
                onClick={handleAddCategory}
                className="text-primary"
              >
                <Check size={18} />
              </IconButton>
              <IconButton
                aria-label="Cancelar"
                variant="ghost"
                onClick={() => {
                  setShowNewCat(false);
                  setNewCatEmoji('');
                  setNewCatLabel('');
                }}
              >
                <XIcon size={18} />
              </IconButton>
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
}
