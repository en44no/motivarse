import { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  subscribeToRunLogs,
  subscribeToRunProgress,
  addRunLog,
  updateRunProgress,
} from '../services/running.service';
import { CACO_PLAN, SESSIONS_PER_WEEK } from '../lib/caco-plan';
import { getToday } from '../lib/date-utils';
import type { RunLog, RunProgress } from '../types/running';

export function useRunning() {
  const { user, profile } = useAuthContext();
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const coupleId = profile?.coupleId || user?.uid || null;
  const userId = user?.uid;

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }
    let didRespond = false;
    const timeout = setTimeout(() => {
      if (!didRespond) setLoading(false);
    }, 5000);
    const unsub = subscribeToRunLogs(coupleId, (logs) => {
      didRespond = true;
      clearTimeout(timeout);
      setRunLogs(logs);
      setLoading(false);
    });
    return () => { clearTimeout(timeout); unsub(); };
  }, [coupleId]);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToRunProgress(userId, setProgress);
    return unsub;
  }, [userId]);

  const myLogs = runLogs.filter((l) => l.userId === userId);
  const partnerLogs = runLogs.filter((l) => l.userId !== userId);

  const currentWeek = progress?.currentWeek || 1;
  const currentSession = progress?.currentSession || 1;
  const currentPlan = CACO_PLAN[currentWeek - 1];

  async function logRun(data: {
    durationMinutes: number;
    distanceKm?: number;
    mood: 1 | 2 | 3 | 4 | 5;
    note?: string;
    paceMinKm?: string;
    isFreeRun?: boolean;
    isSharedRun?: boolean;
  }) {
    if (!userId || !coupleId) return;

    const isFree = !!data.isFreeRun;

    await addRunLog({
      userId,
      coupleId,
      date: getToday(),
      cacoPlanWeek: isFree ? undefined : currentWeek,
      cacoPlanSession: isFree ? undefined : currentSession,
      durationMinutes: data.durationMinutes,
      distanceKm: data.distanceKm,
      paceMinKm: data.paceMinKm,
      isFreeRun: isFree || undefined,
      isSharedRun: isFree ? (data.isSharedRun ?? true) : true,
      mood: data.mood,
      note: data.note,
      intervals: isFree ? undefined : (currentPlan ? {
        runMinutes: currentPlan.runMinutes,
        walkMinutes: currentPlan.walkMinutes,
        repetitions: currentPlan.repetitions,
      } : undefined),
      createdAt: Date.now(),
    });

    // Only advance CaCo plan progress for non-free runs
    if (!isFree) {
      let nextWeek = currentWeek;
      let nextSession = currentSession + 1;
      if (nextSession > SESSIONS_PER_WEEK) {
        nextSession = 1;
        nextWeek = Math.min(currentWeek + 1, CACO_PLAN.length);
      }

      await updateRunProgress(userId, {
        currentWeek: nextWeek,
        currentSession: nextSession,
        totalRuns: (progress?.totalRuns || 0) + 1,
        totalDistanceKm: (progress?.totalDistanceKm || 0) + (data.distanceKm || 0),
        lastRunDate: getToday(),
      });
    } else {
      // Free runs still count toward total stats but don't advance the plan
      await updateRunProgress(userId, {
        currentWeek,
        currentSession,
        totalRuns: (progress?.totalRuns || 0) + 1,
        totalDistanceKm: (progress?.totalDistanceKm || 0) + (data.distanceKm || 0),
        lastRunDate: getToday(),
      });
    }
  }

  return {
    runLogs,
    myLogs,
    partnerLogs,
    progress,
    currentWeek,
    currentSession,
    currentPlan,
    loading,
    logRun,
  };
}
