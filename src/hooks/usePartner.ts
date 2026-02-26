import { useEffect, useState } from 'react';
import { useCoupleContext } from '../contexts/CoupleContext';
import { subscribeToRunProgress } from '../services/running.service';
import type { RunProgress } from '../types/running';

export function usePartner() {
  const { partnerId, partnerName } = useCoupleContext();
  const [partnerRunProgress, setPartnerRunProgress] = useState<RunProgress | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    const unsub = subscribeToRunProgress(partnerId, setPartnerRunProgress);
    return unsub;
  }, [partnerId]);

  return {
    partnerId,
    partnerName,
    partnerRunProgress,
  };
}
