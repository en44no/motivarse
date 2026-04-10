import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trophy, BookOpen, Flame, Footprints, Sparkles, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMonthlyInsights } from '../hooks/useMonthlyInsights';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/ui/Card';
import { IconButton } from '../components/ui/IconButton';
import { cn } from '../lib/utils';
import { MOOD_OPTIONS } from '../config/constants';

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.2, ease: 'easeOut' },
  }),
};

// Read live CSS variables so charts match current theme
function useThemeColors() {
  const { currentTheme } = useTheme();
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        primary: '#22c55e',
        accent: '#8b5cf6',
        warning: '#f59e0b',
        danger: '#ef4444',
        surface: '#1a2332',
        border: '#2a3a50',
        textMuted: '#8fa5be',
        textSecondary: '#94a3b8',
        textPrimary: '#f1f5f9',
      };
    }
    const root = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
      root.getPropertyValue(name).trim() || fallback;
    return {
      primary: read('--color-primary', '#22c55e'),
      accent: read('--color-accent', '#8b5cf6'),
      warning: read('--color-warning', '#f59e0b'),
      danger: read('--color-danger', '#ef4444'),
      surface: read('--color-surface', '#1a2332'),
      border: read('--color-border', '#2a3a50'),
      textMuted: read('--color-text-muted', '#8fa5be'),
      textSecondary: read('--color-text-secondary', '#94a3b8'),
      textPrimary: read('--color-text-primary', '#f1f5f9'),
    };
    // recompute when theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme.id]);
}

