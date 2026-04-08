import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../services/expense-category.service';
import type { ExpenseCategory } from '../types/expense';

export function useExpenseCategories() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = couple?.coupleId || null;

  useEffect(() => {
    if (!coupleId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToExpenseCategories(coupleId, (data) => {
      setCategories(data);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  const add = useCallback(
    async (label: string, emoji: string) => {
      if (!user || !coupleId) return;
      try {
        await addExpenseCategory({
          coupleId,
          label,
          emoji,
          createdBy: user.uid,
          createdAt: Date.now(),
        });
      } catch (error) {
        toast.error('No se pudo agregar la categoria.');
      }
    },
    [user, coupleId],
  );

  const update = useCallback(
    async (id: string, label: string, emoji: string) => {
      if (!user || !coupleId) return;
      try {
        await updateExpenseCategory(id, { label, emoji });
      } catch (error) {
        toast.error('No se pudo actualizar la categoria.');
      }
    },
    [user, coupleId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user || !coupleId) return;
      try {
        await deleteExpenseCategory(id);
      } catch (error) {
        toast.error('No se pudo eliminar la categoria.');
      }
    },
    [user, coupleId],
  );

  return { categories, loading, add, update, remove };
}
