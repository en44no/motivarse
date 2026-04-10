import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Flame,
  Star,
  Trophy,
} from 'lucide-react';
import { Card } from '../ui/Card';

interface StatsData {
  weeklyPercent: number;
  lastWeekPercent: number;
  bestDayName: string;
  bestDayPercent: number;
  perfectDays: number;
  currentStreak: number;
  longestStreak: number;
}

export function HabitStats({ stats }: { stats: StatsData }) {
  const weekDiff = stats.weeklyPercent - stats.lastWeekPercent;
  const TrendIcon =
    weekDiff > 0 ? TrendingUp : weekDiff < 0 ? TrendingDown : Minus;
  const trendColor =
    weekDiff > 0
      ? 'text-primary'
      : weekDiff < 0
        ? 'text-danger'
        : 'text-text-muted';
  const trendBg =
    weekDiff > 0
      ? 'bg-primary-soft'
      : weekDiff < 0
        ? 'bg-danger-soft'
        : 'bg-surface-light';

  return (
    <div className="space-y-3">
      {/* Weekly progress — hero card */}
      <Card className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) ${stats.weeklyPercent}%, transparent ${stats.weeklyPercent}%)`,
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Esta semana
            </p>
            <p className="text-3xl font-extrabold text-text-primary mt-1 tabular-nums">
              {stats.weeklyPercent}%
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold tabular-nums ${trendBg} ${trendColor}`}
            >
              <TrendIcon size={14} />
              {weekDiff > 0 ? '+' : ''}
              {weekDiff}%
            </div>
            <p className="text-2xs text-text-muted tabular-nums">
              vs semana pasada ({stats.lastWeekPercent}%)
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative mt-3 h-2 rounded-full bg-surface-light overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-500 ease-out"
            style={{ width: `${stats.weeklyPercent}%` }}
          />
        </div>
      </Card>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-warning-soft flex items-center justify-center shrink-0">
              <Star size={16} className="text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
                Mejor día
              </p>
              <p className="text-sm font-bold text-text-primary mt-0.5 truncate">
                {stats.bestDayName}
              </p>
              <p className="text-xs text-text-muted tabular-nums">
                {stats.bestDayPercent}%
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
                Días perfectos
              </p>
              <p className="text-sm font-bold text-text-primary mt-0.5 tabular-nums">
                {stats.perfectDays}
              </p>
              <p className="text-xs text-text-muted">este mes</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-secondary-soft flex items-center justify-center shrink-0">
              <Flame size={16} className="text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
                Racha actual
              </p>
              <p className="text-sm font-bold text-text-primary mt-0.5 tabular-nums">
                {stats.currentStreak} días
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
              <Trophy size={16} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
                Mejor racha
              </p>
              <p className="text-sm font-bold text-text-primary mt-0.5 tabular-nums">
                {stats.longestStreak} días
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
