import { CacoSessionCard } from './CacoSessionCard';
import { ProgressBar } from '../ui/ProgressBar';
import { CACO_PLAN, getWeekProgress } from '../../lib/caco-plan';

interface CacoPlanOverviewProps {
  currentWeek: number;
}

export function CacoPlanOverview({ currentWeek }: CacoPlanOverviewProps) {
  const overallProgress = getWeekProgress(currentWeek);
  const weeksLeft = Math.max(CACO_PLAN.length - currentWeek, 0);

  return (
    <section className="space-y-4" aria-label="Plan CaCo completo">
      <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xs uppercase tracking-wide text-text-muted">
              Progreso del plan
            </p>
            <h3 className="mt-1 text-base font-semibold text-text-primary">
              Semana {currentWeek} de {CACO_PLAN.length}
            </h3>
          </div>
          <span className="text-2xl font-bold tabular-nums text-primary leading-none">
            {overallProgress}%
          </span>
        </div>
        <ProgressBar value={overallProgress} color="primary" size="md" />
        <p className="mt-2 text-xs text-text-muted">
          {weeksLeft === 0
            ? '¡Ultima semana del plan!'
            : `${weeksLeft} ${weeksLeft === 1 ? 'semana restante' : 'semanas restantes'}`}
        </p>
      </div>

      <div>
        <p className="mb-2 px-1 text-2xs font-semibold uppercase tracking-wide text-text-muted">
          Todas las semanas
        </p>
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
    </section>
  );
}
