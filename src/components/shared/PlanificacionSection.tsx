import { useState } from 'react';
import { ShoppingCart, Clock, TrendingUp, AlertTriangle, CheckCircle2, BarChart2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePurchaseHistory, type SortMode, type ProductStat } from '../../hooks/usePurchaseHistory';
import type { SharedTodo } from '../../types/shared';
import type { CoupleCategory } from '../../types/category';

interface PlanificacionSectionProps {
  pendingTodos: SharedTodo[];
  categories: CoupleCategory[];
  onAddToList: (title: string, category?: string) => void;
}

const SORT_TABS: { value: SortMode; label: string }[] = [
  { value: 'urgency', label: 'Urgencia' },
  { value: 'frequency', label: 'Frecuencia' },
  { value: 'recent', label: 'Reciente' },
];

function UrgencyBadge({ urgency }: { urgency: ProductStat['urgency'] }) {
  if (urgency === 'overdue') {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-danger bg-danger-soft px-1.5 py-0.5 rounded-full">
        <AlertTriangle size={9} />
        Atrasado
      </span>
    );
  }
  if (urgency === 'soon') {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-secondary bg-secondary-soft px-1.5 py-0.5 rounded-full">
        <Clock size={9} />
        Pronto
      </span>
    );
  }
  return null;
}

function InListBadge() {
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
      <CheckCircle2 size={9} />
      En lista
    </span>
  );
}

function DaysSinceText({ days, urgency }: { days: number; urgency: ProductStat['urgency'] }) {
  const color =
    urgency === 'overdue' ? 'text-danger' :
    urgency === 'soon' ? 'text-secondary' :
    'text-text-muted';

  const label = days === 0 ? 'Hoy' : days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
  return <span className={cn('text-[10px]', color)}>{label}</span>;
}

export function PlanificacionSection({ pendingTodos, categories, onAddToList }: PlanificacionSectionProps) {
  const [sortMode, setSortMode] = useState<SortMode>('urgency');
  const { stats, totalDistinct, purchasedThisMonth } = usePurchaseHistory(pendingTodos, sortMode);

  function getCategoryDef(catId?: string) {
    if (!catId) return null;
    return categories.find((c) => c.id === catId) ?? null;
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center">
          <BarChart2 size={28} className="text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-secondary">Sin historial todavía</p>
        <p className="text-xs text-text-muted max-w-[200px]">
          Completá mandados para ver estadísticas y sugerencias de compra
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-0.5">Productos distintos</p>
          <p className="text-xl font-bold text-text-primary">{totalDistinct}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-0.5">Compras este mes</p>
          <p className="text-xl font-bold text-text-primary">{purchasedThisMonth}</p>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1.5">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSortMode(tab.value)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-all',
              sortMode === tab.value
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {stats.map((stat) => {
          const catDef = getCategoryDef(stat.category);
          return (
            <div
              key={stat.key}
              className={cn(
                'bg-surface rounded-xl border border-border p-3 flex items-center gap-3',
                stat.urgency === 'overdue' && 'border-l-[3px] border-l-danger',
                stat.urgency === 'soon' && 'border-l-[3px] border-l-secondary',
              )}
            >
              {/* Category emoji or fallback */}
              <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 text-base">
                {catDef ? catDef.emoji : <ShoppingCart size={16} className="text-text-muted" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-text-primary truncate">{stat.displayTitle}</p>
                  <UrgencyBadge urgency={stat.urgency} />
                  {stat.isInList && <InListBadge />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                    <TrendingUp size={9} />
                    {stat.count} {stat.count === 1 ? 'vez' : 'veces'}
                  </span>
                  <DaysSinceText days={stat.daysSince} urgency={stat.urgency} />
                  {stat.avgDaysBetween !== null && (
                    <span className="text-[10px] text-text-muted">
                      ~c/&nbsp;{stat.avgDaysBetween} días
                    </span>
                  )}
                  {catDef && (
                    <span className="text-[10px] text-text-muted">{catDef.label}</span>
                  )}
                </div>
              </div>

              {/* Add to list button */}
              <button
                onClick={() => onAddToList(stat.displayTitle, stat.category)}
                disabled={stat.isInList}
                className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  stat.isInList
                    ? 'bg-primary/10 text-primary cursor-default'
                    : 'bg-surface-hover text-text-muted hover:bg-primary hover:text-white'
                )}
                title={stat.isInList ? 'Ya está en la lista' : 'Agregar a lista'}
              >
                {stat.isInList ? <CheckCircle2 size={16} /> : <Plus size={16} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

