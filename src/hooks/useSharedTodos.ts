import { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  subscribeToTodos,
  addTodo,
  updateTodo,
  deleteTodo,
} from '../services/shared.service';
import type { SharedTodo, TodoPriority } from '../types/shared';

export function useSharedTodos() {
  const { user, profile } = useAuthContext();
  const [todos, setTodos] = useState<SharedTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const coupleId = profile?.coupleId || user?.uid || null;

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToTodos(coupleId, (t) => {
      setTodos(t);
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  async function add(title: string, priority: TodoPriority = 'medium', dueDate?: string) {
    if (!user || !coupleId) return;
    await addTodo({
      coupleId,
      title,
      completed: false,
      createdBy: user.uid,
      priority,
      dueDate,
      createdAt: Date.now(),
    });
  }

  async function toggle(id: string, completed: boolean) {
    if (!user) return;
    await updateTodo(id, {
      completed,
      completedBy: completed ? user.uid : undefined,
    });
  }

  async function remove(id: string) {
    await deleteTodo(id);
  }

  return { todos, pending, completed, loading, add, toggle, remove };
}
