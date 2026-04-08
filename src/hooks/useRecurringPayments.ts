import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToRecurringPayments,
  addRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
} from '../services/recurring-payment.service';
import type { RecurringPayment, RecurringPaymentRecord } from '../types/expense';

/** YYYY-MM del mes actual */
export function getCurrentYearMonth(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Días en un mes específico (1-indexed month) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Fecha de vencimiento efectiva este mes (acota dayOfMonth al último día si corresponde) */
export function getDueDateThisMonth(dayOfMonth: number, now: Date = new Date()): Date {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const maxDay = daysInMonth(year, month + 1);
  const actualDay = Math.min(dayOfMonth, maxDay);
  return new Date(year, month, actualDay, 23, 59, 59);
}

/** Días restantes para el vencimiento de este mes (negativo si ya venció) */
export function getDaysUntilDue(dayOfMonth: number, now: Date = new Date()): number {
  const due = getDueDateThisMonth(dayOfMonth, now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = dueDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** ¿Ya está pagado este mes? */
export function isPaidThisMonth(
  rp: RecurringPayment,
  yearMonth: string = getCurrentYearMonth(),
): boolean {
  return rp.paymentHistory.some((r) => r.yearMonth === yearMonth);
}

export function useRecurringPayments() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [items, setItems] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = couple?.coupleId || null;

  useEffect(() => {
    if (!coupleId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToRecurringPayments(coupleId, (data) => {
      setItems(data);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  const add = useCallback(
    async (
      data: Omit<
        RecurringPayment,
        'id' | 'coupleId' | 'createdBy' | 'paymentHistory' | 'createdAt' | 'updatedAt' | 'isActive'
      >,
    ) => {
      if (!user || !coupleId) return;
      try {
        const now = Date.now();
        await addRecurringPayment({
          ...data,
          coupleId,
          createdBy: user.uid,
          paymentHistory: [],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        toast.error('No se pudo agregar el pago recurrente.');
      }
    },
    [user, coupleId],
  );

  const update = useCallback(
    async (id: string, data: Partial<RecurringPayment>) => {
      if (!user || !coupleId) return;
      try {
        await updateRecurringPayment(id, {
          ...data,
          updatedAt: Date.now(),
        });
      } catch {
        toast.error('No se pudo actualizar el pago recurrente.');
      }
    },
    [user, coupleId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user || !coupleId) return;
      try {
        await deleteRecurringPayment(id);
      } catch {
        toast.error('No se pudo eliminar el pago recurrente.');
      }
    },
    [user, coupleId],
  );

  /** Marca el mes indicado como pagado. Si ya existe, reemplaza el registro. */
  const markMonthPaid = useCallback(
    async (id: string, yearMonth: string, amount: number) => {
      if (!user || !coupleId) return;
      const rp = items.find((i) => i.id === id);
      if (!rp) return;

      const filtered = rp.paymentHistory.filter((r) => r.yearMonth !== yearMonth);
      const record: RecurringPaymentRecord = {
        yearMonth,
        amount,
        paidAt: Date.now(),
        paidBy: user.uid,
      };
      try {
        await updateRecurringPayment(id, {
          paymentHistory: [...filtered, record],
          updatedAt: Date.now(),
        });
      } catch {
        toast.error('No se pudo registrar el pago.');
      }
    },
    [user, coupleId, items],
  );

  /** Desmarca el mes indicado. */
  const unmarkMonthPaid = useCallback(
    async (id: string, yearMonth: string) => {
      if (!user || !coupleId) return;
      const rp = items.find((i) => i.id === id);
      if (!rp) return;
      try {
        await updateRecurringPayment(id, {
          paymentHistory: rp.paymentHistory.filter((r) => r.yearMonth !== yearMonth),
          updatedAt: Date.now(),
        });
      } catch {
        toast.error('No se pudo deshacer el pago.');
      }
    },
    [user, coupleId, items],
  );

  return { items, loading, add, update, remove, markMonthPaid, unmarkMonthPaid };
}
