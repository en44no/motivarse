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
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted font-medium">
            {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
          </span>
          <div className="flex items-center gap-3">
            {summaries.map((s) => (
              <div key={s.currency} className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-text-muted">Total</p>
                  <p className="font-bold text-text-primary">
                    {formatCurrency(s.totalAmount, s.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted">Restante</p>
                  <p className="font-bold text-accent">
                    {formatCurrency(s.remainingAmount, s.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
