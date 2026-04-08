import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Eye, EyeOff } from 'lucide-react';
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
import { cn } from '../lib/utils';
import type { Expense } from '../types/expense';

type AssignedFilter = 'all' | 'me' | 'partner' | 'both';

export function ExpensesPage() {
  const { user } = useAuthContext();
  const { couple, partnerName } = useCoupleContext();
  const { expenses, pending, completed, loading, remove, addPayment, removePayment } = useExpenses();
  const { cards } = useExpenseCards();
  const { categories } = useExpenseCategories();

  const [filter, setFilter] = useState<AssignedFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Filter logic
  const filterExpenses = (list: Expense[]) => {
    if (filter === 'all') return list;
    if (filter === 'me') return list.filter(e => e.assignedTo === user?.uid);
    if (filter === 'partner') {
      const partnerId = couple?.members.find(m => m !== user?.uid);
      return list.filter(e => e.assignedTo === partnerId);
    }
    return list.filter(e => e.assignedTo === 'both');
  };

  const filteredPending = filterExpenses(pending);
  const filteredCompleted = filterExpenses(completed);

  const FILTERS: { id: AssignedFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'me', label: 'Yo' },
    { id: 'partner', label: partnerName || 'Pareja' },
    { id: 'both', label: 'Los dos' },
  ];

  // When the selected expense updates in the list, sync it
  const currentSelected = selectedExpense
    ? expenses.find(e => e.id === selectedExpense.id) || null
    : null;

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
      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 px-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(filter === f.id && f.id !== 'all' ? 'all' : f.id)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              filter === f.id
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pending expenses */}
      {filteredPending.length > 0 ? (
        <ExpenseList
          expenses={filteredPending}
          cards={cards}
          categories={categories}
          onSelect={setSelectedExpense}
          onDelete={(id) => remove(id)}
        />
      ) : (
        <EmptyState
          icon={<Wallet size={36} />}
          title="Sin gastos pendientes"
          description="Agregá un gasto con el botón +"
        />
      )}

      {/* Completed section */}
      {filteredCompleted.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider px-1"
          >
            {showCompleted ? <EyeOff size={13} /> : <Eye size={13} />}
            Completados ({filteredCompleted.length})
          </button>
          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ExpenseList
                  expenses={filteredCompleted}
                  cards={cards}
                  categories={categories}
                  onSelect={setSelectedExpense}
                  onDelete={(id) => remove(id)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Summary footer */}
      <ExpenseSummaryFooter expenses={filter === 'all' ? pending : filteredPending} />

      {/* Dialogs */}
      <ExpenseAddDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <ExpenseDetailDialog
        expense={currentSelected}
        cards={cards}
        categories={categories}
        onClose={() => setSelectedExpense(null)}
        onAddPayment={addPayment}
        onRemovePayment={removePayment}
      />

      {/* FAB via portal (same pattern as HabitsPage) */}
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
