import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../services/expense.service';
import type { Expense, ExpensePayment } from '../types/expense';

export function useExpenses() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = couple?.coupleId || null;

  useEffect(() => {
    if (!coupleId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToExpenses(coupleId, (data) => {
      setExpenses(data);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  const pending = expenses.filter((e) => e.payments.length < e.totalInstallments);
  const completed = expenses.filter((e) => e.payments.length >= e.totalInstallments);

  const add = useCallback(
    async (
      data: Omit<Expense, 'id' | 'coupleId' | 'createdBy' | 'payments' | 'createdAt' | 'updatedAt'> & {
        createdAt?: number;
      },
    ) => {
      if (!user || !coupleId) return;
      try {
        const now = Date.now();
        const { createdAt, ...rest } = data;
        await addExpense({
          ...rest,
          coupleId,
          createdBy: user.uid,
          payments: [],
          createdAt: createdAt ?? now,
          updatedAt: now,
        });
      } catch (error) {
        toast.error('No se pudo agregar el gasto.');
      }
    },
    [user, coupleId],
  );

  const update = useCallback(
    async (id: string, data: Partial<Expense>) => {
      if (!user || !coupleId) return;
      try {
        await updateExpense(id, {
          ...data,
          updatedAt: Date.now(),
        });
      } catch (error) {
        toast.error('No se pudo actualizar el gasto.');
      }
    },
    [user, coupleId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user || !coupleId) return;
      try {
        await deleteExpense(id);
      } catch (error) {
        toast.error('No se pudo eliminar el gasto.');
      }
    },
    [user, coupleId],
  );

  const addPayment = useCallback(
    async (expenseId: string, payment: ExpensePayment) => {
      if (!user || !coupleId) return;
      try {
        const expense = expenses.find((e) => e.id === expenseId);
        if (!expense) return;

        const alreadyPaid = expense.payments.some(
          (p) => p.installmentNumber === payment.installmentNumber,
        );
        if (alreadyPaid) {
          toast.error('Esa cuota ya fue pagada.');
          return;
        }

        const updatedPayments = [...expense.payments, payment];
        await updateExpense(expenseId, {
          payments: updatedPayments,
          updatedAt: Date.now(),
        });
      } catch (error) {
        toast.error('No se pudo registrar el pago.');
      }
    },
    [user, coupleId, expenses],
  );

  const removePayment = useCallback(
    async (expenseId: string, installmentNumber: number) => {
      if (!user || !coupleId) return;
      try {
        const expense = expenses.find((e) => e.id === expenseId);
        if (!expense) return;

        const updatedPayments = expense.payments.filter(
          (p) => p.installmentNumber !== installmentNumber,
        );
        await updateExpense(expenseId, {
          payments: updatedPayments,
          updatedAt: Date.now(),
        });
      } catch (error) {
        toast.error('No se pudo eliminar el pago.');
      }
    },
    [user, coupleId, expenses],
  );

  const duplicate = useCallback(
    async (id: string) => {
      if (!user || !coupleId) return;
      const source = expenses.find((e) => e.id === id);
      if (!source) return;
      try {
        const now = Date.now();
        await addExpense({
          coupleId,
          name: source.name,
          installmentPrice: source.installmentPrice,
          totalInstallments: source.totalInstallments,
          isFixedInstallment: source.isFixedInstallment,
          currency: source.currency,
          ...(source.category ? { category: source.category } : {}),
          ...(source.card ? { card: source.card } : {}),
          assignedTo: source.assignedTo,
          payments: [],
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        });
        toast.success('Gasto duplicado');
      } catch (error) {
        toast.error('No se pudo duplicar el gasto.');
      }
    },
    [user, coupleId, expenses],
  );

  return { expenses, pending, completed, loading, add, update, remove, addPayment, removePayment, duplicate };
}
