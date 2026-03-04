import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToWishlistCategories,
  addWishlistCategory,
  updateWishlistCategory,
  deleteWishlistCategory,
} from '../services/wishlist-category.service';
import type { CoupleCategory } from '../types/category';

export function useWishlistCategories() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [categories, setCategories] = useState<CoupleCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;

  useEffect(() => {
    if (!coupleId || !userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeToWishlistCategories(coupleId, (cats) => {
      setCategories(cats);
      setLoading(false);
    });

    return unsub;
  }, [coupleId, userId]);

  const add = useCallback(
    async (label: string, emoji: string): Promise<CoupleCategory | null> => {
      if (!coupleId || !userId) return null;
      const id = await addWishlistCategory({
        coupleId,
        label,
        emoji,
        createdAt: Date.now(),
        createdBy: userId,
      });
      return { id, coupleId, label, emoji, createdAt: Date.now(), createdBy: userId };
    },
    [coupleId, userId],
  );

  const update = useCallback(async (id: string, label: string, emoji: string) => {
    await updateWishlistCategory(id, label, emoji);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteWishlistCategory(id);
  }, []);

  return { categories, loading, add, update, remove };
}
