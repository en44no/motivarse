import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { subscribeToAchievements, unlockAchievement } from '../services/achievements.service';
import { subscribeToJournalEntries } from '../services/journal.service';
import { ACHIEVEMENT_DEFINITIONS } from '../config/constants';
import type { Achievement, AchievementDef } from '../types/shared';

interface AchievementEvalContext {
  totalHabitLogs: number;
  bestStreak: number;
  myRunLogs: number;
  best5k: boolean;
  totalDistanceKm: number;
  cacoComplete: boolean;
  journalCount: number;
  completedTodos: number;
  coupleHabitSync: boolean;
  coupleRunSync: boolean;
  hasUsedAllSections: boolean;
}

function evaluateCondition(condition: string, ctx: AchievementEvalContext): boolean {
  switch (condition) {
    case 'complete_1_habit':
      return ctx.totalHabitLogs >= 1;
    case 'complete_10_habits':
      return ctx.totalHabitLogs >= 10;
    case 'complete_50_habits':
      return ctx.totalHabitLogs >= 50;
    case 'complete_100_habits':
      return ctx.totalHabitLogs >= 100;
    case 'streak_7':
      return ctx.bestStreak >= 7;
    case 'streak_14':
      return ctx.bestStreak >= 14;
    case 'streak_30':
      return ctx.bestStreak >= 30;
    case 'first_run':
      return ctx.myRunLogs >= 1;
    case 'run_5k':
      return ctx.best5k;
    case 'total_42k':
      return ctx.totalDistanceKm >= 42;
    case 'caco_complete':
      return ctx.cacoComplete;
    case 'first_journal':
      return ctx.journalCount >= 1;
    case 'journal_7':
      return ctx.journalCount >= 7;
    case 'journal_30':
      return ctx.journalCount >= 30;
    case 'both_complete_day':
      return ctx.coupleHabitSync;
    case 'couple_streak_7':
      // Simplified: reuse coupleHabitSync (both completed today) + best streak >= 7
      return ctx.coupleHabitSync && ctx.bestStreak >= 7;
    case 'couple_same_day_run':
      return ctx.coupleRunSync;
    case 'shared_todos_10':
      return ctx.completedTodos >= 10;
    case 'use_all_sections':
      return ctx.hasUsedAllSections;
    default:
      return false;
  }
}

/** Progress value 0-1 for an achievement, or null if not applicable */
export function getProgress(condition: string, ctx: AchievementEvalContext): number | null {
  switch (condition) {
    case 'complete_1_habit':
      return Math.min(ctx.totalHabitLogs / 1, 1);
    case 'complete_10_habits':
      return Math.min(ctx.totalHabitLogs / 10, 1);
    case 'complete_50_habits':
      return Math.min(ctx.totalHabitLogs / 50, 1);
    case 'complete_100_habits':
      return Math.min(ctx.totalHabitLogs / 100, 1);
    case 'streak_7':
      return Math.min(ctx.bestStreak / 7, 1);
    case 'streak_14':
      return Math.min(ctx.bestStreak / 14, 1);
    case 'streak_30':
      return Math.min(ctx.bestStreak / 30, 1);
    case 'first_run':
      return Math.min(ctx.myRunLogs / 1, 1);
    case 'total_42k':
      return Math.min(ctx.totalDistanceKm / 42, 1);
    case 'first_journal':
      return Math.min(ctx.journalCount / 1, 1);
    case 'journal_7':
      return Math.min(ctx.journalCount / 7, 1);
    case 'journal_30':
      return Math.min(ctx.journalCount / 30, 1);
    case 'shared_todos_10':
      return Math.min(ctx.completedTodos / 10, 1);
    default:
      return null;
  }
}

