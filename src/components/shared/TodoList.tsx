import { AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { TodoItem } from './TodoItem';
import { EmptyState } from '../ui/EmptyState';
import type { SharedTodo } from '../../types/shared';

interface TodoListProps {
  todos: SharedTodo[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
  memberNames: Record<string, string>;
}

export function TodoList({ todos, onToggle, onDelete, currentUserId, memberNames }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart size={40} />}
        title="Sin mandados"
        description="Agregá mandados para compartir con tu pareja"
      />
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={(completed) => onToggle(todo.id, completed)}
            onDelete={() => onDelete(todo.id)}
            currentUserId={currentUserId}
            memberNames={memberNames}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
