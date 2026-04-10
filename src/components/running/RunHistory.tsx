import { useState, useMemo, useCallback, memo } from 'react';
import { Clock, MapPin, Gauge, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';
import { formatDisplayDate } from '../../lib/date-utils';
import { MOOD_OPTIONS } from '../../config/constants';
import { deleteRunLog } from '../../services/running.service';
import { useDensity } from '../../contexts/DensityContext';
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

interface SwipeableCardProps {
  log: RunLog;
  memberNames?: Record<string, string>;
  allowDelete: boolean;
  onDelete: (id: string) => void;
  isCompact: boolean;
}

function SwipeableCard({
  log,
  memberNames,
  allowDelete,
  onDelete,
  isCompact,
}: SwipeableCardProps) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
  const isFree = log.isFreeRun;
  const userName = memberNames?.[log.userId];
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0]);
  const deleteScale = useTransform(x, [-100, -60], [1, 0.85]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      {allowDelete && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end rounded-2xl bg-danger pr-5"
          style={{ opacity: deleteOpacity }}
        >
          <motion.div
            style={{ scale: deleteScale }}
            className="flex items-center gap-1.5 text-white"
          >
            <Trash2 size={16} />
            <span className="text-xs font-semibold">Eliminar</span>
          </motion.div>
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        className={cn(
          'relative rounded-2xl border border-border/60 bg-surface transition-colors duration-150',
          isCompact ? 'px-3 py-2' : 'px-3.5 py-3',
        )}
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
        {isCompact ? (
          <CompactRow
            log={log}
            userName={userName}
            isFree={isFree}
            moodEmoji={moodOption?.emoji}
          />
        ) : (
          <CozyRow
            log={log}
            userName={userName}
            isFree={isFree}
            moodEmoji={moodOption?.emoji}
          />
        )}
      </motion.div>
    </div>
  );
}

function CozyRow({
  log,
  userName,
  isFree,
  moodEmoji,
}: {
  log: RunLog;
  userName: string | undefined;
  isFree: boolean;
  moodEmoji: string | undefined;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        {/* Mood icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ring-1',
            isFree
              ? 'bg-accent-soft ring-accent/20'
              : 'bg-primary-soft ring-primary/20',
          )}
        >
          {moodEmoji || '😐'}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold',
                isFree ? 'bg-accent-soft text-accent' : 'bg-primary-soft text-primary',
              )}
            >
              {isFree ? 'Libre' : log.cacoPlanWeek ? `CaCo · S${log.cacoPlanWeek}` : 'CaCo'}
            </span>
            {isFree && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-2xs font-medium',
                  log.isSharedRun === false
                    ? 'bg-surface-light text-text-muted'
                    : 'bg-info-soft text-info',
                )}
              >
                {log.isSharedRun === false ? 'Solo' : '👫 Pareja'}
              </span>
            )}
            {userName && (
              <span className="text-2xs font-medium text-text-muted">· {userName}</span>
            )}
          </div>
          <p className="mt-0.5 text-2xs text-text-muted">{formatDisplayDate(log.date)}</p>
        </div>

        {/* Metrics */}
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-sm font-bold tabular-nums text-text-primary">
            <Clock size={11} className="text-text-muted" />
            {log.durationMinutes}′
          </div>
          {log.distanceKm ? (
            <div className="mt-0.5 flex items-center justify-end gap-1 text-2xs text-text-muted">
              <MapPin size={9} />
              {log.distanceKm}km
            </div>
          ) : log.paceMinKm ? (
            <div className="mt-0.5 flex items-center justify-end gap-1 text-2xs text-text-muted">
              <Gauge size={9} />
              {log.paceMinKm}/km
            </div>
          ) : null}
        </div>
      </div>

      {/* Note */}
      {log.note && (
        <p className="mt-1.5 ml-[52px] line-clamp-1 text-2xs italic text-text-muted">
          "{log.note}"
        </p>
      )}
    </>
  );
}

function CompactRow({
  log,
  userName,
  isFree,
  moodEmoji,
}: {
  log: RunLog;
  userName: string | undefined;
  isFree: boolean;
  moodEmoji: string | undefined;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Mood + type indicator */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm',
          isFree ? 'bg-accent-soft' : 'bg-primary-soft',
        )}
      >
        {moodEmoji || '😐'}
      </div>

      {/* Middle: type dot + date + optional username */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'truncate text-xs font-semibold',
              isFree ? 'text-accent' : 'text-primary',
            )}
          >
            {isFree ? 'Libre' : log.cacoPlanWeek ? `CaCo · S${log.cacoPlanWeek}` : 'CaCo'}
          </span>
          {userName && (
            <span className="truncate text-2xs text-text-muted">· {userName}</span>
          )}
        </div>
        <p className="text-2xs text-text-muted">{formatDisplayDate(log.date)}</p>
      </div>

      {/* Right: duration + distance inline */}
      <div className="flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-text-primary">
        <Clock size={10} className="text-text-muted" />
        {log.durationMinutes}′
        {log.distanceKm ? (
          <span className="ml-1 text-2xs font-medium text-text-muted">
            · {log.distanceKm}km
          </span>
        ) : null}
      </div>
    </div>
  );
}

export const RunHistory = memo(function RunHistory({
  logs,
  title = 'Historial',
  allowDelete = false,
  memberNames,
  showFilters = false,
}: RunHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const { isCompact } = useDensity();

  const filteredLogs = useMemo(() => {
    switch (filter) {
      case 'caco':
        return logs.filter((l) => !l.isFreeRun);
      case 'free':
        return logs.filter((l) => l.isFreeRun && l.isSharedRun === false);
      case 'shared':
        return logs.filter((l) => l.isFreeRun && l.isSharedRun !== false);
      default:
        return logs;
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
      toast.error('No se pudo eliminar la carrera.');
    }
  }, []);

  if (logs.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={title}>
      <h3 className="px-1 text-2xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>

      {/* Filter chips */}
      {showFilters && availableFilters.length > 2 && (
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
          {availableFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(filter === f.id && f.id !== 'all' ? 'all' : f.id)}
              className={cn(
                'shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                filter === f.id
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary',
              )}
            >
              {f.emoji && <span aria-hidden="true">{f.emoji}</span>}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-muted">
          Sin carreras en esta categoría
        </p>
      ) : (
        <div className={cn(isCompact ? 'space-y-1' : 'space-y-1.5')}>
          {filteredLogs.slice(0, 15).map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2, ease: 'easeOut' }}
            >
              <SwipeableCard
                log={log}
                memberNames={memberNames}
                allowDelete={allowDelete}
                onDelete={handleDelete}
                isCompact={isCompact}
              />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
});
