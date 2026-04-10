import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  PhoneOff,
  AlarmClock,
  Footprints,
  Target,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { MiniConfetti } from '../ui/MiniConfetti';
import { HabitCheckButton } from './HabitCheckButton';
import { HabitStreakBadge } from './HabitStreakBadge';
import { HabitTimeInput } from './HabitTimeInput';
import { useDensity } from '../../contexts/DensityContext';
import {
  vibrateSuccess,
  vibrateMilestone,
  isStreakMilestone,
} from '../../lib/celebration-utils';
import { playSuccess } from '../../lib/sound-utils';
import type { Habit, HabitLog, HabitStreak } from '../../types/habit';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sun,
  PhoneOff,
  AlarmClock,
  Footprints,
  Target,
};

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streak?: HabitStreak;
  onToggle: (completed: boolean, value?: string, metGoal?: boolean) => void;
  partnerLog?: HabitLog;
  partnerName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  soundEnabled?: boolean;
  isDragging?: boolean;
  reorderable?: boolean;
}

export const HabitCard = memo(function HabitCard({
  habit,
  log,
  streak,
  onToggle,
  partnerLog,
  partnerName,
  onEdit,
  onDelete,
  soundEnabled = true,
  isDragging = false,
  reorderable = false,
}: HabitCardProps) {
  const { isCompact } = useDensity();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  function handleToggle(completed: boolean, value?: string, metGoal?: boolean) {
    if (completed) {
      vibrateSuccess();
      if (soundEnabled) playSuccess();
      setShowConfetti(true);
      const nextStreak = (streak?.currentStreak || 0) + 1;
      if (isStreakMilestone(nextStreak)) {
        vibrateMilestone();
      }
    }
    onToggle(completed, value, metGoal);
  }

  const IconComponent = ICON_MAP[habit.icon] || Target;
  const myCompleted = !!log?.completed;
  const partnerCompleted = !!partnerLog?.completed;
  const isShared = habit.scope === 'shared';

  // Determine visual "completed" state based on completionMode
  let completed: boolean;
  let partiallyCompleted = false;

  if (!isShared) {
    completed = myCompleted;
  } else if (habit.completionMode === 'any') {
    completed = myCompleted || partnerCompleted;
  } else {
    // 'both' mode
    completed = myCompleted && partnerCompleted;
    partiallyCompleted = (myCompleted || partnerCompleted) && !completed;
  }

  // Compact row — smaller padding, inline partner status, less info
  if (isCompact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ layout: { duration: 0.18, ease: 'easeOut' }, duration: 0.15 }}
      >
        <div
          className={cn(
            'relative rounded-2xl border bg-surface px-3 py-2 shadow-sm border-t-white/[0.04]',
            'transition-colors duration-150',
            completed
              ? 'border-l-2 border-border/60'
              : 'border-border/60',
            partiallyCompleted && 'bg-primary-soft/10',
            isDragging && 'shadow-xl scale-[1.01] z-50'
          )}
          style={completed ? { borderLeftColor: habit.color } : undefined}
        >
          {showConfetti && (
            <MiniConfetti onComplete={() => setShowConfetti(false)} />
          )}
          <div className="flex items-center gap-3">
            {/* Color dot as icon cue */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: habit.color }}
              aria-hidden
            />

            {/* Name + inline partner check */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <h3
                className={cn(
                  'text-sm font-semibold truncate',
                  completed ? 'text-text-primary' : 'text-text-secondary'
                )}
              >
                {habit.name}
              </h3>
              {streak && <HabitStreakBadge streak={streak.currentStreak} />}
              {isShared && partnerCompleted && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-soft text-primary shrink-0"
                  title={`${partnerName} completado`}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>

            {/* Time input compact — fall back to check for boolean */}
            {habit.type === 'time' && !myCompleted && (
              <HabitTimeInput
                value={log?.value || ''}
                goalTime={habit.goal?.targetTime}
                comparison={habit.goal?.comparison}
                onSubmit={(time, metGoal) => handleToggle(true, time, metGoal)}
                completed={myCompleted}
                color={habit.color}
              />
            )}
            {habit.type === 'time' && myCompleted && log?.value && (
              <span className="text-2xs font-mono text-primary tabular-nums shrink-0">
                {log.value}
              </span>
            )}

            {habit.type === 'boolean' && (
              <HabitCheckButton
                completed={myCompleted}
                color={habit.color}
                onToggle={() => handleToggle(!myCompleted)}
              />
            )}

            {reorderable && (
              <div className="shrink-0 text-text-muted/40 touch-none">
                <GripVertical size={14} />
              </div>
            )}

            {(onEdit || onDelete) && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Opciones"
                  className="w-9 h-9 -mr-1 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]"
                  >
                    {onEdit && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Cozy row (default) — more info, bigger padding
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ layout: { duration: 0.18, ease: 'easeOut' }, duration: 0.15 }}
    >
      <Card
        className={cn(
          'transition-colors duration-150',
          completed &&
            'bg-gradient-to-r from-primary-soft/40 to-transparent border-primary/20 border-l-2',
          partiallyCompleted && 'border-primary/10 bg-primary-soft/15',
          isDragging && 'shadow-xl scale-[1.02] z-50 relative'
        )}
        style={completed ? { borderLeftColor: habit.color } : undefined}
      >
        {showConfetti && (
          <MiniConfetti onComplete={() => setShowConfetti(false)} />
        )}
        <div className="flex items-start gap-3">
          {/* Check button (boolean) or icon (time) */}
          {habit.type === 'boolean' ? (
            <HabitCheckButton
              completed={myCompleted}
              color={habit.color}
              onToggle={() => handleToggle(!myCompleted)}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border border-border/60"
              style={{
                backgroundColor: `${habit.color}15`,
                color: habit.color,
              }}
              aria-hidden
            >
              <IconComponent size={18} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'text-sm font-semibold truncate',
                  completed ? 'text-text-primary' : 'text-text-secondary'
                )}
              >
                {habit.name}
              </h3>
              {streak && <HabitStreakBadge streak={streak.currentStreak} />}
            </div>

            {/* Partner status for shared habits */}
            {isShared && partnerName && (
              <div
                className={cn(
                  'text-2xs flex items-center gap-1 mt-0.5',
                  partnerCompleted ? 'text-primary' : 'text-text-muted'
                )}
              >
                <span>
                  {partnerCompleted
                    ? `${partnerName} completo`
                    : `${partnerName} pendiente`}
                </span>
              </div>
            )}

            {/* Time input for time-based habits */}
            {habit.type === 'time' && (
              <div className="mt-1.5">
                <HabitTimeInput
                  value={log?.value || ''}
                  goalTime={habit.goal?.targetTime}
                  comparison={habit.goal?.comparison}
                  onSubmit={(time, metGoal) =>
                    handleToggle(true, time, metGoal)
                  }
                  completed={myCompleted}
                  color={habit.color}
                />
              </div>
            )}

            {/* Partner's time value for shared time habits */}
            {isShared &&
              habit.type === 'time' &&
              partnerLog?.value &&
              partnerName && (
                <div className="flex items-center gap-1.5 text-2xs mt-1">
                  <span className="text-text-muted">{partnerName}:</span>
                  <span
                    className={cn(
                      'font-mono font-bold tabular-nums',
                      partnerLog.metGoal ? 'text-primary' : 'text-secondary'
                    )}
                  >
                    {partnerLog.value}
                  </span>
                  {partnerLog.metGoal && (
                    <span className="text-primary">{'\u2713'}</span>
                  )}
                </div>
              )}
          </div>

          {/* Drag handle */}
          {reorderable && (
            <div className="shrink-0 text-text-muted/40 touch-none self-center">
              <GripVertical size={16} />
            </div>
          )}

          {/* 3-dot menu */}
          {(onEdit || onDelete) && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Opciones"
                className="w-9 h-9 -mr-1 -mt-1 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]"
                >
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
