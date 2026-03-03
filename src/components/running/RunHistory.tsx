import { useState, useRef, useMemo } from 'react';
import { Clock, MapPin, Gauge, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { formatDisplayDate } from '../../lib/date-utils';
import { MOOD_OPTIONS } from '../../config/constants';
import { deleteRunLog } from '../../services/running.service';
import type { RunLog } from '../../types/running';

type FilterType = 'all' | 'caco' | 'free' | 'shared';

const FILTERS: { id: FilterType; label: string; emoji: string }[] = [
  { id: 'all', label: 'Todas', emoji: '' },
  { id: 'caco', label: 'CaCo', emoji: '🏃' },
  { id: 'free', label: 'Libres', emoji: '🏅' },
  { id: 'shared', label: 'En pareja', emoji: '👫' },
];

interface RunHistoryProps {
  logs: RunLog[];
  title?: string;
  allowDelete?: boolean;
  memberNames?: Record<string, string>;
  showFilters?: boolean;
}

export function RunHistory({ logs, title = 'Historial', allowDelete = false, memberNames, showFilters = false }: RunHistoryProps) {
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredLogs = useMemo(() => {
    switch (filter) {
      case 'caco': return logs.filter((l) => !l.isFreeRun);
      case 'free': return logs.filter((l) => l.isFreeRun && l.isSharedRun === false);
      case 'shared': return logs.filter((l) => l.isFreeRun && l.isSharedRun !== false);
      default: return logs;
    }
  }, [logs, filter]);

  // Only show filter options that have results
  const availableFilters = useMemo(() => {
    return FILTERS.filter((f) => {
      if (f.id === 'all') return true;
      if (f.id === 'caco') return logs.some((l) => !l.isFreeRun);
      if (f.id === 'free') return logs.some((l) => l.isFreeRun && l.isSharedRun === false);
      if (f.id === 'shared') return logs.some((l) => l.isFreeRun && l.isSharedRun !== false);
      return false;
    });
  }, [logs]);

  function handleDelete(logId: string) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    let cancelled = false;
    toast('Carrera eliminada', {
      action: {
        label: 'Deshacer',
        onClick: () => { cancelled = true; },
      },
      duration: 3000,
    });

    undoTimerRef.current = setTimeout(async () => {
      if (cancelled) return;
      try {
        await deleteRunLog(logId);
      } catch (error) {
        console.error('Error deleting run log:', error);
        toast.error('No se pudo eliminar la carrera.');
      }
    }, 3200);
  }

  if (logs.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-bold text-text-secondary px-1">{title}</h3>

      {/* Filter chips */}
      {showFilters && availableFilters.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {availableFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(filter === f.id && f.id !== 'all' ? 'all' : f.id)}
              className={cn(
                'shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
                filter === f.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary',
              )}
            >
              {f.emoji && <span>{f.emoji}</span>}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">Sin carreras en esta categoría</p>
      ) : (
        filteredLogs.slice(0, 15).map((log) => {
          const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
          const isFree = log.isFreeRun;
          const userName = memberNames?.[log.userId];

          return (
            <div
              key={log.id}
              className="bg-surface rounded-2xl border border-border p-3.5 space-y-2"
            >
              {/* Top row: tags + date + metrics */}
              <div className="flex items-start gap-3">
                {/* Left: type badge + mood */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-base',
                    isFree
                      ? 'bg-accent/10'
                      : 'bg-primary/10',
                  )}>
                    {moodOption?.emoji || '😐'}
                  </div>
                </div>

                {/* Center: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    {isFree ? (
                      <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                        Libre
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {log.cacoPlanWeek ? `S${log.cacoPlanWeek} · Sesión ${log.cacoPlanSession}` : 'CaCo'}
                      </span>
                    )}
                    {isFree && (
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        log.isSharedRun === false
                          ? 'bg-surface-light text-text-muted'
                          : 'bg-blue-500/10 text-blue-500',
                      )}>
                        {log.isSharedRun === false ? 'Solo' : '👫 En pareja'}
                      </span>
                    )}
                    {userName && (
                      <span className="inline-flex items-center rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        {userName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{formatDisplayDate(log.date)}</p>
                </div>

                {/* Right: metrics */}
                <div className="text-right space-y-0.5 shrink-0">
                  <div className="flex items-center gap-1 text-sm font-mono font-bold text-text-primary">
                    <Clock size={12} className="text-text-muted" />
                    {log.durationMinutes}min
                  </div>
                  {log.distanceKm && (
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <MapPin size={10} />
                      {log.distanceKm}km
                    </div>
                  )}
                  {log.paceMinKm && (
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Gauge size={10} />
                      {log.paceMinKm}/km
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              {log.note && (
                <p className="text-xs text-text-muted italic pl-12">"{log.note}"</p>
              )}

              {/* Delete */}
              {allowDelete && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
