import type { Currency } from '../types/expense';

export function formatCurrency(amount: number, currency: Currency): string {
  const formatted = amount.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return currency === 'USD' ? `US$ ${formatted}` : `$ ${formatted}`;
}