export function MonthlyInsightsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { partnerName } = useCoupleContext();
  const colors = useThemeColors();

  const insights = useMonthlyInsights(year, month);

  const getBarColor = useCallback((percent: number) => {
    if (percent >= 80) return colors.primary;
    if (percent >= 50) return colors.warning;
    return colors.danger;
  }, [colors]);

  const tooltipStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    fontSize: '12px',
    color: colors.textPrimary,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  }), [colors]);

  // Small workaround: force re-render of ResponsiveContainer when theme changes
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    setThemeKey((k) => k + 1);
  }, [colors.primary, colors.accent]);

  function navigateMonth(delta: number) {
    const d = new Date(year, month + delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="space-y-4 py-4 pb-24">
      {/* Header with month navigation */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <IconButton
          variant="outline"
          size="md"
          aria-label="Mes anterior"
          onClick={() => navigateMonth(-1)}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <div className="text-center">
          <h1 className="text-lg font-bold text-text-primary capitalize leading-tight">
            {insights.monthLabel} {insights.year}
          </h1>
          <p className="text-2xs text-text-muted uppercase tracking-wide mt-0.5">
            Resumen mensual
          </p>
        </div>
        <IconButton
          variant="outline"
          size="md"
          aria-label="Mes siguiente"
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth}
        >
          <ChevronRight size={20} />
        </IconButton>
      </motion.div>

      {!insights.hasData ? (
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-soft flex items-center justify-center">
              <Calendar size={24} className="text-primary" />
            </div>
            <p className="text-base font-semibold text-text-primary mb-1">
              Sin datos este mes
            </p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
              Completa habitos, corre o escribi en tu diario para ver tu resumen mensual.
            </p>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Stats Overview Cards */}
          <motion.div
            custom={1}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            <StatCard
              icon={<Trophy size={18} />}
              iconBg="bg-primary-soft text-primary"
              label="Habitos completados"
              value={`${insights.habitsPercent}%`}
              subValue={`${insights.habitsCompleted}/${insights.habitsScheduled}`}
              delta={insights.habitsDelta}
            />
            <StatCard
              icon={<Footprints size={18} />}
              iconBg="bg-secondary-soft text-secondary"
              label="Km corridos"
              value={`${insights.totalKm}`}
              subValue={insights.runningSessions > 0 ? `${insights.runningSessions} sesiones` : undefined}
              delta={insights.kmDelta}
              deltaUnit="km"
            />
            <StatCard
              icon={<BookOpen size={18} />}
              iconBg="bg-accent-soft text-accent"
              label="Entradas de diario"
              value={`${insights.journalEntries}`}
            />
            <StatCard
              icon={<Flame size={18} />}
              iconBg="bg-warning-soft text-warning"
              label="Mejor racha"
              value={`${insights.bestStreak}`}
              subValue={insights.bestStreak > 0 ? 'dias' : undefined}
            />
          </motion.div>

          {/* Habit Consistency List */}
          {insights.habitConsistency.length > 0 && (
            <motion.div
              custom={2}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Consistencia por habito
                </h3>
                <div className="space-y-3">
                  {insights.habitConsistency.map((habit) => (
                    <div key={habit.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-text-primary truncate mr-2">
                          {habit.icon} {habit.name}
                        </span>
                        <span className="text-xs font-semibold text-text-secondary shrink-0 tabular-nums">
                          {habit.myPercent}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${habit.myPercent}%`,
                            backgroundColor: getBarColor(habit.myPercent),
                            opacity: 0.9,
                          }}
                        />
                      </div>
                      {partnerName && habit.partnerPercent > 0 && (
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${habit.partnerPercent}%`,
                              backgroundColor: getBarColor(habit.partnerPercent),
                              opacity: 0.45,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {partnerName && (
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-2xs text-text-muted">Yo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-1 rounded-full bg-text-muted/40" />
                      <span className="text-2xs text-text-muted">{partnerName}</span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Mood Trend */}
          <motion.div
            custom={3}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text-primary">
                  Tendencia de animo
                </h3>
                {insights.averageMood !== null && (
                  <span className="text-xs text-text-muted tabular-nums">
                    Promedio: {MOOD_OPTIONS.find((m) => m.value === Math.round(insights.averageMood!))?.emoji || ''}{' '}
                    {insights.averageMood.toFixed(1)}
                  </span>
                )}
              </div>
              {insights.moodData.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer key={`mood-${themeKey}`} width="100%" height="100%">
                    <LineChart data={insights.moodData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} strokeOpacity={0.4} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: colors.textMuted }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontSize: 16, fill: colors.textMuted }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => MOOD_OPTIONS.find((m) => m.value === v)?.emoji || ''}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => {
                          const opt = MOOD_OPTIONS.find((m) => m.value === value);
                          return [opt ? `${opt.emoji} ${opt.label}` : value, 'Animo'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke={colors.accent}
                        strokeWidth={2}
                        dot={{ r: 4, fill: colors.accent, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: colors.accent }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">Sin datos de diario este mes</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Running Summary */}
          {insights.runningSessions > 0 && (
            <motion.div
              custom={4}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Resumen de carrera
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
                      {insights.runningSessions}
                    </p>
                    <p className="text-2xs text-text-muted mt-1 uppercase tracking-wide">Sesiones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
                      {insights.runningTotalKm}
                    </p>
                    <p className="text-2xs text-text-muted mt-1 uppercase tracking-wide">Km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
                      {insights.runningAvgPace || '-'}
                    </p>
                    <p className="text-2xs text-text-muted mt-1 uppercase tracking-wide">Ritmo</p>
                  </div>
                </div>
                {insights.bestRun && (
                  <div className="bg-surface-hover rounded-xl p-3 border border-border/60">
                    <p className="text-2xs text-text-muted uppercase tracking-wide mb-1">
                      Mejor carrera
                    </p>
                    <p className="text-sm text-text-primary font-semibold tabular-nums">
                      {insights.bestRun.distance}km en {insights.bestRun.duration} min
                    </p>
                    <p className="text-2xs text-text-muted capitalize">
                      {format(new Date(insights.bestRun.date), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                )}
                {insights.cacoWeeksCompleted > 0 && (
                  <p className="text-xs text-text-muted mt-3">
                    {insights.cacoWeeksCompleted} {insights.cacoWeeksCompleted === 1 ? 'semana' : 'semanas'} CaCo completadas
                  </p>
                )}
              </Card>
            </motion.div>
          )}

          {/* Weekly Breakdown */}
          {insights.weeklyBreakdown.some((w) => w.completed > 0) && (
            <motion.div
              custom={5}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Desglose semanal
                </h3>
                <div className="h-36">
                  <ResponsiveContainer key={`weekly-${themeKey}`} width="100%" height="100%">
                    <BarChart data={insights.weeklyBreakdown} barCategoryGap="25%">
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: colors.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value}`, 'Habitos']}
                        cursor={{ fill: colors.border, fillOpacity: 0.25 }}
                      />
                      <Bar
                        dataKey="completed"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                        fill={colors.primary}
                        fillOpacity={0.85}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Highlights */}
          {insights.highlights.length > 0 && (
            <motion.div
              custom={6}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-warning-soft flex items-center justify-center">
                    <Sparkles size={14} className="text-warning" />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Destacados
                  </h3>
                </div>
                <ul className="space-y-2">
                  {insights.highlights.map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span className="text-sm text-text-primary leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// --- Stat Card sub-component ---

function StatCard({
  icon,
  iconBg,
  label,
  value,
  subValue,
  delta,
  deltaUnit = 'pp',
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subValue?: string;
  delta?: number | null;
  deltaUnit?: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
          {value}
        </p>
        {subValue && (
          <p className="text-2xs text-text-muted mt-1 tabular-nums">{subValue}</p>
        )}
      </div>
      <p className="text-2xs text-text-muted leading-tight uppercase tracking-wide">
        {label}
      </p>
      {delta !== null && delta !== undefined && (
        <div className={cn(
          'flex items-center gap-0.5 text-2xs font-semibold',
          delta >= 0 ? 'text-primary' : 'text-danger'
        )}>
          {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span className="tabular-nums">
            {delta >= 0 ? '+' : ''}{delta}{deltaUnit === 'km' ? 'km' : 'pp'} vs mes anterior
          </span>
        </div>
      )}
    </Card>
  );
}
