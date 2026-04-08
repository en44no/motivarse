import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToExpenseCards,
  addExpenseCard,
  deleteExpenseCard,
} from '../services/expense-card.service';
import type { ExpenseCard } from '../types/expense';

export function useExpenseCards() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [cards, setCards] = useState<ExpenseCard[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = couple?.coupleId || null;

  useEffect(() => {
    if (!coupleId) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToExpenseCards(coupleId, (data) => {
      setCards(data);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  const add = useCallback(
    async (name: string) => {
      if (!user || !coupleId) return;
      try {
        await addExpenseCard({
          coupleId,
          name,
          createdAt: Date.now(),
        });
      } catch (error) {
        toast.error('No se pudo agregar la tarjeta.');
      }
    },
    [user, coupleId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user || !coupleId) return;
      try {
        await deleteExpenseCard(id);
      } catch (error) {
        toast.error('No se pudo eliminar la tarjeta.');
      }
    },
    [user, coupleId],
  );

  return { cards, loading, add, remove };
}
