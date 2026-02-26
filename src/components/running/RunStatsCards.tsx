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
      color: 'text-primary',
      bgColor: 'bg-gradient-to-br from-primary/15 to-primary/5',
    },
    {
      icon: TrendingUp,
      label: 'Km totales',
      value: (progress?.totalDistanceKm || 0).toFixed(1),
      color: 'text-secondary',
      bgColor: 'bg-gradient-to-br from-secondary/15 to-secondary/5',
    },
    {
      icon: Flame,
      label: 'Racha',
      value: progress?.runStreak || 0,
      color: 'text-secondary',
      bgColor: 'bg-gradient-to-br from-secondary/15 to-secondary/5',
    },
    {
      icon: Calendar,
      label: 'Semana',
      value: `${progress?.currentWeek || 1}/11`,
      color: 'text-accent',
      bgColor: 'bg-gradient-to-br from-accent/15 to-accent/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-2xl border border-border p-3 shadow-sm border-t-white/[0.04]">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.bgColor}`}>
            <stat.icon size={16} className={stat.color} />
          </div>
          <p className="text-lg font-bold font-mono text-text-primary">{stat.value}</p>
          <p className="text-[11px] text-text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
