import { Footprints, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { CACO_PLAN, getWeekProgress } from '../../lib/caco-plan';
import { ROUTES } from '../../config/routes';
import type { RunProgress } from '../../types/running';

interface RunningProgressProps {
  progress: RunProgress | null;
}

export function RunningProgress({ progress }: RunningProgressProps) {
  const navigate = useNavigate();
  const week = progress?.currentWeek || 1;
  const plan = CACO_PLAN[week - 1];
  const overallProgress = getWeekProgress(week);

  return (
    <Card variant="interactive" onClick={() => navigate(ROUTES.RUNNING)}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
          <Footprints size={20} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
            Método CaCo
          </p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            Semana {week} de {CACO_PLAN.length}
          </p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-text-muted" />
      </div>

      <div className="mt-4">
        <ProgressBar value={overallProgress} color="primary" showLabel />
      </div>

      {plan?.description && (
        <p className="mt-2 text-xs text-text-muted leading-snug">{plan.description}</p>
      )}
    </Card>
  );
}
