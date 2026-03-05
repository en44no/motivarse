import { useState, useEffect } from 'react';
import { useCoupleContext } from '../contexts/CoupleContext';
import { subscribeToNotes } from '../services/notes.service';
import type { LoveNote } from '../types/notes';

let cachedNotes: LoveNote[] = [];
let listeners = 0;
let unsubscribe: (() => void) | null = null;
let currentCoupleId: string | null = null;

/**
 * Shared hook for love notes — single Firestore subscription
 * regardless of how many components consume it.
 */
export function useNotes(): LoveNote[] {
  const { couple } = useCoupleContext();
  const coupleId = couple?.coupleId || null;
  const [notes, setNotes] = useState<LoveNote[]>(cachedNotes);

  useEffect(() => {
    if (!coupleId) return;

    // If coupleId changed, tear down old subscription
    if (currentCoupleId !== coupleId) {
      unsubscribe?.();
      unsubscribe = null;
      cachedNotes = [];
      currentCoupleId = coupleId;
    }

    listeners++;

    // First listener creates the subscription
    if (!unsubscribe) {
      unsubscribe = subscribeToNotes(coupleId, (newNotes) => {
        cachedNotes = newNotes;
        // Notify all mounted hooks via window event
        window.dispatchEvent(new CustomEvent('notes-updated'));
      });
    }

    // Sync initial cached data
    setNotes(cachedNotes);

    function handleUpdate() {
      setNotes(cachedNotes);
    }
    window.addEventListener('notes-updated', handleUpdate);

    return () => {
      window.removeEventListener('notes-updated', handleUpdate);
      listeners--;
      if (listeners <= 0) {
        unsubscribe?.();
        unsubscribe = null;
        cachedNotes = [];
        currentCoupleId = null;
        listeners = 0;
      }
    };
  }, [coupleId]);

  return notes;
}
