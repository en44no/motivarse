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
  const { profile } = useAuthContext();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.coupleId) {
      setCouple(null);
      setLoading(false);
      return;
    }
    const unsub = subscribeToCouple(profile.coupleId, (c) => {
      setCouple(c);
      setLoading(false);
    });
    return unsub;
  }, [profile?.coupleId]);

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
