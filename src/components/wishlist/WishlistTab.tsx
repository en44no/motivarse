import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Heart, Eye, EyeOff, Check, X, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useWishlist } from '../../hooks/useWishlist';
import { useWishlistCategories } from '../../hooks/useWishlistCategories';
import { WishlistItem } from './WishlistItem';
import { CardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import type { CoupleCategory } from '../../types/category';

const CAT_COLORS = [
  { base: 'bg-violet-500/10 text-violet-400', active: 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-400/40' },
  { base: 'bg-sky-500/10 text-sky-400', active: 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-400/40' },
  { base: 'bg-emerald-500/10 text-emerald-400', active: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40' },
  { base: 'bg-amber-500/10 text-amber-400', active: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/40' },
  { base: 'bg-rose-500/10 text-rose-400', active: 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-400/40' },
  { base: 'bg-pink-500/10 text-pink-400', active: 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-400/40' },
  { base: 'bg-teal-500/10 text-teal-400', active: 'bg-teal-500/20 text-teal-400 ring-1 ring-teal-400/40' },
  { base: 'bg-orange-500/10 text-orange-400', active: 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-400/40' },
];

type ManagingCat = { id: string; emoji: string; label: string } | null;

export function WishlistTab() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const { pending, completed, loading, add, toggle, remove } = useWishlist();
  const { categories, loading: catsLoading, add: addCat, update: updateCat, remove: removeCat } = useWishlistCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showDescription, setShowDescription] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [adding, setAdding] = useState(false);

  // New category form
  const [showNewCat, setShowNewCat] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const newLabelRef = useRef<HTMLInputElement>(null);

  // Edit/delete category (long-press)
  const [managingCat, setManagingCat] = useState<ManagingCat>(null);
  const editLabelRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      await add(title.trim(), category, description.trim() || undefined);
      setTitle('');
      setDescription('');
      setShowDescription(false);
    } finally {
      setAdding(false);
    }
  }

  // ── New category ──────────────────────────────────────────────────────────
  function openNewCat() {
    setManagingCat(null);
    setShowNewCat(true);
    setNewEmoji('');
    setNewLabel('');
    setTimeout(() => newLabelRef.current?.focus(), 50);
  }
  function cancelNewCat() {
    setShowNewCat(false);
    setNewEmoji('');
    setNewLabel('');
  }
  async function confirmNewCat() {
    const label = newLabel.trim();
    const emoji = newEmoji.trim() || '📌';
    if (!label) return;
    setSavingCat(true);
    try {
      const created = await addCat(label, emoji);
      if (created) setCategory(created.id);
    } finally {
      setSavingCat(false);
      setShowNewCat(false);
      setNewEmoji('');
      setNewLabel('');
    }
  }
  function handleNewCatKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); confirmNewCat(); }
    else if (e.key === 'Escape') cancelNewCat();
  }

  // ── Long-press to manage category ─────────────────────────────────────────
  function startLongPress(cat: CoupleCategory) {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowNewCat(false);
      setManagingCat({ id: cat.id, emoji: cat.emoji, label: cat.label });
      navigator.vibrate?.(40);
      setTimeout(() => editLabelRef.current?.focus(), 50);
    }, 500);
  }
  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }
  function handleChipClick(cat: CoupleCategory) {
    if (didLongPress.current) return;
    setCategory(category === cat.id ? undefined : cat.id);
  }

  // ── Edit category actions ─────────────────────────────────────────────────
  async function saveEdit() {
    if (!managingCat || !managingCat.label.trim()) return;
    updateCat(managingCat.id, managingCat.label.trim(), managingCat.emoji.trim() || '📌');
    setManagingCat(null);
  }
  async function deleteManaging() {
    if (!managingCat) return;
    removeCat(managingCat.id);
    if (category === managingCat.id) setCategory(undefined);
    setManagingCat(null);
  }
  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    else if (e.key === 'Escape') setManagingCat(null);
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
            disabled={!title.trim() || adding}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 shrink-0"
          >
            {adding ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Plus size={20} />
            )}
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
        <div className="flex gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none items-center">
          {/* Sin cat. */}
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={cn(
              'shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium transition-all',
              category === undefined
                ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary',
            )}
          >
            Sin cat.
          </button>

          {categories.map((cat, i) => {
            const color = CAT_COLORS[i % CAT_COLORS.length];
            const isSelected = category === cat.id;
            const isManaging = managingCat?.id === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onPointerDown={() => startLongPress(cat)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
                onClick={() => handleChipClick(cat)}
                className={cn(
                  'shrink-0 h-7 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium transition-all select-none',
                  isManaging
                    ? 'ring-2 ring-offset-1 ring-offset-surface scale-95 ' + color.active
                    : isSelected
                    ? color.active
                    : color.base,
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}

          {/* + Nueva */}
          {!showNewCat && !managingCat && (
            <button
              type="button"
              onClick={openNewCat}
              className="shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium bg-surface-hover text-text-muted hover:text-primary hover:bg-primary/10 transition-all border border-dashed border-border flex items-center"
            >
              + Nueva
            </button>
          )}
        </div>
      </form>

      {/* Edit existing category — shown on long-press */}
      {managingCat && (
        <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-2 border border-primary/30">
          <input
            value={managingCat.emoji}
            onChange={(e) => setManagingCat({ ...managingCat, emoji: e.target.value })}
            onKeyDown={handleEditKeyDown}
            maxLength={2}
            className="w-9 h-9 text-center text-base bg-surface rounded-lg border border-border outline-none shrink-0"
          />
          <input
            ref={editLabelRef}
            value={managingCat.label}
            onChange={(e) => setManagingCat({ ...managingCat, label: e.target.value })}
            onKeyDown={handleEditKeyDown}
            placeholder="Nombre"
            className="flex-1 h-9 text-sm bg-surface rounded-lg border border-border px-3 outline-none text-text-primary placeholder:text-text-muted min-w-0"
          />
          <button
            type="button"
            onClick={saveEdit}
            disabled={!managingCat.label.trim()}
            className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover transition-colors shrink-0"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={deleteManaging}
            className="w-9 h-9 rounded-lg bg-danger-soft text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-colors shrink-0"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setManagingCat(null)}
            className="w-9 h-9 rounded-lg bg-surface text-text-muted border border-border hover:text-danger hover:border-danger/40 flex items-center justify-center transition-colors shrink-0"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* New category form */}
      {showNewCat && (
        <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-2 border border-primary/30">
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            onKeyDown={handleNewCatKeyDown}
            placeholder="📌"
            maxLength={2}
            className="w-9 h-9 text-center text-base bg-surface rounded-lg border border-border outline-none placeholder:text-text-muted shrink-0"
          />
          <input
            ref={newLabelRef}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleNewCatKeyDown}
            placeholder="Nombre de categoría"
            className="flex-1 h-9 text-sm bg-surface rounded-lg border border-border px-3 outline-none text-text-primary placeholder:text-text-muted min-w-0"
          />
          <button
            type="button"
            onClick={confirmNewCat}
            disabled={!newLabel.trim() || savingCat}
            className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover transition-colors shrink-0"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelNewCat}
            className="w-9 h-9 rounded-lg bg-surface text-text-muted border border-border hover:text-danger hover:border-danger/40 flex items-center justify-center transition-colors shrink-0"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

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
