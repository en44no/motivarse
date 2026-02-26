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
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Footprints size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">Método CaCo</p>
          <p className="text-xs text-text-muted">Semana {week} de {CACO_PLAN.length}</p>
        </div>
        <ChevronRight size={18} className="text-text-muted" />
      </div>
      <ProgressBar value={overallProgress} color="primary" showLabel />
      {plan && (
        <p className="text-xs text-text-muted mt-2">{plan.description}</p>
      )}
    </Card>
  );
}
