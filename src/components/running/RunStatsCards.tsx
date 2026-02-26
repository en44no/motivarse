import { TrendingUp, Footprints, Flame, Calendar } from 'lucide-react';
import type { RunProgress } from '../../types/running';

interface RunStatsCardsProps {
  progress: RunProgress | null;
  totalLogs: number;
}

export function RunStatsCards({ progress, totalLogs }: RunStatsCardsProps) {
  const stats = [
    {
      icon: Footprints,
      label: 'Carreras',
      value: progress?.totalRuns || 0,
      color: 'text-primary bg-primary-soft',
    },
    {
      icon: TrendingUp,
      label: 'Km totales',
      value: (progress?.totalDistanceKm || 0).toFixed(1),
      color: 'text-secondary bg-secondary-soft',
    },
    {
      icon: Flame,
      label: 'Racha',
      value: progress?.runStreak || 0,
      color: 'text-secondary bg-secondary-soft',
    },
    {
      icon: Calendar,
      label: 'Semana',
      value: `${progress?.currentWeek || 1}/11`,
      color: 'text-accent bg-accent-soft',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-2xl border border-border p-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
            <stat.icon size={16} />
          </div>
          <p className="text-lg font-bold font-mono text-text-primary">{stat.value}</p>
          <p className="text-[11px] text-text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
