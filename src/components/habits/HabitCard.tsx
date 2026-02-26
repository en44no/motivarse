import { motion } from 'framer-motion';
import { Sun, PhoneOff, AlarmClock, Footprints, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { HabitCheckButton } from './HabitCheckButton';
import { HabitStreakBadge } from './HabitStreakBadge';
import { HabitTimeInput } from './HabitTimeInput';
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
}

export function HabitCard({ habit, log, streak, onToggle, partnerLog, partnerName }: HabitCardProps) {
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
    >
      <Card className={cn(
        'transition-all duration-300',
        completed && 'border-primary/20 bg-primary-soft/30',
        partiallyCompleted && 'border-primary/10 bg-primary-soft/15'
      )}>
        <div className="flex items-start gap-3">
          {/* Check / Icon */}
          {habit.type === 'boolean' && (
            <HabitCheckButton
              completed={myCompleted}
              color={habit.color}
              onToggle={() => onToggle(!myCompleted)}
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
                onSubmit={(time, metGoal) => onToggle(true, time, metGoal)}
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
        </div>
      </Card>
    </motion.div>
  );
}
