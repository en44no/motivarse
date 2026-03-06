import { useState } from 'react';
import { ShoppingBag, ChevronDown, ShoppingCart, Heart, Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useCoupleContext } from '../contexts/CoupleContext';
import { useSharedTodos } from '../hooks/useSharedTodos';
import { useCategories } from '../hooks/useCategories';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs } from '../components/ui/Tabs';
import { TodoList } from '../components/shared/TodoList';
import { TodoForm } from '../components/shared/TodoForm';
import { WishlistTab } from '../components/wishlist/WishlistTab';
import { cn } from '../lib/utils';

type Tab = 'lista' | 'deseos';

const TABS = [
  { id: 'lista', label: 'Lista' },
  { id: 'deseos', label: 'Deseos' },
];

export function SharedPage() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, recentlyCompleted, archived, loading, add, toggle, remove } = useSharedTodos();
  const { categories, add: addCategory, update: updateCategory, remove: removeCategory } = useCategories();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('lista');

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
  const usedCategories = categories.filter((cat) =>
    pending.some((t) => t.category === cat.id)
  );

  const filteredPending = activeCategory
    ? pending.filter((t) => t.category === activeCategory)
    : pending;
  const filteredRecent = activeCategory
    ? recentlyCompleted.filter((t) => t.category === activeCategory)
    : recentlyCompleted;
  const filteredArchived = activeCategory
    ? archived.filter((t) => t.category === activeCategory)
    : archived;

  const total = pending.length + recentlyCompleted.length + archived.length;

  return (
    <div className="space-y-4 py-4">
      <h1 className="sr-only">Compartido</h1>
      <Tabs tabs={TABS} activeTab={tab} onChange={(id) => setTab(id as Tab)} />

      {tab === 'lista' && (
        <>
          <TodoForm
            categories={categories}
            onSubmit={(title, priority, category) => add(title, priority, category)}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={removeCategory}
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
              {usedCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
                    activeCategory === cat.id
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
                categories={categories}
              />
            </div>
          )}

          {filteredRecent.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1 hover:text-text-secondary transition-colors"
              >
                {showCompleted ? <EyeOff size={13} /> : <Eye size={13} />}
                Completados ({filteredRecent.length})
              </button>
              {showCompleted && (
                <TodoList
                  todos={filteredRecent}
                  onToggle={toggle}
                  onDelete={remove}
                  currentUserId={user?.uid || ''}
                  memberNames={memberNames}
                  categories={categories}
                />
              )}
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
                  categories={categories}
                />
              )}
            </div>
          )}

          {total === 0 && (
            <EmptyState
              icon={<ShoppingBag size={40} />}
              title="Sin mandados"
              description="Agregá mandados compartidos con tu pareja"
            />
          )}
        </>
      )}

      {tab === 'deseos' && <WishlistTab />}
    </div>
  );
}
