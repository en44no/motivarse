import { useRef } from 'react';
import { Clock, MapPin, Gauge, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { formatDisplayDate } from '../../lib/date-utils';
import { MOOD_OPTIONS } from '../../config/constants';
import { deleteRunLog } from '../../services/running.service';
import type { RunLog } from '../../types/running';

interface RunHistoryProps {
  logs: RunLog[];
  title?: string;
  allowDelete?: boolean;
}

export function RunHistory({ logs, title = 'Historial', allowDelete = false }: RunHistoryProps) {
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-secondary px-1">{title}</h3>
      {logs.slice(0, 10).map((log) => {
        const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
        const isFree = log.isFreeRun;
        return (
          <Card key={log.id}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{moodOption?.emoji || '😐'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isFree ? (
                    <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      Libre
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      {log.cacoPlanWeek ? `Semana ${log.cacoPlanWeek}` : 'CaCo'}
                    </span>
                  )}
                  {isFree && (
                    <span className="inline-flex items-center rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      {log.isSharedRun === false ? 'Solo' : 'En pareja'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{formatDisplayDate(log.date)}</p>
              </div>
              <div className="text-right space-y-0.5">
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
                    {log.paceMinKm} /km
                  </div>
                )}
              </div>
            </div>
            {log.note && (
              <p className="text-xs text-text-muted mt-2 italic">"{log.note}"</p>
            )}
            {allowDelete && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
