import { AnimatePresence } from 'framer-motion';
import { ExpenseItem } from './ExpenseItem';
import type { Expense, ExpenseCard, ExpenseCategory } from '../../types/expense';

interface ExpenseListProps {
  expenses: Expense[];
  cards: ExpenseCard[];
  categories: ExpenseCategory[];
  onSelect: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, cards, categories, onSelect, onDelete }: ExpenseListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {expenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            card={expense.card ? cards.find(c => c.id === expense.card) : undefined}
            category={expense.category ? categories.find(c => c.id === expense.category) : undefined}
            onSelect={() => onSelect(expense)}
            onDelete={() => onDelete(expense.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