export function useAchievements() {
  const { user, profile } = useAuthContext();
  const { couple, partnerId } = useCoupleContext();
  const { habitLogs, streaks, runLogs, runProgress, todos } = useDataContext();

  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState<AchievementDef | null>(null);
  const [journalCount, setJournalCount] = useState(0);

  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid || null;

  // Track which achievements we've already processed to avoid re-firing unlock animation
  const processedRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Subscribe to unlocked achievements from Firestore
  useEffect(() => {
    if (!coupleId) return;
    const unsub = subscribeToAchievements(coupleId, (achievements) => {
      setUnlockedAchievements(achievements);
      // Mark all existing achievements as processed on initial load
      if (initialLoadRef.current) {
        achievements.forEach((a) => processedRef.current.add(a.achievementId));
        initialLoadRef.current = false;
      }
    });
    return unsub;
  }, [coupleId]);

  // Subscribe to journal entry count
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToJournalEntries(userId, (entries) => {
      setJournalCount(entries.length);
    });
    return unsub;
  }, [userId]);

  // Build evaluation context
  const evalCtx = useMemo((): AchievementEvalContext => {
    const myLogs = habitLogs.filter((l) => l.userId === userId && l.completed);
    const bestStreak = streaks.reduce(
      (best, s) => Math.max(best, s.currentStreak, s.longestStreak),
      0
    );

    const myRunLogs = runLogs.filter((l) => l.userId === userId);
    const best5k = myRunLogs.some((l) => (l.distanceKm || 0) >= 5);
    const totalDistanceKm = runProgress?.totalDistanceKm || 0;

    const rawWeek = runProgress?.currentWeek || 1;
    const cacoComplete = rawWeek > 11;

    const completedTodos = todos.filter((t) => t.completed).length;

    // Couple habit sync: check if both users completed all habits today
    let coupleHabitSync = false;
    if (partnerId) {
      const today = new Date().toISOString().slice(0, 10);
      const todayMyLogs = habitLogs.filter(
        (l) => l.date === today && l.userId === userId && l.completed
      );
      const todayPartnerLogs = habitLogs.filter(
        (l) => l.date === today && l.userId === partnerId && l.completed
      );
      coupleHabitSync = todayMyLogs.length > 0 && todayPartnerLogs.length > 0;
    }

    // Couple run sync: both ran on same day
    let coupleRunSync = false;
    if (partnerId) {
      const myRunDates = new Set(runLogs.filter((l) => l.userId === userId).map((l) => l.date));
      coupleRunSync = runLogs.some(
        (l) => l.userId === partnerId && myRunDates.has(l.date)
      );
    }

    // Explorer: check if user has data in habits, running, journal, todos
    const hasUsedAllSections =
      myLogs.length > 0 &&
      myRunLogs.length > 0 &&
      journalCount > 0 &&
      todos.length > 0;

    return {
      totalHabitLogs: myLogs.length,
      bestStreak,
      myRunLogs: myRunLogs.length,
      best5k,
      totalDistanceKm,
      cacoComplete,
      journalCount,
      completedTodos,
      coupleHabitSync,
      coupleRunSync,
      hasUsedAllSections,
    };
  }, [habitLogs, streaks, runLogs, runProgress, todos, journalCount, userId, partnerId]);

  // Evaluate and unlock achievements
  const checkAndUnlock = useCallback(() => {
    if (!coupleId || !userId) return;

    const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievementId));

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked in Firestore
      if (unlockedIds.has(def.id)) continue;

      // Check if condition is met
      if (!evaluateCondition(def.condition, evalCtx)) continue;

      // Skip if already processed (avoid duplicate writes)
      if (processedRef.current.has(def.id)) continue;
      processedRef.current.add(def.id);

      // Unlock in Firestore (fire-and-forget)
      unlockAchievement(coupleId, def.id, userId, def.name, def.description, def.icon, def.type)
        .catch(() => {});

      // Show animation for the first new one found
      setNewAchievement(def);
      break; // Only show one at a time
    }
  }, [coupleId, userId, unlockedAchievements, evalCtx]);

  // Run evaluation when context changes (but not on initial load)
  useEffect(() => {
    if (initialLoadRef.current) return;
    checkAndUnlock();
  }, [checkAndUnlock]);

  const dismissNewAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  return {
    unlockedAchievements,
    newAchievement,
    dismissNewAchievement,
    evalCtx,
  };
}
