import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useRunning } from '../hooks/useRunning';
import { TodaySummary } from '../components/dashboard/TodaySummary';
import { PartnerStatus } from '../components/dashboard/PartnerStatus';
import { StreakHighlight } from '../components/dashboard/StreakHighlight';
import { RunningProgress } from '../components/dashboard/RunningProgress';
import { QuickActions } from '../components/dashboard/QuickActions';
import { CardSkeleton } from '../components/ui/Skeleton';

export function DashboardPage() {
  const { todayHabits, todayProgress, partnerTodayLogs, loading: habitsLoading } = useHabits();
  const { bestStreak } = useStreaks();
  const { profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { progress } = useRunning();
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

  // Count unique habits completed by partner today
  const partnerCompletedToday = new Set(
    partnerTodayLogs.filter((l) => l.completed).map((l) => l.habitId)
  ).size;

  const completedCount = Math.round((todayProgress / 100) * todayHabits.length);

  if (habitsLoading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <TodaySummary
        progress={todayProgress}
        completedCount={completedCount}
        totalCount={todayHabits.length}
        soundEnabled={soundEnabled}
      />

      {partnerName && (
        <PartnerStatus
          partnerName={partnerName}
          completedCount={partnerCompletedToday}
          totalCount={todayHabits.length}
        />
      )}

      <StreakHighlight bestStreak={bestStreak} habits={todayHabits} />

      <RunningProgress progress={progress} />

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
          Acciones rápidas
        </h3>
        <QuickActions />
      </div>
    </div>
  );
}
