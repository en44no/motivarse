import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trophy, BookOpen, Flame, Footprints, Sparkles, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMonthlyInsights } from '../hooks/useMonthlyInsights';
import { useCoupleContext } from '../contexts/CoupleContext';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { MOOD_OPTIONS } from '../config/constants';

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

function getBarColor(percent: number) {
  if (percent >= 80) return '#22c55e';
  if (percent >= 50) return '#f59e0b';
  return '#ef4444';
}

const tooltipStyle = {
  backgroundColor: '#1a2332',
  border: '1px solid #2a3a50',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f1f5f9',
};

export function MonthlyInsightsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { partnerName } = useCoupleContext();

  const insights = useMonthlyInsights(year, month);

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
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors active:scale-95"
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-text-primary capitalize">
            {insights.monthLabel} {insights.year}
          </h1>
          <p className="text-xs text-text-muted">Resumen mensual</p>
        </div>
        <button
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth}
          className={cn(
            'p-2 rounded-xl bg-surface border border-border transition-colors active:scale-95',
            isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-hover'
          )}
        >
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </motion.div>

      {!insights.hasData ? (
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="text-center py-12">
            <Calendar size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
            <p className="text-sm text-text-muted">Sin datos para este mes</p>
            <p className="text-xs text-text-muted mt-1 opacity-70">
              Completa habitos, corre o escribe en tu diario para ver el resumen
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
              iconBg="bg-amber-500/10 text-amber-500"
              label="Mejor racha"
              value={`${insights.bestStreak}`}
              subValue={insights.bestStreak > 0 ? 'dias' : undefined}
            />
          </motion.div>

          {/* Habit Consistency Chart */}
          {insights.habitConsistency.length > 0 && (
            <motion.div
              custom={2}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <h3 className="text-sm font-bold text-text-secondary mb-3">
                  Consistencia por habito
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={insights.habitConsistency}
                      barCategoryGap="20%"
                      layout="vertical"
                    >
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                        tickFormatter={(name: string) => {
                          const habit = insights.habitConsistency.find((h) => h.name === name);
                          return habit ? `${habit.icon} ${name.length > 8 ? name.slice(0, 8) + '..' : name}` : name;
                        }}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number, name: string) => [
                          `${value}%`,
                          name === 'myPercent' ? 'Yo' : partnerName || 'Pareja',
                        ]}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="myPercent" name="myPercent" radius={[0, 4, 4, 0]} maxBarSize={16}>
                        {insights.habitConsistency.map((entry, index) => (
                          <Cell key={index} fill={getBarColor(entry.myPercent)} fillOpacity={0.85} />
                        ))}
                      </Bar>
                      {partnerName && (
                        <Bar dataKey="partnerPercent" name="partnerPercent" radius={[0, 4, 4, 0]} maxBarSize={16} fillOpacity={0.4}>
                          {insights.habitConsistency.map((entry, index) => (
                            <Cell key={index} fill={getBarColor(entry.partnerPercent)} fillOpacity={0.4} />
                          ))}
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    <span className="text-[10px] text-text-muted">&ge;80%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    <span className="text-[10px] text-text-muted">&ge;50%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-danger" />
                    <span className="text-[10px] text-text-muted">&lt;50%</span>
                  </div>
                  {partnerName && (
                    <>
                      <span className="text-[10px] text-text-muted">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-text-muted/30" />
                        <span className="text-[10px] text-text-muted">{partnerName}</span>
                      </div>
                    </>
                  )}
                </div>
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
                <h3 className="text-sm font-bold text-text-secondary">Tendencia de animo</h3>
                {insights.averageMood !== null && (
                  <span className="text-xs text-text-muted">
                    Promedio: {MOOD_OPTIONS.find((m) => m.value === Math.round(insights.averageMood!))?.emoji || ''}{' '}
                    {insights.averageMood.toFixed(1)}
                  </span>
                )}
              </div>
              {insights.moodData.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.moodData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => MOOD_OPTIONS.find((m) => m.value === v)?.emoji || ''}
                        width={28}
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
                        stroke="#a78bfa"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#a78bfa' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-text-muted">Sin datos de diario este mes</p>
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
                <h3 className="text-sm font-bold text-text-secondary mb-3">Resumen de carrera</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary">{insights.runningSessions}</p>
                    <p className="text-[10px] text-text-muted">Sesiones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary">{insights.runningTotalKm}</p>
                    <p className="text-[10px] text-text-muted">Km totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-text-primary">{insights.runningAvgPace || '-'}</p>
                    <p className="text-[10px] text-text-muted">Ritmo prom.</p>
                  </div>
                </div>
                {insights.bestRun && (
                  <div className="bg-surface-hover rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Mejor carrera</p>
                    <p className="text-sm text-text-primary font-semibold">
                      {insights.bestRun.distance}km en {insights.bestRun.duration} min
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {format(new Date(insights.bestRun.date), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                )}
                {insights.cacoWeeksCompleted > 0 && (
                  <p className="text-xs text-text-muted mt-2">
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
                <h3 className="text-sm font-bold text-text-secondary mb-3">Desglose semanal</h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.weeklyBreakdown} barCategoryGap="25%">
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value}`, 'Habitos']}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="completed" radius={[6, 6, 0, 0]} maxBarSize={36} fill="#22c55e" fillOpacity={0.75} />
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
                  <Sparkles size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-text-secondary">Destacados</h3>
                </div>
                <ul className="space-y-2">
                  {insights.highlights.map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span className="text-sm text-text-primary">{text}</span>
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
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-text-primary leading-none">{value}</p>
        {subValue && <p className="text-[10px] text-text-muted mt-0.5">{subValue}</p>}
      </div>
      <p className="text-[10px] text-text-muted leading-tight">{label}</p>
      {delta !== null && delta !== undefined && (
        <div className={cn(
          'flex items-center gap-0.5 text-[10px] font-medium',
          delta >= 0 ? 'text-primary' : 'text-danger'
        )}>
          {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{delta >= 0 ? '+' : ''}{delta}{deltaUnit === 'km' ? 'km' : 'pp'} vs mes anterior</span>
        </div>
      )}
    </Card>
  );
}
