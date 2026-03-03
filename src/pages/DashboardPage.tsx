import { Link } from 'react-router-dom';
import { ShoppingCart, BarChart3, ChevronRight } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useRunning } from '../hooks/useRunning';
import { useDataContext } from '../contexts/DataContext';
import { TodaySummary } from '../components/dashboard/TodaySummary';
import { PartnerStatus } from '../components/dashboard/PartnerStatus';
import { StreakHighlight } from '../components/dashboard/StreakHighlight';
import { RunningProgress } from '../components/dashboard/RunningProgress';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ChallengeCard } from '../components/dashboard/ChallengeCard';
import { ReceivedReactions } from '../components/dashboard/ReceivedReactions';
import { FloatingLoveNotes } from '../components/dashboard/LoveNotesCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ROUTES } from '../config/routes';

export function DashboardPage() {
  const { todayHabits, myHabits, todayProgress, partnerTodayLogs, loading: habitsLoading } = useHabits();
  const { bestStreak } = useStreaks();
  const { profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { progress } = useRunning();
  const { todos } = useDataContext();
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

  const pendingTodos = todos.filter((t) => !t.completed);

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
      <ReceivedReactions />
      {partnerName && <FloatingLoveNotes />}
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

      <StreakHighlight bestStreak={bestStreak} habits={myHabits} />

      {pendingTodos.length > 0 && (
        <Link to={ROUTES.SHARED} className="block">
          <div className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm hover:bg-surface-hover transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center shrink-0">
              <ShoppingCart size={20} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">Mandados pendientes</p>
              <p className="text-xs text-text-muted">
                {pendingTodos.length} {pendingTodos.length === 1 ? 'mandado por hacer' : 'mandados por hacer'}
              </p>
            </div>
            <span className="shrink-0 text-lg font-bold text-secondary">{pendingTodos.length}</span>
          </div>
        </Link>
      )}

      <Link to={ROUTES.INSIGHTS} className="block">
        <div className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm hover:bg-surface-hover transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Resumen mensual</p>
            <p className="text-xs text-text-muted">Estadísticas e insights del mes</p>
          </div>
          <ChevronRight size={18} className="text-text-muted shrink-0" />
        </div>
      </Link>

      <RunningProgress progress={progress} />

      <ChallengeCard />

      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
          Acciones rápidas
        </h3>
        <QuickActions />
      </div>
    </div>
  );
}
