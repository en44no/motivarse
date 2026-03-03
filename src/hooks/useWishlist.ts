import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import {
  subscribeToWishlist,
  addWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
} from '../services/wishlist.service';
import type { WishlistItem, WishlistCategory } from '../types/wishlist';

export function useWishlist() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = couple?.coupleId || null;

  useEffect(() => {
    if (!coupleId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToWishlist(coupleId, (data) => {
      setItems(data);
      setLoading(false);
    });

    return () => unsub();
  }, [coupleId]);

  const pending = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  const add = useCallback(
    async (title: string, category: WishlistCategory, description?: string) => {
      if (!user || !coupleId) return;
      try {
        await addWishlistItem({
          coupleId,
          title,
          category,
          completed: false,
          createdBy: user.uid,
          createdAt: Date.now(),
          ...(description ? { description } : {}),
        });
      } catch (error) {
        console.error('Error adding wishlist item:', error);
        toast.error('No se pudo agregar el deseo.');
      }
    },
    [user, coupleId],
  );

  const toggle = useCallback(
    async (id: string, completed: boolean) => {
      if (!user) return;
      try {
        await updateWishlistItem(id, {
          completed,
          ...(completed
            ? { completedBy: user.uid, completedAt: Date.now() }
            : { completedBy: undefined, completedAt: undefined }),
        });
      } catch (error) {
        console.error('Error toggling wishlist item:', error);
        toast.error('No se pudo actualizar el deseo.');
      }
    },
    [user],
  );

  const remove = useCallback(async (id: string) => {
    try {
      await deleteWishlistItem(id);
    } catch (error) {
      console.error('Error removing wishlist item:', error);
      toast.error('No se pudo eliminar el deseo.');
    }
  }, []);

  return { items, pending, completed, loading, add, toggle, remove };
}
