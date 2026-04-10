import { useMemo } from 'react';
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
import { ReceivedReactions } from '../components/dashboard/ReceivedReactions';
import { FloatingLoveNotes } from '../components/dashboard/FloatingLoveNotes';
import { Card } from '../components/ui/Card';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ROUTES } from '../config/routes';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 px-1 text-2xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </h3>
  );
}

export function DashboardPage() {
  const {
    todayHabits,
    myHabits,
    todayProgress,
    partnerTodayLogs,
    loading: habitsLoading,
  } = useHabits();
  const { bestStreak } = useStreaks();
  const { profile } = useAuthContext();
  const { partnerName } = useCoupleContext();
  const { progress } = useRunning();
  const { todos } = useDataContext();
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

  const pendingTodos = useMemo(() => todos.filter((t) => !t.completed), [todos]);

  // Count unique habits completed by partner today
  const partnerCompletedToday = useMemo(
    () => new Set(partnerTodayLogs.filter((l) => l.completed).map((l) => l.habitId)).size,
    [partnerTodayLogs],
  );

  const completedCount = Math.round((todayProgress / 100) * todayHabits.length);
  const hasStreak = !!bestStreak && bestStreak.currentStreak > 0;

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
    <div className="space-y-6 py-4">
      <h1 className="sr-only">Dashboard</h1>

      {/* Floating/overlay layers — don't break flow */}
      <FloatingLoveNotes />
      <ReceivedReactions />

      {/* Hero: progreso del dia */}
      <TodaySummary
        progress={todayProgress}
        completedCount={completedCount}
        totalCount={todayHabits.length}
        soundEnabled={soundEnabled}
      />

      {/* Pareja + racha: contexto emocional */}
      {(partnerName || hasStreak) && (
        <section className="space-y-3">
          {partnerName && (
            <PartnerStatus
              partnerName={partnerName}
              completedCount={partnerCompletedToday}
              totalCount={todayHabits.length}
            />
          )}
          <StreakHighlight bestStreak={bestStreak} habits={myHabits} />
        </section>
      )}

      {/* Entry points: navegacion a otras secciones */}
      <section className="space-y-3">
        <SectionLabel>Explorar</SectionLabel>

        {pendingTodos.length > 0 && (
          <Link to={ROUTES.SHARED} className="block">
            <Card variant="interactive" className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-light">
                <ShoppingCart size={20} className="text-text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  Mandados pendientes
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {pendingTodos.length === 1
                    ? '1 pendiente por hacer'
                    : `${pendingTodos.length} pendientes por hacer`}
                </p>
              </div>
              <span className="shrink-0 text-xl font-bold tabular-nums text-text-primary">
                {pendingTodos.length}
              </span>
              <ChevronRight size={18} className="shrink-0 text-text-muted" />
            </Card>
          </Link>
        )}

        <Link to={ROUTES.INSIGHTS} className="block">
          <Card variant="interactive" className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-light">
              <BarChart3 size={20} className="text-text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">Resumen mensual</p>
              <p className="mt-0.5 text-xs text-text-muted">
                Estadísticas e insights del mes
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </Card>
        </Link>

        <RunningProgress progress={progress} />
      </section>

      {/* Quick actions */}
      <section>
        <SectionLabel>Acciones rápidas</SectionLabel>
        <QuickActions />
      </section>
    </div>
  );
}
