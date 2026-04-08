import { AnimatePresence } from 'framer-motion';
import { RecurringPaymentItem } from './RecurringPaymentItem';
import type {
  RecurringPayment,
  ExpenseCard,
  ExpenseCategory,
} from '../../types/expense';

interface RecurringPaymentListProps {
  items: RecurringPayment[];
  cards: ExpenseCard[];
  categories: ExpenseCategory[];
  memberNames: Record<string, string>;
  onSelect: (item: RecurringPayment) => void;
  onDelete: (id: string) => void;
}

export function RecurringPaymentList({
  items,
  cards,
  categories,
  memberNames,
  onSelect,
  onDelete,
}: RecurringPaymentListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <RecurringPaymentItem
            key={item.id}
            item={item}
            card={item.card ? cards.find((c) => c.id === item.card) : undefined}
            category={
              item.category ? categories.find((c) => c.id === item.category) : undefined
            }
            assignedToLabel={memberNames[item.assignedTo] || ''}
            onSelect={() => onSelect(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
