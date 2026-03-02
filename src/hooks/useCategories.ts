import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToCategories,
  addCategory,
  deleteCategory,
} from '../services/category.service';
import type { CoupleCategory } from '../types/category';

export function useCategories() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const [categories, setCategories] = useState<CoupleCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid || null;

  useEffect(() => {
    if (!coupleId || !userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeToCategories(coupleId, (cats) => {
      setCategories(cats);
      setLoading(false);
    });

    return unsub;
  }, [coupleId, userId]);

  const add = useCallback(
    async (label: string, emoji: string): Promise<CoupleCategory | null> => {
      if (!coupleId || !userId) return null;
      const id = await addCategory({
        coupleId,
        label,
        emoji,
        createdAt: Date.now(),
        createdBy: userId,
      });
      return { id, coupleId, label, emoji, createdAt: Date.now(), createdBy: userId };
    },
    [coupleId, userId]
  );

  const remove = useCallback(async (id: string) => {
    await deleteCategory(id);
  }, []);

  return { categories, loading, add, remove };
}
