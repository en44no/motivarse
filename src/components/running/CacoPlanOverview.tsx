import { CacoSessionCard } from './CacoSessionCard';
import { ProgressBar } from '../ui/ProgressBar';
import { CACO_PLAN, getWeekProgress } from '../../lib/caco-plan';

interface CacoPlanOverviewProps {
  currentWeek: number;
}

export function CacoPlanOverview({ currentWeek }: CacoPlanOverviewProps) {
  const overallProgress = getWeekProgress(currentWeek);

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-text-primary">Progreso general</h3>
          <span className="text-sm font-mono font-bold text-primary">{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} color="primary" size="md" />
        <p className="text-xs text-text-muted mt-2">
          Semana {currentWeek} de {CACO_PLAN.length} · {CACO_PLAN.length - currentWeek} semanas restantes
        </p>
      </div>

      <div className="space-y-2">
        {CACO_PLAN.map((week) => (
          <CacoSessionCard
            key={week.week}
            week={week}
            isCurrent={week.week === currentWeek}
            isCompleted={week.week < currentWeek}
            isLocked={week.week > currentWeek + 1}
          />
        ))}
      </div>
    </div>
  );
}
