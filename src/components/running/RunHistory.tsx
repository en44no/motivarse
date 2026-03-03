import { useState, useMemo, useCallback } from 'react';
import { Clock, MapPin, Gauge, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform } from 'framer-motion';
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

function SwipeableCard({
  log,
  memberNames,
  allowDelete,
  onDelete,
}: {
  log: RunLog;
  memberNames?: Record<string, string>;
  allowDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
  const isFree = log.isFreeRun;
  const userName = memberNames?.[log.userId];
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      {allowDelete && (
        <motion.div
          className="absolute inset-0 bg-danger flex items-center justify-end pr-5 rounded-2xl"
          style={{ opacity: deleteOpacity }}
        >
          <motion.div style={{ scale: deleteScale }} className="flex items-center gap-1.5 text-white">
            <Trash2 size={16} />
            <span className="text-xs font-semibold">Eliminar</span>
          </motion.div>
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        className="bg-surface border border-border rounded-2xl px-3.5 py-3 relative"
        style={allowDelete ? { x } : undefined}
        drag={allowDelete ? 'x' : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            onDelete(log.id);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* Mood icon */}
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0',
            isFree ? 'bg-accent/10' : 'bg-primary/10',
          )}>
            {moodOption?.emoji || '😐'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Type tag — always visible */}
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                isFree
                  ? 'bg-accent/15 text-accent'
                  : 'bg-primary/15 text-primary',
              )}>
                {isFree ? 'Libre' : (log.cacoPlanWeek ? `CaCo · S${log.cacoPlanWeek}` : 'CaCo')}
              </span>
              {isFree && (
                <span className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  log.isSharedRun === false
                    ? 'bg-surface-light text-text-muted'
                    : 'bg-blue-500/10 text-blue-500',
                )}>
                  {log.isSharedRun === false ? 'Solo' : '👫'}
                </span>
              )}
              {userName && (
                <span className="text-[10px] text-text-muted font-medium">
                  · {userName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">{formatDisplayDate(log.date)}</p>
          </div>

          {/* Metrics */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-sm font-mono font-bold text-text-primary">
              <Clock size={11} className="text-text-muted" />
              {log.durationMinutes}′
            </div>
            {log.distanceKm ? (
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <MapPin size={9} />
                {log.distanceKm}km
              </div>
            ) : log.paceMinKm ? (
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <Gauge size={9} />
                {log.paceMinKm}/km
              </div>
            ) : null}
          </div>
        </div>

        {/* Note */}
        {log.note && (
          <p className="text-[11px] text-text-muted italic mt-1.5 ml-12 line-clamp-1">"{log.note}"</p>
        )}
      </motion.div>
    </div>
  );
}

export function RunHistory({ logs, title = 'Historial', allowDelete = false, memberNames, showFilters = false }: RunHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredLogs = useMemo(() => {
    switch (filter) {
      case 'caco': return logs.filter((l) => !l.isFreeRun);
      case 'free': return logs.filter((l) => l.isFreeRun && l.isSharedRun === false);
      case 'shared': return logs.filter((l) => l.isFreeRun && l.isSharedRun !== false);
      default: return logs;
    }
  }, [logs, filter]);

  const availableFilters = useMemo(() => {
    return FILTERS.filter((f) => {
      if (f.id === 'all') return true;
      if (f.id === 'caco') return logs.some((l) => !l.isFreeRun);
      if (f.id === 'free') return logs.some((l) => l.isFreeRun && l.isSharedRun === false);
      if (f.id === 'shared') return logs.some((l) => l.isFreeRun && l.isSharedRun !== false);
      return false;
    });
  }, [logs]);

  const handleDelete = useCallback(async (logId: string) => {
    try {
      await deleteRunLog(logId);
    } catch (error) {
      console.error('Error deleting run log:', error);
      toast.error('No se pudo eliminar la carrera.');
    }
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="space-y-2">
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
        <div className="space-y-1.5">
          {filteredLogs.slice(0, 15).map((log) => (
            <SwipeableCard
              key={log.id}
              log={log}
              memberNames={memberNames}
              allowDelete={allowDelete}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
