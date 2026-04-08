import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useExpenses } from '../../hooks/useExpenses';
import { useExpenseCards } from '../../hooks/useExpenseCards';
import { useExpenseCategories } from '../../hooks/useExpenseCategories';
import { formatCurrency } from '../../lib/currency-utils';
import { cn } from '../../lib/utils';
import type { Currency } from '../../types/expense';

interface ExpenseAddDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExpenseAddDialog({ open, onClose }: ExpenseAddDialogProps) {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const { add } = useExpenses();
  const { cards, add: addCard } = useExpenseCards();
  const { categories, add: addCategory } = useExpenseCategories();

  // Form state
  const [name, setName] = useState('');
  const [installmentPrice, setInstallmentPrice] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [isFixed, setIsFixed] = useState(true);
  const [currency, setCurrency] = useState<Currency>('UYU');
  const [assignedTo, setAssignedTo] = useState<string>('both');
  const [selectedCard, setSelectedCard] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Inline creation states
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');

  const price = parseFloat(installmentPrice) || 0;
  const installments = parseInt(totalInstallments) || 0;
  const total = price * installments;

  const partnerId = couple?.members.find((m) => m !== user?.uid);

  const ASSIGNED_OPTIONS = [
    { value: user?.uid || '', label: 'Yo' },
    { value: partnerId || '', label: partnerName || 'Pareja' },
    { value: 'both', label: 'Los dos' },
  ];

  function resetForm() {
    setName('');
    setInstallmentPrice('');
    setTotalInstallments('');
    setIsFixed(true);
    setCurrency('UYU');
    setAssignedTo('both');
    setSelectedCard(undefined);
    setSelectedCategory(undefined);
    setShowNewCard(false);
    setNewCardName('');
    setShowNewCat(false);
    setNewCatEmoji('');
    setNewCatLabel('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || price <= 0 || installments <= 0) return;

    setSubmitting(true);
    try {
      await add({
        name: name.trim(),
        installmentPrice: price,
        totalInstallments: installments,
        isFixedInstallment: isFixed,
        currency,
        assignedTo,
        ...(selectedCard ? { card: selectedCard } : {}),
        ...(selectedCategory ? { category: selectedCategory } : {}),
      });
      resetForm();
      onClose();
    } catch {
      toast.error('No se pudo crear el gasto');
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
    <Dialog open={open} onClose={onClose} title="Nuevo gasto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <Input
          label="Nombre"
          placeholder="Ej: Movistar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Precio + cuotas */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio/cuota"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={installmentPrice}
            onChange={(e) => setInstallmentPrice(e.target.value)}
            required
          />
          <Input
            label="Cuotas"
            type="number"
            inputMode="numeric"
            placeholder="1"
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
            required
          />
        </div>

        {/* Total preview */}
        {total > 0 && (
          <div className="text-sm font-semibold text-text-primary bg-surface-hover rounded-xl px-4 py-2.5">
            Total: {formatCurrency(total, currency)}
          </div>
        )}

        {/* Moneda + Tipo cuota */}
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
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    currency === c
                      ? 'bg-primary text-primary-contrast'
                      : 'bg-surface-hover text-text-muted',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Tipo cuota
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsFixed(true)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  isFixed
                    ? 'bg-primary text-primary-contrast'
                    : 'bg-surface-hover text-text-muted',
                )}
              >
                Fija
              </button>
              <button
                type="button"
                onClick={() => setIsFixed(false)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  !isFixed
                    ? 'bg-primary text-primary-contrast'
                    : 'bg-surface-hover text-text-muted',
                )}
              >
                Variable
              </button>
            </div>
          </div>
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
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  assignedTo === opt.value
                    ? 'bg-primary text-primary-contrast'
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
                    ? 'bg-primary text-primary-contrast'
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
            Categoria
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
                    ? 'bg-primary text-primary-contrast'
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
          Crear gasto
        </Button>
      </form>
    </Dialog>
  );
}
