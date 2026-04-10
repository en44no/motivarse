import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { RunLog } from '../../types/running';
import { formatShortDate } from '../../lib/date-utils';

interface RunProgressChartProps {
  logs: RunLog[];
}

export function RunProgressChart({ logs }: RunProgressChartProps) {
  if (logs.length < 2) return null;

  const data = [...logs]
    .reverse()
    .slice(-15)
    .map((log) => ({
      date: formatShortDate(log.date),
      duration: log.durationMinutes,
      distance: log.distanceKm || 0,
    }));

  return (
    <section
      className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm"
      aria-label="Progreso en el tiempo"
    >
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-2xs uppercase tracking-wide text-text-muted">Progreso</p>
          <h3 className="mt-0.5 text-base font-semibold text-text-primary">
            Últimas {data.length} carreras
          </h3>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-md)',
              }}
              cursor={{ stroke: 'var(--color-border-light)', strokeWidth: 1 }}
              formatter={(value) => [`${value} min`, 'Duración']}
            />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#colorDuration)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
