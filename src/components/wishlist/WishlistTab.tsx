import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Eye, EyeOff } from 'lucide-react';
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
              'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeFilter === null
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
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
                'shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
                activeFilter === cat.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
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
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
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
                  transition={{ delay: i * 0.03, duration: 0.3 }}
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
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1 hover:text-text-secondary transition-colors"
          >
            {showCompleted ? <EyeOff size={13} /> : <Eye size={13} />}
            Completados ({filteredCompleted.length})
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
                    transition={{ delay: i * 0.03, duration: 0.3 }}
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
          icon={<Heart size={48} />}
          title="Sin deseos"
          description="Agrega cosas que quieran hacer juntos: viajes, pelis, restaurantes..."
          containerClassName="py-10"
        />
      )}
    </div>
  );
}
