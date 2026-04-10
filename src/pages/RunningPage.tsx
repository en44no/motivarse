import { useState, useMemo } from 'react';
import { Plus, Footprints } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRunning } from '../hooks/useRunning';
import { useCoupleContext } from '../contexts/CoupleContext';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { CacoWeekDetail } from '../components/running/CacoWeekDetail';
import { CacoPlanOverview } from '../components/running/CacoPlanOverview';
import { CompletedPlanCard } from '../components/running/CompletedPlanCard';
import { RunLogForm } from '../components/running/RunLogForm';
import { RunStatsCards } from '../components/running/RunStatsCards';
import { RunHistory } from '../components/running/RunHistory';
import { RunProgressChart } from '../components/running/RunProgressChart';

const TABS = [
  { id: 'plan', label: 'Plan CaCo' },
  { id: 'runs', label: 'Mis Carreras' },
  { id: 'stats', label: 'Estadísticas' },
];

export function RunningPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [showLogForm, setShowLogForm] = useState(false);
  const [defaultFreeRun, setDefaultFreeRun] = useState(false);
  const { couple } = useCoupleContext();
  const {
    cacoLogs,
    myFreeRuns,
    partnerFreeRuns,
    runLogs,
    progress,
    currentWeek,
    currentSession,
    currentPlan,
    isCompleted,
    loading,
    logRun,
  } = useRunning();
  const memberNames = couple?.memberNames || {};

  const allFreeRuns = useMemo(
    () =>
      [...myFreeRuns, ...partnerFreeRuns].sort((a, b) => (b.date > a.date ? 1 : -1)),
    [myFreeRuns, partnerFreeRuns],
  );

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  function openCacoForm() {
    setDefaultFreeRun(false);
    setShowLogForm(true);
  }

  function openFreeRunForm() {
    setDefaultFreeRun(true);
    setShowLogForm(true);
  }

  function handleTimerComplete() {
    toast.success('Sesión completada! 💪');
    openCacoForm();
  }

  return (
    <div className="space-y-4 py-4">
      <h1 className="sr-only">Correr</h1>
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'plan' && (
        <div className="space-y-5">
          {isCompleted ? (
            <CompletedPlanCard
              totalRuns={progress?.totalRuns || 0}
              totalDistanceKm={progress?.totalDistanceKm || 0}
            />
          ) : (
            <>
              {/* Hero: sesion actual + timer */}
              <CacoWeekDetail
                currentWeek={currentWeek}
                currentSession={currentSession}
                weekSessionsFromLogs={cacoLogs.filter((l) => l.cacoPlanWeek === currentWeek).length}
                onTimerComplete={handleTimerComplete}
              />

              {/* Secondary: registrar manual */}
              <Button
                onClick={openCacoForm}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Plus size={18} />
                Registrar sesión manualmente
              </Button>
            </>
          )}

          {/* Plan completo como referencia */}
          <CacoPlanOverview currentWeek={currentWeek} />

          {/* Historial de sesiones CaCo */}
          {cacoLogs.length > 0 && (
            <RunHistory
              logs={cacoLogs}
              title="Sesiones CaCo"
              memberNames={memberNames}
            />
          )}
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="space-y-4">
          <Button
            onClick={openFreeRunForm}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <Footprints size={18} />
            Registrar carrera libre
          </Button>

          {allFreeRuns.length > 0 ? (
            <RunHistory
              logs={allFreeRuns}
              title="Carreras libres"
              memberNames={memberNames}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="rounded-2xl border border-dashed border-border/60 bg-surface/40 py-12 px-4 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft ring-1 ring-accent/20">
                <Footprints size={26} className="text-accent" />
              </div>
              <p className="text-sm font-semibold text-text-secondary">
                Sin carreras libres
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Registrá tus carreras fuera del plan CaCo
              </p>
            </motion.div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          <RunStatsCards progress={progress} totalLogs={runLogs.length} />
          <RunProgressChart logs={runLogs} />
          <RunHistory
            logs={runLogs}
            title="Todo el historial"
            allowDelete
            memberNames={memberNames}
            showFilters
          />
        </div>
      )}

      <RunLogForm
        open={showLogForm}
        onClose={() => setShowLogForm(false)}
        onSubmit={logRun}
        suggestedDuration={currentPlan?.totalMinutes}
        defaultFreeRun={defaultFreeRun}
      />
    </div>
  );
}
