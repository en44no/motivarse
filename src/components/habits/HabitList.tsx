import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { HabitCard } from './HabitCard';
import { useLongPress } from '../../hooks/useLongPress';
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
  reorderable?: boolean;
  onReorder?: (orderedIds: string[]) => void;
}

function ReorderableItem({
  habit,
  log,
  streak,
  partnerLog,
  partnerName,
  onToggle,
  onEdit,
  onDelete,
  soundEnabled,
  draggingId,
  onDragStart,
  onDragEnd,
}: {
  habit: Habit;
  log?: HabitLog;
  streak?: HabitStreak;
  partnerLog?: HabitLog;
  partnerName?: string;
  onToggle: (habitId: string, completed: boolean, value?: string, metGoal?: boolean) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  soundEnabled?: boolean;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();

  const longPress = useLongPress({
    onActivate: (event) => {
      onDragStart(habit.id);
      dragControls.start(event);
    },
  });

  return (
    <Reorder.Item
      as="div"
      value={habit}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="touch-none"
    >
      <div
        onPointerDown={longPress.onPointerDown}
        onPointerUp={longPress.onPointerUp}
        onPointerCancel={longPress.onPointerCancel}
        onPointerMove={longPress.onPointerMove}
      >
        <HabitCard
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
          isDragging={draggingId === habit.id}
        />
      </div>
    </Reorder.Item>
  );
}

export function HabitList({
  habits,
  logs,
  streaks,
  onToggle,
  partnerLogs,
  partnerName,
  title,
  currentUserId,
  onEdit,
  onDelete,
  soundEnabled,
  reorderable,
  onReorder,
}: HabitListProps) {
  const [orderedHabits, setOrderedHabits] = useState<Habit[]>(habits);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sync local state with prop changes
  useEffect(() => {
    setOrderedHabits(habits);
  }, [habits]);

  const handleReorder = useCallback(
    (newOrder: Habit[]) => {
      setOrderedHabits(newOrder);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    if (onReorder) {
      onReorder(orderedHabits.map((h) => h.id));
    }
  }, [onReorder, orderedHabits]);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  if (habits.length === 0) return null;

  if (reorderable) {
    return (
      <div className="space-y-3">
        {title && (
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
            {title}
          </h2>
        )}
        <Reorder.Group
          as="div"
          axis="y"
          values={orderedHabits}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {orderedHabits.map((habit) => {
            const log = logs.find(
              (l) => l.habitId === habit.id && l.userId === currentUserId
            );
            const streak = streaks.find((s) => s.habitId === habit.id);
            const partnerLog = habit.scope === 'shared'
              ? partnerLogs?.find((l) => l.habitId === habit.id && l.completed)
              : undefined;

            return (
              <ReorderableItem
                key={habit.id}
                habit={habit}
                log={log}
                streak={streak}
                partnerLog={partnerLog}
                partnerName={partnerName}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                soundEnabled={soundEnabled}
                draggingId={draggingId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </Reorder.Group>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
          {title}
        </h2>
      )}
      <AnimatePresence>
      {habits.map((habit) => {
        const log = logs.find(
          (l) => l.habitId === habit.id && l.userId === currentUserId
        );
        const streak = streaks.find((s) => s.habitId === habit.id);
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
