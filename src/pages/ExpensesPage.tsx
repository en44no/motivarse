import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Plus, Repeat, Search, X, Calendar as CalendarIcon } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useExpenses } from '../hooks/useExpenses';
import { useExpenseCards } from '../hooks/useExpenseCards';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import {
  useRecurringPayments,
  isPaidThisMonth,
} from '../hooks/useRecurringPayments';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { ExpenseAddDialog } from '../components/expenses/ExpenseAddDialog';
import { ExpenseDetailDialog } from '../components/expenses/ExpenseDetailDialog';
import { ExpenseSummaryFooter } from '../components/expenses/ExpenseSummaryFooter';
import { ExpensesCalendar } from '../components/expenses/ExpensesCalendar';
import { RecurringPaymentList } from '../components/expenses/RecurringPaymentList';
import { RecurringPaymentAddDialog } from '../components/expenses/RecurringPaymentAddDialog';
import { RecurringPaymentDetailDialog } from '../components/expenses/RecurringPaymentDetailDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs } from '../components/ui/Tabs';
import { cn } from '../lib/utils';
import type { Expense, RecurringPayment } from '../types/expense';

type StatusTab = 'pending' | 'completed' | 'recurring' | 'calendar';
type AssignedFilter = 'all' | 'me' | 'partner' | 'both';

