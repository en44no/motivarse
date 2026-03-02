import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TodoPriority } from '../../types/shared';
import type { CoupleCategory } from '../../types/category';
import { autocategorize } from '../../services/ai.service';

interface TodoFormProps {
  categories: CoupleCategory[];
  onSubmit: (title: string, priority: TodoPriority, category?: string) => void;
  onAddCategory: (label: string, emoji: string) => Promise<CoupleCategory | null>;
  onUpdateCategory: (id: string, label: string, emoji: string) => void;
  onDeleteCategory: (id: string) => void;
}

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'bg-surface-light text-text-muted' },
  { value: 'medium', label: 'Media', color: 'bg-secondary-soft text-secondary' },
  { value: 'high', label: 'Alta', color: 'bg-danger-soft text-danger' },
];

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

export function TodoForm({ categories, onSubmit, onAddCategory, onUpdateCategory, onDeleteCategory }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [category, setCategory] = useState<string | undefined>(undefined);

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

  // ── AI autocategorize ─────────────────────────────────────────────────────
  const [aiSelectedCategoryId, setAiSelectedCategoryId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const userOverrode = useRef(false);

  useEffect(() => {
    userOverrode.current = false;
    if (title.trim().length <= 3 || categories.length === 0) {
      setAiSelectedCategoryId(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggesting(true);
      const id = await autocategorize(title.trim(), categories);
      setSuggesting(false);
      if (id && !userOverrode.current) {
        setCategory(id);
        setAiSelectedCategoryId(id);
      }
    }, 700);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // ── Todo submit ───────────────────────────────────────────────────────────
  function doSubmit() {
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, category);
    setTitle('');
    setCategory(undefined);
    setAiSelectedCategoryId(null);
    userOverrode.current = false;
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doSubmit();
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
      const created = await onAddCategory(label, emoji);
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
    setAiSelectedCategoryId(null);
    userOverrode.current = true;
  }

  // ── Edit category actions ─────────────────────────────────────────────────
  async function saveEdit() {
    if (!managingCat || !managingCat.label.trim()) return;
    onUpdateCategory(managingCat.id, managingCat.label.trim(), managingCat.emoji.trim() || '📌');
    setManagingCat(null);
  }
  async function deleteManaging() {
    if (!managingCat) return;
    onDeleteCategory(managingCat.id);
    if (category === managingCat.id) setCategory(undefined);
    setManagingCat(null);
  }
  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    else if (e.key === 'Escape') setManagingCat(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {/* Input row */}
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSubmit(); } }}
          placeholder="Agregar mandado..."
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

      {/* AI searching indicator */}
      <AnimatePresence>
        {suggesting && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 px-1"
          >
            <Loader2 size={11} className="animate-spin text-primary shrink-0" />
            <span className="text-xs text-text-muted">Buscando categoría con IA...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none items-center">
        {/* Sin cat. */}
        <button
          type="button"
          onClick={() => { setCategory(undefined); setAiSelectedCategoryId(null); userOverrode.current = true; }}
          className={cn(
            'shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium transition-all',
            category === undefined
              ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
              : 'bg-surface-hover text-text-muted hover:text-text-secondary'
          )}
        >
          Sin cat.
        </button>

        {/* Category chips */}
        {categories.map((cat, i) => {
          const color = CAT_COLORS[i % CAT_COLORS.length];
          const isSelected = category === cat.id;
          const isManaging = managingCat?.id === cat.id;
          const isAiSelected = aiSelectedCategoryId === cat.id;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onPointerDown={() => startLongPress(cat)}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onClick={() => handleChipClick(cat)}
              animate={isAiSelected ? { scale: [1, 1.14, 1] } : {}}
              transition={{ duration: 0.38, ease: 'backOut' }}
              className={cn(
                'shrink-0 h-7 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium transition-all select-none',
                isManaging
                  ? 'ring-2 ring-offset-1 ring-offset-surface scale-95 ' + color.active
                  : isSelected
                  ? isAiSelected
                    ? color.active + ' outline outline-2 outline-offset-1 outline-primary/50'
                    : color.active
                  : color.base
              )}
            >
              <AnimatePresence>
                {isAiSelected && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, scale: 0.4 }}
                    animate={{ width: 14, opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.22, ease: 'backOut' }}
                    className="flex items-center overflow-hidden"
                  >
                    <Sparkles size={10} className="text-primary shrink-0" />
                  </motion.span>
                )}
              </AnimatePresence>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </motion.button>
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

      {/* Priority row */}
      <div className="flex gap-1.5">
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPriority(p.value)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-all',
              priority === p.value ? p.color : 'bg-transparent text-text-muted',
              priority === p.value && 'ring-1 ring-current'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </form>
  );
}
