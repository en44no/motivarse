import { useState, type FormEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Heart, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useWishlist } from '../../hooks/useWishlist';
import { WISHLIST_CATEGORIES } from '../../types/wishlist';
import type { WishlistCategory } from '../../types/wishlist';
import { WishlistItem } from './WishlistItem';
import { CardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

export function WishlistTab() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, completed, loading, add, toggle, remove } = useWishlist();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WishlistCategory>('actividades');
  const [showDescription, setShowDescription] = useState(false);
  const [activeFilter, setActiveFilter] = useState<WishlistCategory | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const memberNames = couple?.memberNames || {};

  if (loading) {
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
  const usedCategories = WISHLIST_CATEGORIES.filter((cat) =>
    pending.some((i) => i.category === cat.value),
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    add(title.trim(), category, description.trim() || undefined);
    setTitle('');
    setDescription('');
    setShowDescription(false);
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Agregar deseo..."
            enterKeyHint="send"
            className="flex-1 rounded-xl border border-border bg-surface-hover px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Optional description toggle */}
        {!showDescription && title.trim() && (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="text-xs text-text-muted hover:text-primary transition-colors px-1"
          >
            + Agregar descripcion
          </button>
        )}

        {showDescription && (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripcion (opcional)"
            className="w-full rounded-xl border border-border bg-surface-hover px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none">
          {WISHLIST_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={cn(
                'shrink-0 h-7 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium transition-all',
                category === cat.value
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                  : 'bg-surface-hover text-text-muted hover:text-text-secondary',
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </form>

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
              key={cat.value}
              onClick={() =>
                setActiveFilter(activeFilter === cat.value ? null : cat.value)
              }
              className={cn(
                'shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
                activeFilter === cat.value
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
              {filteredPending.map((item) => (
                <WishlistItem
                  key={item.id}
                  item={item}
                  onToggle={(completed) => toggle(item.id, completed)}
                  onDelete={() => remove(item.id)}
                  memberNames={memberNames}
                />
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
                {filteredCompleted.map((item) => (
                  <WishlistItem
                    key={item.id}
                    item={item}
                    onToggle={(completed) => toggle(item.id, completed)}
                    onDelete={() => remove(item.id)}
                    memberNames={memberNames}
                  />
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
          description="Agrega cosas que quieran hacer juntos: viajes, pelis, restaurantes..."
        />
      )}
    </div>
  );
}
