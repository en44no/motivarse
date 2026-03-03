import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sun, PhoneOff, AlarmClock, Footprints, Target, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { MiniConfetti } from '../ui/MiniConfetti';
import { HabitCheckButton } from './HabitCheckButton';
import { HabitStreakBadge } from './HabitStreakBadge';
import { HabitTimeInput } from './HabitTimeInput';
import { vibrateSuccess, vibrateMilestone, isStreakMilestone, getMilestoneMessage } from '../../lib/celebration-utils';
import { playSuccess } from '../../lib/sound-utils';
import type { Habit, HabitLog, HabitStreak } from '../../types/habit';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sun, PhoneOff, AlarmClock, Footprints, Target,
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
}

export const HabitCard = memo(function HabitCard({ habit, log, streak, onToggle, partnerLog, partnerName, onEdit, onDelete, soundEnabled = true, isDragging = false }: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  function handleToggle(completed: boolean, value?: string, metGoal?: boolean) {
    if (completed) {
      vibrateSuccess();
      if (soundEnabled) playSuccess();
      setShowConfetti(true);
      // Check for streak milestone
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ layout: { duration: 0.2 } }}
    >
      <Card className={cn(
        'transition-all duration-300',
        completed && 'bg-gradient-to-r from-primary/8 to-transparent border-primary/20 border-l-2',
        completed && `border-l-[${habit.color}]`,
        partiallyCompleted && 'border-primary/10 bg-primary-soft/15',
        isDragging && 'shadow-xl scale-[1.02] z-50 relative'
      )}
      style={completed ? { borderLeftColor: habit.color } : {}}
      >
        {showConfetti && <MiniConfetti onComplete={() => setShowConfetti(false)} />}
        <div className="flex items-start gap-3">
          {/* Check / Icon */}
          {habit.type === 'boolean' && (
            <HabitCheckButton
              completed={myCompleted}
              color={habit.color}
              onToggle={() => handleToggle(!myCompleted)}
            />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                'text-sm font-semibold truncate',
                completed ? 'text-text-primary' : 'text-text-secondary'
              )}>
                {habit.name}
              </h3>
              {streak && <HabitStreakBadge streak={streak.currentStreak} />}
            </div>

            {/* Partner status for shared habits */}
            {isShared && partnerName && (
              <div className={cn(
                'text-xs flex items-center gap-1 mt-0.5',
                partnerCompleted ? 'text-primary' : 'text-text-muted'
              )}>
                <span>
                  {partnerCompleted
                    ? `👤 ${partnerName} ✓`
                    : `👤 ${partnerName} pendiente`
                  }
                </span>
              </div>
            )}

            {/* Time input for time-based habits */}
            {habit.type === 'time' && (
              <HabitTimeInput
                value={log?.value || ''}
                goalTime={habit.goal?.targetTime}
                comparison={habit.goal?.comparison}
                onSubmit={(time, metGoal) => handleToggle(true, time, metGoal)}
                completed={myCompleted}
                color={habit.color}
              />
            )}

            {/* Partner's time value for shared time habits */}
            {isShared && habit.type === 'time' && partnerLog?.value && partnerName && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                <span className="text-text-muted">{partnerName}:</span>
                <span className={cn('font-mono font-bold', partnerLog.metGoal ? 'text-primary' : 'text-secondary')}>
                  {partnerLog.value}
                </span>
                {partnerLog.metGoal && <span className="text-primary">{'\u2713'}</span>}
              </div>
            )}
          </div>

          {/* 3-dot menu */}
          {(onEdit || onDelete) && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-8 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]"
                >
                  {onEdit && (
                    <button
                      onClick={() => { setShowMenu(false); onEdit(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setShowMenu(false); onDelete(); }}
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
