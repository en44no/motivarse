import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { addRunLog, updateRunProgress } from '../services/running.service';
import { CACO_PLAN, SESSIONS_PER_WEEK } from '../lib/caco-plan';
import { getToday } from '../lib/date-utils';

export function useRunning() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const { runLogs, runProgress: progress, loading } = useDataContext();
  const migratedRef = useRef(false);

  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid;

  // CaCo sessions are always shared — show ALL couple's CaCo logs
  const cacoLogs = runLogs.filter((l) => !l.isFreeRun);
  // Free runs: own runs
  const myFreeRuns = runLogs.filter((l) => l.isFreeRun && l.userId === userId);
  // Free runs: partner's shared runs
  const partnerFreeRuns = runLogs.filter((l) => l.isFreeRun && l.userId !== userId && l.isSharedRun);
  // Legacy: all my logs (for backward compat)
  const myLogs = runLogs.filter((l) => l.userId === userId);
  const partnerLogs = runLogs.filter((l) => l.userId !== userId);

  // One-time migration: compute progress from existing cacoLogs if no shared doc exists
  useEffect(() => {
    if (migratedRef.current || loading || !coupleId || progress || cacoLogs.length === 0) return;
    migratedRef.current = true;

    // Find the latest CaCo session to determine current progress
    const sorted = [...cacoLogs].sort((a, b) => (b.date > a.date ? 1 : -1));
    const latest = sorted[0];
    const lastWeek = latest.cacoPlanWeek || 1;
    const lastSession = latest.cacoPlanSession || 1;

    // Advance one session from the last logged one
    let nextWeek = lastWeek;
    let nextSession = lastSession + 1;
    if (nextSession > SESSIONS_PER_WEEK) {
      nextSession = 1;
      nextWeek = Math.min(lastWeek + 1, CACO_PLAN.length + 1);
    }

    const totalDistance = runLogs.reduce((sum, l) => sum + (l.distanceKm || 0), 0);

    updateRunProgress(coupleId, {
      currentWeek: nextWeek,
      currentSession: nextSession,
      totalRuns: runLogs.length,
      totalDistanceKm: totalDistance,
      lastRunDate: latest.date,
    }).catch(() => {});
  }, [loading, coupleId, progress, cacoLogs, runLogs]);

  // Clamp currentWeek to valid range
  const rawWeek = progress?.currentWeek || 1;
  const currentWeek = Math.min(Math.max(rawWeek, 1), CACO_PLAN.length);
  const currentSession = progress?.currentSession || 1;
  const currentPlan = CACO_PLAN[currentWeek - 1] || CACO_PLAN[CACO_PLAN.length - 1];

  // Plan is completed when week exceeds plan length, or week === length and all sessions done
  const isCompleted = rawWeek > CACO_PLAN.length ||
    (rawWeek === CACO_PLAN.length && currentSession > SESSIONS_PER_WEEK);

  // Calculate run streak from logs
  const runStreak = (() => {
    if (myLogs.length === 0) return 0;
    const dates = [...new Set(myLogs.map((l) => l.date))].sort().reverse();
    const today = getToday();
    if (dates[0] !== today) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) { // Weekly streak: ran within the last 7 days counts
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

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

    try {
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
          nextWeek = Math.min(currentWeek + 1, CACO_PLAN.length + 1);
        }

        await updateRunProgress(coupleId, {
          currentWeek: nextWeek,
          currentSession: nextSession,
          totalRuns: (progress?.totalRuns || 0) + 1,
          totalDistanceKm: (progress?.totalDistanceKm || 0) + (data.distanceKm || 0),
          lastRunDate: getToday(),
        });
      } else {
        // Free runs still count toward total stats but don't advance the plan
        await updateRunProgress(coupleId, {
          currentWeek: rawWeek,
          currentSession,
          totalRuns: (progress?.totalRuns || 0) + 1,
          totalDistanceKm: (progress?.totalDistanceKm || 0) + (data.distanceKm || 0),
          lastRunDate: getToday(),
        });
      }

      toast.success('Carrera registrada!');
    } catch (error) {
      toast.error('No se pudo registrar la carrera. Intenta de nuevo.');
    }
  }

  return {
    runLogs,
    myLogs,
    partnerLogs,
    cacoLogs,
    myFreeRuns,
    partnerFreeRuns,
    progress,
    currentWeek,
    currentSession,
    currentPlan,
    isCompleted,
    runStreak,
    loading,
    logRun,
  };
}
