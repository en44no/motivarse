export type Currency = 'UYU' | 'USD';

export interface ExpensePayment {
  installmentNumber: number;
  amount: number;
  paidAt: number;
  /**
   * Quien efectivamente pago esta cuota: userId o 'both'.
   * Opcional para back-compat con pagos viejos sin este dato (se asume que coincide con assignedTo).
   */
  paidBy?: string;
}

export interface Expense {
  id: string;
  coupleId: string;
  name: string;
  installmentPrice: number;
  totalInstallments: number;
  isFixedInstallment: boolean;
  currency: Currency;
  category?: string;
  card?: string;
  assignedTo: string; // userId or 'both'
  /** Nota libre opcional sobre el gasto. */
  description?: string;
  payments: ExpensePayment[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExpenseCard {
  id: string;
  coupleId: string;
  name: string;
  createdAt: number;
}

export interface ExpenseCategory {
  id: string;
  coupleId: string;
  label: string;
  emoji: string;
  createdBy: string;
  createdAt: number;
}

/**
 * Registro de un pago mensual de un gasto recurrente.
 * yearMonth: "YYYY-MM" (ej: "2026-04")
 */
export interface RecurringPaymentRecord {
  yearMonth: string;
  amount: number;
  paidAt: number;
  paidBy: string;
}

/**
 * Gasto recurrente (ej: Youtube Premium, Netflix, luz, agua).
 * dayOfMonth: día del mes en que vence (1-31, se acota al último día del mes si corresponde).
 * reminders: días antes del vencimiento para recordar (ej: [0, 7] = el día y 1 semana antes).
 * paymentHistory: historial de pagos, un registro por mes.
 */
export interface RecurringPayment {
  id: string;
  coupleId: string;
  name: string;
  suggestedAmount: number;
  currency: Currency;
  dayOfMonth: number;
  reminders: number[];
  category?: string;
  card?: string;
  assignedTo: string;
  paymentHistory: RecurringPaymentRecord[];
  isActive: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
