import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useRunning } from '../hooks/useRunning';
import { TodaySummary } from '../components/dashboard/TodaySummary';
import { MotivationalQuote } from '../components/dashboard/MotivationalQuote';
import { PartnerStatus } from '../components/dashboard/PartnerStatus';
import { StreakHighlight } from '../components/dashboard/StreakHighlight';
import { RunningProgress } from '../components/dashboard/RunningProgress';
import { QuickActions } from '../components/dashboard/QuickActions';
import { CardSkeleton } from '../components/ui/Skeleton';

export function DashboardPage() {
  const { myHabits, todayProgress, partnerTodayLogs, loading: habitsLoading } = useHabits();
  const { bestStreak } = useStreaks();
  const { partnerName } = useCoupleContext();
  const { progress } = useRunning();
  const partnerCompletedToday = partnerTodayLogs.filter((l) => l.completed).length;

  const completedCount = Math.round((todayProgress / 100) * myHabits.length);

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
        totalCount={myHabits.length}
      />

      <MotivationalQuote />

      {partnerName && (
        <PartnerStatus
          partnerName={partnerName}
          completedCount={partnerCompletedToday}
          totalCount={myHabits.length}
        />
      )}

      <StreakHighlight bestStreak={bestStreak} habits={myHabits} />

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
