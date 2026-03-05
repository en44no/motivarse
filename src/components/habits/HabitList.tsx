import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { HabitCard } from './HabitCard';
import { WaterCard } from './WaterCard';
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
        {habit.type === 'water' ? (
          <WaterCard
            habit={habit}
            log={log}
            streak={streak}
            partnerName={habit.scope === 'shared' ? partnerName : undefined}
            onEdit={onEdit ? () => onEdit(habit.id) : undefined}
            onDelete={onDelete ? () => onDelete(habit.id) : undefined}
            soundEnabled={soundEnabled}
            isDragging={draggingId === habit.id}
            reorderable
          />
        ) : (
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
            reorderable
          />
        )}
      </div>
    </Reorder.Item>
  );
}

export const HabitList = memo(function HabitList({
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

  // Pre-compute lookup maps to avoid .find() inside .map()
  const logMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const l of logs) {
      if (l.userId === currentUserId) map.set(l.habitId, l);
    }
    return map;
  }, [logs, currentUserId]);

  const streakMap = useMemo(() => {
    const map = new Map<string, HabitStreak>();
    for (const s of streaks) map.set(s.habitId, s);
    return map;
  }, [streaks]);

  const partnerLogMap = useMemo(() => {
    if (!partnerLogs) return new Map<string, HabitLog>();
    const map = new Map<string, HabitLog>();
    for (const l of partnerLogs) {
      if (l.completed) map.set(l.habitId, l);
    }
    return map;
  }, [partnerLogs]);

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
          {orderedHabits.map((habit) => (
            <ReorderableItem
              key={habit.id}
              habit={habit}
              log={logMap.get(habit.id)}
              streak={streakMap.get(habit.id)}
              partnerLog={habit.scope === 'shared' ? partnerLogMap.get(habit.id) : undefined}
              partnerName={partnerName}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              soundEnabled={soundEnabled}
              draggingId={draggingId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
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
      {habits.map((habit) => (
        habit.type === 'water' ? (
          <WaterCard
            key={habit.id}
            habit={habit}
            log={logMap.get(habit.id)}
            streak={streakMap.get(habit.id)}
            partnerName={habit.scope === 'shared' ? partnerName : undefined}
            onEdit={onEdit ? () => onEdit(habit.id) : undefined}
            onDelete={onDelete ? () => onDelete(habit.id) : undefined}
            soundEnabled={soundEnabled}
          />
        ) : (
          <HabitCard
            key={habit.id}
            habit={habit}
            log={logMap.get(habit.id)}
            streak={streakMap.get(habit.id)}
            onToggle={(completed, value, metGoal) =>
              onToggle(habit.id, completed, value, metGoal)
            }
            partnerLog={habit.scope === 'shared' ? partnerLogMap.get(habit.id) : undefined}
            partnerName={habit.scope === 'shared' ? partnerName : undefined}
            onEdit={onEdit ? () => onEdit(habit.id) : undefined}
            onDelete={onDelete ? () => onDelete(habit.id) : undefined}
            soundEnabled={soundEnabled}
          />
        )
      ))}
      </AnimatePresence>
    </div>
  );
});
