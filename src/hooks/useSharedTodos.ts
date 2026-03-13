import { toast } from 'sonner';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useDataContext } from '../contexts/DataContext';
import { addTodo, updateTodo, deleteTodo, addPurchaseRecord } from '../services/shared.service';
import type { TodoPriority } from '../types/shared';

const notifyTaskCompleted = httpsCallable(getFunctions(), 'notifyTaskCompleted');
const notifyTodoAddedFn = httpsCallable(getFunctions(), 'notifyTodoAdded');

// Debounce buffer — batches multiple adds into one notification
let pendingTitles: string[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAddedNotification(coupleId: string, title: string) {
  pendingTitles.push(title);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const titles = [...pendingTitles];
    pendingTitles = [];
    debounceTimer = null;
    notifyTodoAddedFn({ coupleId, titles }).catch(() => {});
  }, 60000);
}

export function useSharedTodos() {
  const { user, profile } = useAuthContext();
  const { couple } = useCoupleContext();
  const { todos, loading } = useDataContext();

  const coupleId = profile?.coupleId || couple?.coupleId || null;

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

  async function add(
    title: string,
    priority: TodoPriority = 'medium',
    category?: string,
    dueDate?: string,
  ) {
    if (!user || !coupleId) return;
    try {
      await addTodo({
        coupleId,
        title,
        completed: false,
        createdBy: user.uid,
        priority,
        ...(category ? { category } : {}),
        ...(dueDate ? { dueDate } : {}),
        createdAt: Date.now(),
      });
      // Notify partner (debounced — batches multiple adds into one notification)
      scheduleAddedNotification(coupleId, title);
    } catch (error) {
      toast.error('No se pudo agregar el mandado.');
    }
  }

  async function toggle(id: string, completed: boolean) {
    if (!user || !coupleId) return;
    try {
      const todo = todos.find((t) => t.id === id);
      await updateTodo(id, {
        completed,
        completedBy: completed ? user.uid : undefined,
        completedAt: completed ? Date.now() : undefined,
      });

      // Write purchase record + notify partner when completing a todo
      if (completed && todo) {
        await addPurchaseRecord({
          coupleId,
          title: todo.title.trim().toLowerCase(),
          originalTitle: todo.title.trim(),
          ...(todo.category ? { category: todo.category } : {}),
          completedBy: user.uid,
          completedAt: Date.now(),
        });
        // Fire-and-forget push notification to partner
        notifyTaskCompleted({ coupleId, taskTitle: todo.title }).catch(() => {});
      }
    } catch (error) {
      toast.error('No se pudo actualizar el mandado.');
    }
  }

  async function remove(id: string) {
    try {
      await deleteTodo(id);
    } catch (error) {
      toast.error('No se pudo eliminar el mandado.');
    }
  }

  return { todos, pending, completed, recentlyCompleted, archived, loading, add, toggle, remove };
}