export function ExpensesPage() {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const { expenses, pending, completed, loading, remove, addPayment, removePayment, duplicate } = useExpenses();
  const { cards } = useExpenseCards();
  const { categories } = useExpenseCategories();
  const {
    items: recurringItems,
    loading: recurringLoading,
    remove: removeRecurring,
    markMonthPaid,
    unmarkMonthPaid,
  } = useRecurringPayments();

  const [tab, setTab] = useState<StatusTab>('pending');
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>('all');
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringPayment | null>(null);

  const partnerId = couple?.members.find(m => m !== user?.uid);

  const memberNames: Record<string, string> = useMemo(() => {
    const names: Record<string, string> = { both: 'Ambos' };
    if (user) names[user.uid] = 'Yo';
    if (partnerId) names[partnerId] = partnerName || 'Pareja';
    return names;
  }, [user, partnerId, partnerName]);

  const isRecurringTab = tab === 'recurring';
  const isCalendarTab = tab === 'calendar';
  const searchQuery = search.trim().toLowerCase();

  // Filter logic (expenses)
  const filterExpenses = (list: Expense[]) => {
    let filtered = list;
    if (assignedFilter === 'me') filtered = filtered.filter(e => e.assignedTo === user?.uid);
    else if (assignedFilter === 'partner') filtered = filtered.filter(e => e.assignedTo === partnerId);
    else if (assignedFilter === 'both') filtered = filtered.filter(e => e.assignedTo === 'both');
    if (cardFilter) filtered = filtered.filter(e => e.card === cardFilter);
    if (searchQuery) filtered = filtered.filter(e => e.name.toLowerCase().includes(searchQuery));
    return filtered;
  };

  // Filter logic (recurring)
  const filterRecurring = (list: RecurringPayment[]) => {
    let filtered = list;
    if (assignedFilter === 'me') filtered = filtered.filter(i => i.assignedTo === user?.uid);
    else if (assignedFilter === 'partner') filtered = filtered.filter(i => i.assignedTo === partnerId);
    else if (assignedFilter === 'both') filtered = filtered.filter(i => i.assignedTo === 'both');
    if (cardFilter) filtered = filtered.filter(i => i.card === cardFilter);
    if (searchQuery) filtered = filtered.filter(i => i.name.toLowerCase().includes(searchQuery));
    return filtered;
  };

  // Ordenar recurrentes: pendientes primero (por días hasta vencer), luego pagados
  const sortedRecurring = useMemo(() => {
    const sorted = [...recurringItems].sort((a, b) => {
      const aPaid = isPaidThisMonth(a);
      const bPaid = isPaidThisMonth(b);
      if (aPaid !== bPaid) return aPaid ? 1 : -1;
      return a.dayOfMonth - b.dayOfMonth;
    });
    return sorted;
  }, [recurringItems]);

  const baseExpenses = tab === 'pending' ? pending : tab === 'completed' ? completed : [];
  const filteredExpenses = filterExpenses(baseExpenses);
  const filteredRecurring = filterRecurring(sortedRecurring);

  // Cards used for filter pills (depende del tab activo)
  const usedCardIds = isRecurringTab
    ? new Set(recurringItems.map(i => i.card).filter(Boolean))
    : new Set(baseExpenses.map(e => e.card).filter(Boolean));
  const usedCards = cards.filter(c => usedCardIds.has(c.id));

  const currentSelected = selectedExpense
    ? expenses.find(e => e.id === selectedExpense.id) || null
    : null;

  const currentSelectedRecurring = selectedRecurring
    ? recurringItems.find(i => i.id === selectedRecurring.id) || null
    : null;

  const recurringPendingCount = useMemo(
    () => recurringItems.filter(i => !isPaidThisMonth(i)).length,
    [recurringItems],
  );

  const TABS = [
    { id: 'pending', label: `Pend. (${pending.length})` },
    { id: 'completed', label: `Compl. (${completed.length})` },
    { id: 'recurring', label: `Recurrentes (${recurringPendingCount})` },
  ];

  const ASSIGNED_FILTERS: { id: AssignedFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'me', label: 'Yo' },
    { id: 'partner', label: partnerName || 'Pareja' },
    { id: 'both', label: 'Los dos' },
  ];

  function handleFabClick() {
    if (isRecurringTab) {
      setEditingRecurring(null);
      setShowAddRecurring(true);
    } else {
      setShowAdd(true);
    }
  }

  const showLoading = isCalendarTab
    ? loading || recurringLoading
    : isRecurringTab
      ? recurringLoading
      : loading;

  if (showLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl bg-surface-light/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 pb-52">
      {/* Status tabs + Calendar toggle */}
      <div className="flex items-stretch gap-2">
        <Tabs
          tabs={TABS}
          activeTab={tab}
          onChange={(id) => { setTab(id as StatusTab); setCardFilter(null); }}
          className="flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => { setTab('calendar'); setCardFilter(null); }}
          aria-label="Ver calendario"
          aria-pressed={isCalendarTab}
          className={cn(
            'shrink-0 flex items-center justify-center w-11 rounded-xl border transition-colors',
            isCalendarTab
              ? 'bg-gradient-to-b from-primary to-primary-hover text-primary-contrast border-transparent shadow-[var(--shadow-glow-primary)]'
              : 'bg-surface border-border/50 text-text-muted hover:text-text-secondary'
          )}
        >
          <CalendarIcon size={18} />
        </button>
      </div>

      {/* Search input (oculto en tab calendario) */}
      {!isCalendarTab && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar gasto..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-surface-light border border-border/60 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              aria-label="Limpiar busqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Assigned filter pills (oculto en tab calendario) */}
      {!isCalendarTab && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 px-1 scrollbar-none">
          {ASSIGNED_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setAssignedFilter(assignedFilter === f.id && f.id !== 'all' ? 'all' : f.id)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
                assignedFilter === f.id
                  ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Card filter pills (only show if cards exist in current tab) */}
      {!isCalendarTab && usedCards.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 px-1 scrollbar-none">
          <button
            onClick={() => setCardFilter(null)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              cardFilter === null
                ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            Todas
          </button>
          {usedCards.map(card => (
            <button
              key={card.id}
              onClick={() => setCardFilter(cardFilter === card.id ? null : card.id)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
                cardFilter === card.id
                  ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary'
              )}
            >
              {card.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isCalendarTab ? (
        <ExpensesCalendar
          expenses={expenses}
          recurringPayments={recurringItems}
          cards={cards}
          categories={categories}
        />
      ) : isRecurringTab ? (
        filteredRecurring.length > 0 ? (
          <RecurringPaymentList
            items={filteredRecurring}
            cards={cards}
            categories={categories}
            memberNames={memberNames}
            onSelect={setSelectedRecurring}
            onDelete={(id) => removeRecurring(id)}
          />
        ) : (
          <EmptyState
            icon={<Repeat size={36} />}
            title="Sin pagos recurrentes"
            description="Agregá suscripciones y servicios (Netflix, luz, etc.) con el botón +"
          />
        )
      ) : filteredExpenses.length > 0 ? (
        <ExpenseList
          expenses={filteredExpenses}
          cards={cards}
          categories={categories}
          memberNames={memberNames}
          onSelect={setSelectedExpense}
          onDelete={(id) => remove(id)}
        />
      ) : (
        <EmptyState
          icon={<Wallet size={36} />}
          title={tab === 'pending' ? 'Sin gastos pendientes' : 'Sin gastos completados'}
          description={tab === 'pending' ? 'Agregá un gasto con el botón +' : 'Los gastos que completes aparecen acá'}
        />
      )}

      {/* Summary footer (solo para gastos normales) */}
      {!isRecurringTab && !isCalendarTab && <ExpenseSummaryFooter expenses={filteredExpenses} />}

      {/* Dialogs */}
      <ExpenseAddDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <ExpenseDetailDialog
        expense={currentSelected}
        cards={cards}
        categories={categories}
        memberNames={memberNames}
        onClose={() => setSelectedExpense(null)}
        onAddPayment={addPayment}
        onRemovePayment={removePayment}
        onDelete={remove}
        onDuplicate={duplicate}
      />

      <RecurringPaymentAddDialog
        open={showAddRecurring}
        onClose={() => {
          setShowAddRecurring(false);
          setEditingRecurring(null);
        }}
        editing={editingRecurring}
      />
      <RecurringPaymentDetailDialog
        item={currentSelectedRecurring}
        cards={cards}
        categories={categories}
        memberNames={memberNames}
        onClose={() => setSelectedRecurring(null)}
        onMarkPaid={markMonthPaid}
        onUnmarkPaid={unmarkMonthPaid}
        onDelete={removeRecurring}
        onEdit={(item) => {
          setEditingRecurring(item);
          setShowAddRecurring(true);
        }}
      />

      {/* FAB */}
      {createPortal(
        <button
          onClick={handleFabClick}
          className="fixed bottom-28 right-4 w-14 h-14 rounded-full bg-gradient-to-b from-primary to-primary-hover text-primary-contrast shadow-lg shadow-primary/40 flex items-center justify-center z-30 hover:from-primary-hover hover:to-primary transition-colors active:scale-90"
          aria-label={isRecurringTab ? 'Nuevo pago recurrente' : 'Nuevo gasto'}
          title={isRecurringTab ? 'Nuevo pago recurrente' : 'Nuevo gasto'}
        >
          <Plus size={24} />
        </button>,
        document.body,
      )}
    </div>
  );
}
