import { Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/currency-utils';
import type { Expense, Currency } from '../../types/expense';

interface ExpenseSummaryFooterProps {
  expenses: Expense[];
}

interface CurrencySummary {
  currency: Currency;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

function computeSummaries(expenses: Expense[]): CurrencySummary[] {
  const map = new Map<Currency, { total: number; paid: number }>();

  for (const expense of expenses) {
    const existing = map.get(expense.currency) ?? { total: 0, paid: 0 };
    existing.total += expense.installmentPrice * expense.totalInstallments;
    existing.paid += expense.payments.reduce((sum, p) => sum + p.amount, 0);
    map.set(expense.currency, existing);
  }

  return Array.from(map.entries()).map(([currency, { total, paid }]) => ({
    currency,
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: total - paid,
  }));
}

export function ExpenseSummaryFooter({ expenses }: ExpenseSummaryFooterProps) {
  if (expenses.length === 0) return null;

  const summaries = computeSummaries(expenses);

  return (
    <div className="sticky bottom-20 z-20 mx-auto max-w-lg">
      <div className="bg-surface/90 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0">
            <Wallet size={12} />
          </span>
          <span className="text-xs font-semibold text-text-secondary">
            {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
          </span>
        </div>

        {/* Summaries por moneda */}
        <div className="space-y-1.5">
          {summaries.map((s) => (
            <div
              key={s.currency}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-text-muted shrink-0">
                  {s.currency}
                </span>
                <span className="text-text-muted truncate">Total</span>
                <span className="font-bold text-text-primary tabular-nums truncate">
                  {formatCurrency(s.totalAmount, s.currency)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-text-muted">Restante</span>
                <span className="font-bold text-accent tabular-nums">
                  {formatCurrency(s.remainingAmount, s.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
