import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { subscribeToCouple } from '../services/user.service';
import type { Couple } from '../types/user';

interface CoupleContextType {
  couple: Couple | null;
  partnerId: string | null;
  partnerName: string;
  loading: boolean;
}

const CoupleContext = createContext<CoupleContextType>({
  couple: null,
  partnerId: null,
  partnerName: '',
  loading: true,
});

const COUPLE_CACHE_KEY = 'gestionarse_couple_cache';

function getCachedCouple(): Couple | null {
  try {
    const raw = localStorage.getItem(COUPLE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedCouple(couple: Couple | null) {
  try {
    if (couple) localStorage.setItem(COUPLE_CACHE_KEY, JSON.stringify(couple));
    else localStorage.removeItem(COUPLE_CACHE_KEY);
  } catch { /* ignore */ }
}

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuthContext();
  const [couple, setCouple] = useState<Couple | null>(getCachedCouple);
  const [loading, setLoading] = useState(() => !getCachedCouple());

  const userId = user?.uid || null;
  const coupleId = profile?.coupleId || null;

  useEffect(() => {
    // Wait for auth to finish before making any decisions
    if (authLoading) return;

    // No user = logged out → clear everything including cache
    if (!userId) {
      setCouple(null);
      setCachedCouple(null);
      setLoading(false);
      return;
    }

    // User exists but profile not loaded yet → keep cached couple, stay patient
    if (!profile) {
      setLoading(false);
      return;
    }

    // Profile loaded but no coupleId → user genuinely has no couple
    if (!coupleId) {
      setCouple(null);
      setCachedCouple(null);
      setLoading(false);
      return;
    }

    // Have coupleId → subscribe
    let didRespond = false;
    const timeout = setTimeout(() => {
      if (!didRespond) setLoading(false);
    }, 4000);
    const unsub = subscribeToCouple(coupleId, (c) => {
      didRespond = true;
      clearTimeout(timeout);
      setCouple(c);
      setCachedCouple(c);
      setLoading(false);
    });
    return () => { clearTimeout(timeout); unsub(); };
  }, [userId, coupleId, authLoading]);

  const partnerId = profile?.partnerId || null;
  const partnerName = couple && profile
    ? couple.memberNames[partnerId || ''] || 'Pareja'
    : '';

  const value = useMemo(() => ({ couple, partnerId, partnerName, loading }), [couple, partnerId, partnerName, loading]);

  return (
    <CoupleContext.Provider value={value}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCoupleContext() {
  return useContext(CoupleContext);
}
