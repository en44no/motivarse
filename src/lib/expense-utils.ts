import type { Expense, ExpensePayment } from '../types/expense';

/**
 * Una cuota esta "en mismatch" cuando quien la pago efectivamente
 * no coincide con quien tenia asignado pagarla.
 *
 * Reglas:
 * - Si el payment no tiene paidBy (registros viejos) → no se considera mismatch.
 * - Si paidBy === expense.assignedTo → no hay mismatch.
 * - Cualquier otra combinacion → mismatch (ej: gasto de Vale pagado por Yo,
 *   gasto compartido pagado por uno solo, etc.).
 */
export function isPaymentMismatched(
  payment: ExpensePayment,
  expense: Expense,
): boolean {
  if (!payment.paidBy) return false;
  return payment.paidBy !== expense.assignedTo;
}

export function getMismatchedPayments(expense: Expense): ExpensePayment[] {
  return expense.payments.filter((p) => isPaymentMismatched(p, expense));
}

export function hasPaymentMismatch(expense: Expense): boolean {
  return expense.payments.some((p) => isPaymentMismatched(p, expense));
}
