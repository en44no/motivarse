import { useEffect, useState } from 'react';
import { useCoupleContext } from '../contexts/CoupleContext';
import { subscribeToHabitLogs } from '../services/habits.service';
import { subscribeToRunProgress } from '../services/running.service';
import { getToday } from '../lib/date-utils';
import type { HabitLog } from '../types/habit';
import type { RunProgress } from '../types/running';

export function usePartner() {
  const { partnerId, partnerName, couple } = useCoupleContext();
  const [partnerTodayLogs, setPartnerTodayLogs] = useState<HabitLog[]>([]);
  const [partnerRunProgress, setPartnerRunProgress] = useState<RunProgress | null>(null);

  const coupleId = couple?.coupleId;

  useEffect(() => {
    if (!coupleId) return;
    const today = getToday();
    const unsub = subscribeToHabitLogs(coupleId, today, today, (logs) => {
      setPartnerTodayLogs(logs.filter((l) => l.userId === partnerId));
    });
    return unsub;
  }, [coupleId, partnerId]);

  useEffect(() => {
    if (!partnerId) return;
    const unsub = subscribeToRunProgress(partnerId, setPartnerRunProgress);
    return unsub;
  }, [partnerId]);

  const partnerCompletedToday = partnerTodayLogs.filter((l) => l.completed).length;

  return {
    partnerId,
    partnerName,
    partnerTodayLogs,
    partnerCompletedToday,
    partnerRunProgress,
  };
}
