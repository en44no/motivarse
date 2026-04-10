import { TrendingUp, Footprints, Flame, Calendar } from 'lucide-react';
import type { RunProgress } from '../../types/running';
import { CACO_PLAN } from '../../lib/caco-plan';

interface RunStatsCardsProps {
  progress: RunProgress | null;
  totalLogs: number;
}

interface StatDef {
  icon: typeof Footprints;
  label: string;
  value: string | number;
  accent: 'primary' | 'secondary' | 'accent' | 'info';
}

const accentMap: Record<StatDef['accent'], { text: string; bg: string; ring: string }> = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary-soft',
    ring: 'ring-primary/20',
  },
  secondary: {
    text: 'text-secondary',
    bg: 'bg-secondary-soft',
    ring: 'ring-secondary/20',
  },
  accent: {
    text: 'text-accent',
    bg: 'bg-accent-soft',
    ring: 'ring-accent/20',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info-soft',
    ring: 'ring-info/20',
  },
};

export function RunStatsCards({ progress, totalLogs: _totalLogs }: RunStatsCardsProps) {
  const stats: StatDef[] = [
    {
      icon: Footprints,
      label: 'Carreras',
      value: progress?.totalRuns || 0,
      accent: 'primary',
    },
    {
      icon: TrendingUp,
      label: 'Km totales',
      value: (progress?.totalDistanceKm || 0).toFixed(1),
      accent: 'info',
    },
    {
      icon: Flame,
      label: 'Racha',
      value: progress?.runStreak || 0,
      accent: 'secondary',
    },
    {
      icon: Calendar,
      label: 'Semana',
      value: `${progress?.currentWeek || 1}/${CACO_PLAN.length}`,
      accent: 'accent',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => {
        const accent = accentMap[stat.accent];
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-surface p-3.5 shadow-sm transition-colors duration-150 hover:border-border-light"
          >
            <div
              className={`mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent.bg} ${accent.ring}`}
            >
              <stat.icon size={16} className={accent.text} />
            </div>
            <p className="text-2xl font-bold tabular-nums text-text-primary leading-none">
              {stat.value}
            </p>
            <p className="mt-1.5 text-2xs uppercase tracking-wide text-text-muted">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
