import { useState } from 'react';
import { Trophy, ChevronDown } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useSharedTodos } from '../hooks/useSharedTodos';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { TodoList } from '../components/shared/TodoList';
import { TodoForm } from '../components/shared/TodoForm';
import { TODO_CATEGORIES } from '../config/constants';
import type { TodoCategory } from '../types/shared';
import { cn } from '../lib/utils';

export function SharedPage() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, recentlyCompleted, archived, loading, add, toggle, remove } = useSharedTodos();
  const [showArchived, setShowArchived] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TodoCategory | null>(null);

  const memberNames = couple?.memberNames || {};

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  // Categories that have at least one pending todo
  const usedCategories = TODO_CATEGORIES.filter(cat =>
    pending.some(t => t.category === cat.value)
  );

  const filteredPending = activeCategory
    ? pending.filter(t => t.category === activeCategory)
    : pending;
  const filteredRecent = activeCategory
    ? recentlyCompleted.filter(t => t.category === activeCategory)
    : recentlyCompleted;
  const filteredArchived = activeCategory
    ? archived.filter(t => t.category === activeCategory)
    : archived;

  const total = pending.length + recentlyCompleted.length + archived.length;

  return (
    <div className="space-y-4 py-4">
      <TodoForm
        onSubmit={(title, priority, category, recurring) =>
          add(title, priority, category, recurring)
        }
      />

      {/* Category filter — only shown when there are categorised todos */}
      {usedCategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeCategory === null
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            Todos
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
              className={cn(
                'shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
                activeCategory === cat.value
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary'
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {filteredPending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Pendientes ({filteredPending.length})
          </h3>
          <TodoList
            todos={filteredPending}
            onToggle={toggle}
            onDelete={remove}
            currentUserId={user?.uid || ''}
            memberNames={memberNames}
          />
        </div>
      )}

      {filteredRecent.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Completados ({filteredRecent.length})
          </h3>
          <TodoList
            todos={filteredRecent}
            onToggle={toggle}
            onDelete={remove}
            currentUserId={user?.uid || ''}
            memberNames={memberNames}
          />
        </div>
      )}

      {filteredArchived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1 hover:text-text-secondary transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showArchived ? 'rotate-0' : '-rotate-90'}`}
            />
            Archivados ({filteredArchived.length})
          </button>
          {showArchived && (
            <TodoList
              todos={filteredArchived}
              onToggle={toggle}
              onDelete={remove}
              currentUserId={user?.uid || ''}
              memberNames={memberNames}
            />
          )}
        </div>
      )}

      {total === 0 && (
        <EmptyState
          icon={<Trophy size={40} />}
          title="Sin mandados"
          description="Agregá mandados compartidos con tu pareja"
        />
      )}
    </div>
  );
}
