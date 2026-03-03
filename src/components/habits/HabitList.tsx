import { AnimatePresence } from 'framer-motion';
import { HabitCard } from './HabitCard';
import type { Habit, HabitLog, HabitStreak } from '../../types/habit';

interface HabitListProps {
  habits: Habit[];
  logs: HabitLog[];
  streaks: HabitStreak[];
  onToggle: (habitId: string, completed: boolean, value?: string, metGoal?: boolean) => void;
  partnerLogs?: HabitLog[];
  partnerName?: string;
  title?: string;
  currentUserId?: string;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  soundEnabled?: boolean;
}

export function HabitList({ habits, logs, streaks, onToggle, partnerLogs, partnerName, title, currentUserId, onEdit, onDelete, soundEnabled }: HabitListProps) {
  if (habits.length === 0) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
          {title}
        </h2>
      )}
      <AnimatePresence>
      {habits.map((habit) => {
        // For my log: find the log matching this habit for the current user
        const log = logs.find(
          (l) => l.habitId === habit.id && l.userId === currentUserId
        );
        const streak = streaks.find((s) => s.habitId === habit.id);

        // For shared habits, find the partner's log
        const partnerLog = habit.scope === 'shared'
          ? partnerLogs?.find((l) => l.habitId === habit.id && l.completed)
          : undefined;

        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            log={log}
            streak={streak}
            onToggle={(completed, value, metGoal) =>
              onToggle(habit.id, completed, value, metGoal)
            }
            partnerLog={partnerLog}
            partnerName={habit.scope === 'shared' ? partnerName : undefined}
            onEdit={onEdit ? () => onEdit(habit.id) : undefined}
            onDelete={onDelete ? () => onDelete(habit.id) : undefined}
            soundEnabled={soundEnabled}
          />
        );
      })}
      </AnimatePresence>
    </div>
  );
}
