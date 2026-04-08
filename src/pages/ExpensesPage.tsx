import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Plus } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useExpenses } from '../hooks/useExpenses';
import { useExpenseCards } from '../hooks/useExpenseCards';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { ExpenseAddDialog } from '../components/expenses/ExpenseAddDialog';
import { ExpenseDetailDialog } from '../components/expenses/ExpenseDetailDialog';
import { ExpenseSummaryFooter } from '../components/expenses/ExpenseSummaryFooter';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs } from '../components/ui/Tabs';
import { cn } from '../lib/utils';
import type { Expense } from '../types/expense';

type StatusTab = 'pending' | 'completed';
type AssignedFilter = 'all' | 'me' | 'partner' | 'both';

export function ExpensesPage() {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const { expenses, pending, completed, loading, remove, update, addPayment, removePayment } = useExpenses();
  const { cards } = useExpenseCards();
  const { categories } = useExpenseCategories();

  const [tab, setTab] = useState<StatusTab>('pending');
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>('all');
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const partnerId = couple?.members.find(m => m !== user?.uid);

  const memberNames: Record<string, string> = useMemo(() => {
    const names: Record<string, string> = { both: 'Ambos' };
    if (user) names[user.uid] = 'Yo';
    if (partnerId) names[partnerId] = partnerName || 'Pareja';
    return names;
  }, [user, partnerId, partnerName]);

  function getAssignedLabel(expense: Expense): string {
    return memberNames[expense.assignedTo] || 'Desconocido';
  }

  // Filter logic
  const filterExpenses = (list: Expense[]) => {
    let filtered = list;
    if (assignedFilter === 'me') filtered = filtered.filter(e => e.assignedTo === user?.uid);
    else if (assignedFilter === 'partner') filtered = filtered.filter(e => e.assignedTo === partnerId);
    else if (assignedFilter === 'both') filtered = filtered.filter(e => e.assignedTo === 'both');
    if (cardFilter) filtered = filtered.filter(e => e.card === cardFilter);
    return filtered;
  };

  const baseList = tab === 'pending' ? pending : completed;
  const filteredList = filterExpenses(baseList);

  // Cards used in current tab for filter pills
  const usedCardIds = new Set(baseList.map(e => e.card).filter(Boolean));
  const usedCards = cards.filter(c => usedCardIds.has(c.id));

  const currentSelected = selectedExpense
    ? expenses.find(e => e.id === selectedExpense.id) || null
    : null;

  const TABS = [
    { id: 'pending', label: `Pendientes (${pending.length})` },
    { id: 'completed', label: `Completados (${completed.length})` },
  ];

  const ASSIGNED_FILTERS: { id: AssignedFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'me', label: 'Yo' },
    { id: 'partner', label: partnerName || 'Pareja' },
    { id: 'both', label: 'Los dos' },
  ];

  if (loading) {
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
      {/* Status tabs */}
      <Tabs tabs={TABS} activeTab={tab} onChange={(id) => { setTab(id as StatusTab); setCardFilter(null); }} />

      {/* Assigned filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 px-1 scrollbar-none">
        {ASSIGNED_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setAssignedFilter(assignedFilter === f.id && f.id !== 'all' ? 'all' : f.id)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              assignedFilter === f.id
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card filter pills (only show if cards exist in current tab) */}
      {usedCards.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 px-1 scrollbar-none">
          <button
            onClick={() => setCardFilter(null)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              cardFilter === null
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
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
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary'
              )}
            >
              {card.name}
            </button>
          ))}
        </div>
      )}

      {/* Expense list */}
      {filteredList.length > 0 ? (
        <ExpenseList
          expenses={filteredList}
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

      {/* Summary footer */}
      <ExpenseSummaryFooter expenses={filteredList} />

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
        onUpdate={update}
      />

      {/* FAB */}
      {createPortal(
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-28 right-4 w-14 h-14 rounded-full bg-gradient-to-b from-primary to-primary-hover text-white shadow-lg shadow-primary/40 flex items-center justify-center z-30 hover:from-primary-hover hover:to-primary transition-colors active:scale-90"
          aria-label="Nuevo gasto"
        >
          <Plus size={24} />
        </button>,
        document.body,
      )}
    </div>
  );
}
