import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useWishlist } from '../../hooks/useWishlist';
import { useWishlistCategories } from '../../hooks/useWishlistCategories';
import { WishlistItem } from './WishlistItem';
import { WishlistAddForm } from './WishlistAddForm';
import { CardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

export function WishlistTab() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, completed, loading, add, toggle, remove } = useWishlist();
  const { categories, loading: catsLoading, add: addCat, update: updateCat, remove: removeCat } = useWishlistCategories();

  const [category, setCategory] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const memberNames = couple?.memberNames || {};

  if (loading || catsLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const filteredPending = activeFilter
    ? pending.filter((i) => i.category === activeFilter)
    : pending;
  const filteredCompleted = activeFilter
    ? completed.filter((i) => i.category === activeFilter)
    : completed;

  // Categories that have at least one pending item
  const usedCategories = categories.filter((cat) =>
    pending.some((i) => i.category === cat.id),
  );

  return (
    <div className="space-y-4">
      {/* Add form + category management */}
      <WishlistAddForm
        categories={categories}
        selectedCategory={category}
        onCategoryChange={setCategory}
        onAdd={add}
        onAddCategory={addCat}
        onUpdateCategory={updateCat}
        onDeleteCategory={removeCat}
      />

      {/* Category filter — only shown when there are categorised pending items */}
      {usedCategories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveFilter(null)}
            className={cn(
              'shrink-0 px-3 h-8 inline-flex items-center rounded-full text-xs font-medium transition-colors',
              activeFilter === null
                ? 'bg-primary text-primary-contrast'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary',
            )}
          >
            Todos
          </button>
          {usedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveFilter(activeFilter === cat.id ? null : cat.id)
              }
              className={cn(
                'shrink-0 inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-medium transition-colors',
                activeFilter === cat.id
                  ? 'bg-primary text-primary-contrast'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary',
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Pending items */}
      {filteredPending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-2xs font-semibold text-text-muted uppercase tracking-wider px-1">
            Pendientes ({filteredPending.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {filteredPending.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <WishlistItem
                    item={item}
                    categories={categories}
                    onToggle={(completed) => toggle(item.id, completed)}
                    onDelete={() => remove(item.id)}
                    memberNames={memberNames}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Completed items */}
      {filteredCompleted.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            aria-expanded={showCompleted}
            className="flex w-full items-center justify-between gap-1.5 px-1 text-2xs font-semibold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
          >
            <span>Completados ({filteredCompleted.length})</span>
            <ChevronDown
              size={14}
              className={cn(
                'transition-transform duration-200',
                showCompleted ? 'rotate-0' : '-rotate-90',
              )}
            />
          </button>
          {showCompleted && (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredCompleted.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                  >
                    <WishlistItem
                      item={item}
                      categories={categories}
                      onToggle={(completed) => toggle(item.id, completed)}
                      onDelete={() => remove(item.id)}
                      memberNames={memberNames}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {pending.length === 0 && completed.length === 0 && (
        <EmptyState
          icon={<Heart size={40} />}
          title="Sin deseos"
          description="Agregá cosas que quieran hacer juntos: viajes, pelis, restaurantes..."
          className="py-10"
        />
      )}
    </div>
  );
}
