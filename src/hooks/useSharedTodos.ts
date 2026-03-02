import { useRef } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { addTodo, updateTodo, deleteTodo } from '../services/shared.service';
import type { TodoPriority } from '../types/shared';

export function useSharedTodos() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const { todos, loading } = useDataContext();

  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ARCHIVE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  const now = Date.now();
  const recentlyCompleted = completed.filter(
    (t) => !t.completedAt || now - t.completedAt < ARCHIVE_THRESHOLD_MS
  );
  const archived = completed.filter(
    (t) => t.completedAt != null && now - t.completedAt >= ARCHIVE_THRESHOLD_MS
  );

  async function add(title: string, priority: TodoPriority = 'medium', dueDate?: string) {
    if (!user || !coupleId) return;
    try {
      await addTodo({
        coupleId,
        title,
        completed: false,
        createdBy: user.uid,
        priority,
        dueDate,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Error adding todo:', error);
      toast.error('No se pudo agregar el mandado.');
    }
  }

  async function toggle(id: string, completed: boolean) {
    if (!user) return;
    try {
      await updateTodo(id, {
        completed,
        completedBy: completed ? user.uid : undefined,
        completedAt: completed ? Date.now() : undefined,
      });
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('No se pudo actualizar el mandado.');
    }
  }

  function remove(id: string) {
    // Undo pattern: show toast with undo button, delete after 3s
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    let cancelled = false;
    toast('Mandado eliminado', {
      action: {
        label: 'Deshacer',
        onClick: () => { cancelled = true; },
      },
      duration: 3000,
    });

    undoTimerRef.current = setTimeout(async () => {
      if (cancelled) return;
      try {
        await deleteTodo(id);
      } catch (error) {
        console.error('Error removing todo:', error);
        toast.error('No se pudo eliminar el mandado.');
      }
    }, 3200);
  }

  return { todos, pending, completed, recentlyCompleted, archived, loading, add, toggle, remove };
}
