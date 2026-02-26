import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SharedTodo } from '../../types/shared';

interface TodoItemProps {
  todo: SharedTodo;
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
  currentUserId: string;
  memberNames: Record<string, string>;
}

export function TodoItem({ todo, onToggle, onDelete, currentUserId, memberNames }: TodoItemProps) {
  const priorityColors = {
    low: 'border-l-text-muted',
    medium: 'border-l-secondary',
    high: 'border-l-danger',
  };

  const createdByName = memberNames[todo.createdBy] || 'Alguien';
  const completedByName = todo.completedBy ? memberNames[todo.completedBy] || 'Alguien' : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'flex items-center gap-3 bg-surface rounded-xl border border-border p-3 border-l-[3px] shadow-sm',
        priorityColors[todo.priority],
        todo.completed && 'opacity-60'
      )}
    >
      <button
        onClick={() => onToggle(!todo.completed)}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all',
          todo.completed
            ? 'bg-primary text-white'
            : 'border-2 border-border hover:border-primary/50'
        )}
      >
        {todo.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          todo.completed ? 'text-text-muted line-through' : 'text-text-primary'
        )}>
          {todo.title}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {todo.completed
            ? `Completado por ${completedByName}`
            : `Agregado por ${createdByName}`}
        </p>
      </div>

      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
