import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, getToday } from '../../lib/date-utils';
import type { SharedTodo } from '../../types/shared';
import type { CoupleCategory } from '../../types/category';

interface TodoItemProps {
  todo: SharedTodo;
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
  currentUserId: string;
  memberNames: Record<string, string>;
  categories?: CoupleCategory[];
}

export const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete, currentUserId, memberNames, categories = [] }: TodoItemProps) {
  const priorityColors = {
    low: 'border-l-text-muted',
    medium: 'border-l-secondary',
    high: 'border-l-danger',
  };

  const createdByName = memberNames[todo.createdBy] || 'Alguien';
  const completedByName = todo.completedBy ? memberNames[todo.completedBy] || 'Alguien' : '';
  const categoryDef = todo.category ? categories.find((c) => c.id === todo.category) : null;

  // Due date color logic
  const today = getToday();
  let dueDateColor = 'text-text-muted';
  if (todo.dueDate && !todo.completed) {
    if (todo.dueDate < today) dueDateColor = 'text-danger';
    else if (todo.dueDate === today) dueDateColor = 'text-secondary';
  }

  // Silence unused variable warning
  void currentUserId;

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
        <div className="flex items-center gap-1.5 flex-wrap">
          {categoryDef && (
            <span className="text-sm">{categoryDef.emoji}</span>
          )}
          <p className={cn(
            'text-sm font-medium',
            todo.completed ? 'text-text-muted line-through' : 'text-text-primary'
          )}>
            {todo.title}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-[10px] text-text-muted">
            {todo.completed
              ? `Completado por ${completedByName}${todo.completedAt ? ` · ${formatRelativeTime(todo.completedAt)}` : ''}`
              : `Agregado por ${createdByName}`}
          </p>
          {todo.dueDate && (
            <span className={cn('text-[10px] flex items-center gap-0.5', dueDateColor)}>
              <Calendar size={9} />
              {todo.dueDate}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
});
