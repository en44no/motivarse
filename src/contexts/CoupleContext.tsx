import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { profile, loading: authLoading } = useAuthContext();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish before making any decisions
    if (authLoading) return;

    // Profile loaded but no coupleId → user genuinely has no couple
    if (!profile?.coupleId) {
      setCouple(null);
      setLoading(false);
      return;
    }

    // Have coupleId → subscribe
    let didRespond = false;
    const timeout = setTimeout(() => {
      if (!didRespond) setLoading(false);
    }, 4000);
    const unsub = subscribeToCouple(profile.coupleId, (c) => {
      didRespond = true;
      clearTimeout(timeout);
      setCouple(c);
      setLoading(false);
    });
    return () => { clearTimeout(timeout); unsub(); };
  }, [profile?.coupleId, authLoading]);

  const partnerId = profile?.partnerId || null;
  const partnerName = couple && profile
    ? couple.memberNames[partnerId || ''] || 'Pareja'
    : '';

  return (
    <CoupleContext.Provider value={{ couple, partnerId, partnerName, loading }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCoupleContext() {
  return useContext(CoupleContext);
}
