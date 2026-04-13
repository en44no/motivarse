import type { Expense, ExpensePayment } from '../types/expense';

/**
 * Una cuota esta "en mismatch" cuando quien la pago efectivamente
 * no coincide con quien tenia asignado pagarla.
 *
 * Reglas:
 * - Si el payment no tiene paidBy (registros viejos) → no se considera mismatch.
 * - Si el gasto es de 'both' (compartido) → ninguna cuota individual es mismatch:
 *   cada cuota puede legitimamente pagarla uno u otro mientras se comparta el total.
 * - Si el gasto es de un usuario especifico → mismatch si paidBy !== assignedTo
 *   (ej: gasto de Vale pagado por Nahuel).
 */
export function isPaymentMismatched(
  payment: ExpensePayment,
  expense: Expense,
): boolean {
  if (!payment.paidBy) return false;
  if (expense.assignedTo === 'both') return false;
  return payment.paidBy !== expense.assignedTo;
}

export function getMismatchedPayments(expense: Expense): ExpensePayment[] {
  return expense.payments.filter((p) => isPaymentMismatched(p, expense));
}

export function hasPaymentMismatch(expense: Expense): boolean {
  return expense.payments.some((p) => isPaymentMismatched(p, expense));
}
