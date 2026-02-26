import { useState, useMemo } from 'react';
import { Plus, Footprints, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRunning } from '../hooks/useRunning';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { CacoWeekDetail } from '../components/running/CacoWeekDetail';
import { CacoPlanOverview } from '../components/running/CacoPlanOverview';
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
  const { myLogs, progress, currentWeek, currentSession, currentPlan, loading, logRun } = useRunning();

  const freeRunLogs = useMemo(() => myLogs.filter((l) => l.isFreeRun), [myLogs]);
  const cacoLogs = useMemo(() => myLogs.filter((l) => !l.isFreeRun), [myLogs]);

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
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'plan' && (
        <div className="space-y-4">
          <CacoWeekDetail
            currentWeek={currentWeek}
            currentSession={currentSession}
            onTimerComplete={handleTimerComplete}
          />

          <Button
            onClick={openCacoForm}
            className="w-full"
            size="lg"
          >
            <Plus size={18} />
            Registrar sesión CaCo
          </Button>

          <CacoPlanOverview currentWeek={currentWeek} />

          {cacoLogs.length > 0 && (
            <RunHistory logs={cacoLogs} title="Sesiones CaCo" />
          )}
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="space-y-4">
          <Button
            onClick={openFreeRunForm}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            <Footprints size={18} />
            Registrar carrera libre
          </Button>

          {freeRunLogs.length > 0 ? (
            <RunHistory logs={freeRunLogs} title="Carreras libres" />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Footprints size={28} className="text-accent" />
              </div>
              <p className="text-text-secondary font-medium mb-1">Sin carreras libres</p>
              <p className="text-text-muted text-sm">
                Registrá tus carreras fuera del plan CaCo
              </p>
            </motion.div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          <RunStatsCards progress={progress} totalLogs={myLogs.length} />
          <RunProgressChart logs={myLogs} />
          <RunHistory logs={myLogs} title="Todo el historial" />
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
