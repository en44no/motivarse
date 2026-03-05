import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
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
    <Card>
      <h3 className="text-sm font-bold text-text-secondary mb-3">Progreso</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a2332',
                border: '1px solid #2a3a50',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f1f5f9',
              }}
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
    </Card>
  );
}
