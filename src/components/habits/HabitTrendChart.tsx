import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card } from '../ui/Card';

interface DailyData {
  date: string;
  label: string;
  myPercent: number;
}

function getBarColor(percent: number) {
  if (percent >= 80) return '#22c55e';
  if (percent >= 50) return '#f59e0b';
  return '#ef4444';
}

export function HabitTrendChart({ data }: { data: DailyData[] }) {
  if (data.length < 2) return null;

  return (
    <Card>
      <h3 className="text-sm font-bold text-text-secondary mb-3">Tendencia — ultimos 14 dias</h3>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              hide
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a2332',
                border: '1px solid #2a3a50',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f1f5f9',
              }}
              formatter={(value: number) => [`${value}%`, 'Completado']}
              labelFormatter={(label: string) => label}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="myPercent" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {data.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.myPercent)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span className="text-[10px] text-text-muted">≥80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span className="text-[10px] text-text-muted">≥50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-danger" />
          <span className="text-[10px] text-text-muted">&lt;50%</span>
        </div>
      </div>
    </Card>
  );
}
