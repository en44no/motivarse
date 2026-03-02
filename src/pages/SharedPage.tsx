import { useState } from 'react';
import { Trophy, ChevronDown } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useSharedTodos } from '../hooks/useSharedTodos';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { TodoList } from '../components/shared/TodoList';
import { TodoForm } from '../components/shared/TodoForm';

export function SharedPage() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, recentlyCompleted, archived, loading, add, toggle, remove } = useSharedTodos();
  const [showArchived, setShowArchived] = useState(false);

  const memberNames = couple?.memberNames || {};

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <TodoForm onSubmit={(title, priority) => add(title, priority)} />

      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Pendientes ({pending.length})
          </h3>
          <TodoList
            todos={pending}
            onToggle={toggle}
            onDelete={remove}
            currentUserId={user?.uid || ''}
            memberNames={memberNames}
          />
        </div>
      )}

      {recentlyCompleted.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Completados ({recentlyCompleted.length})
          </h3>
          <TodoList
            todos={recentlyCompleted}
            onToggle={toggle}
            onDelete={remove}
            currentUserId={user?.uid || ''}
            memberNames={memberNames}
          />
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1 hover:text-text-secondary transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showArchived ? 'rotate-0' : '-rotate-90'}`}
            />
            Archivados ({archived.length})
          </button>
          {showArchived && (
            <TodoList
              todos={archived}
              onToggle={toggle}
              onDelete={remove}
              currentUserId={user?.uid || ''}
              memberNames={memberNames}
            />
          )}
        </div>
      )}

      {pending.length === 0 && recentlyCompleted.length === 0 && archived.length === 0 && (
        <EmptyState
          icon={<Trophy size={40} />}
          title="Sin mandados"
          description="Agregá mandados compartidos con tu pareja"
        />
      )}
    </div>
  );
}
