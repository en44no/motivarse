import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { Card } from '../ui/Card';

interface DailyData {
  date: string;
  label: string;
  myPercent: number;
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return val || fallback;
  } catch {
    return fallback;
  }
}

interface ThemeColors {
  primary: string;
  warning: string;
  danger: string;
  surface: string;
  surfaceLight: string;
  border: string;
  textMuted: string;
  textPrimary: string;
}

function readThemeColors(): ThemeColors {
  return {
    primary: readCssVar('--color-primary', '#22c55e'),
    warning: readCssVar('--color-warning', '#f59e0b'),
    danger: readCssVar('--color-danger', '#ef4444'),
    surface: readCssVar('--color-surface', '#1a2332'),
    surfaceLight: readCssVar('--color-surface-light', '#243044'),
    border: readCssVar('--color-border', '#2a3a50'),
    textMuted: readCssVar('--color-text-muted', '#8fa5be'),
    textPrimary: readCssVar('--color-text-primary', '#f1f5f9'),
  };
}

export default function HabitTrendChart({ data }: { data: DailyData[] }) {
  const [colors, setColors] = useState<ThemeColors>(() => readThemeColors());

  // Re-read theme colors on theme change (mutation observer on data-theme attr).
  useEffect(() => {
    setColors(readThemeColors());
    const root = document.documentElement;
    const observer = new MutationObserver(() => setColors(readThemeColors()));
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    return () => observer.disconnect();
  }, []);

  if (data.length < 2) return null;

  function getBarColor(percent: number) {
    if (percent >= 80) return colors.primary;
    if (percent >= 50) return colors.warning;
    return colors.danger;
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-3">
        Tendencia · últimos 14 días
      </h3>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: colors.textMuted }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '12px',
                color: colors.textPrimary,
              }}
              formatter={(value: number) => [`${value}%`, 'Completado']}
              labelFormatter={(label: string) => label}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="myPercent" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={getBarColor(entry.myPercent)}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span className="text-2xs text-text-muted tabular-nums">≥80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-warning" />
          <span className="text-2xs text-text-muted tabular-nums">≥50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-danger" />
          <span className="text-2xs text-text-muted tabular-nums">&lt;50%</span>
        </div>
      </div>
    </Card>
  );
}
