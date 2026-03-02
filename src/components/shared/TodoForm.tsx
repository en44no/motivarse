import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TodoPriority } from '../../types/shared';
import type { CoupleCategory } from '../../types/category';

interface TodoFormProps {
  categories: CoupleCategory[];
  onSubmit: (title: string, priority: TodoPriority, category?: string) => void;
  onAddCategory: (label: string, emoji: string) => Promise<CoupleCategory | null>;
}

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'bg-surface-light text-text-muted' },
  { value: 'medium', label: 'Media', color: 'bg-secondary-soft text-secondary' },
  { value: 'high', label: 'Alta', color: 'bg-danger-soft text-danger' },
];

// Unique color per category (cycles if > 8)
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

export function TodoForm({ categories, onSubmit, onAddCategory }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  function doSubmit() {
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, category);
    setTitle('');
    setCategory(undefined);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doSubmit();
  }

  function openNewCat() {
    setShowNewCat(true);
    setNewEmoji('');
    setNewLabel('');
    setTimeout(() => labelRef.current?.focus(), 50);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmNewCat();
    } else if (e.key === 'Escape') {
      cancelNewCat();
    }
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

      {/* Category chips — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
        {/* "None" chip */}
        <button
          type="button"
          onClick={() => setCategory(undefined)}
          className={cn(
            'shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center',
            category === undefined
              ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
              : 'bg-surface-hover text-text-muted hover:text-text-secondary'
          )}
        >
          Sin cat.
        </button>

        {/* Category chips — each with a unique color */}
        {categories.map((cat, i) => {
          const color = CAT_COLORS[i % CAT_COLORS.length];
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(isSelected ? undefined : cat.id)}
              className={cn(
                'shrink-0 h-7 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium transition-all',
                isSelected ? color.active : color.base
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}

        {/* "+ Nueva" button */}
        {!showNewCat && (
          <button
            type="button"
            onClick={openNewCat}
            className="shrink-0 h-7 px-2.5 rounded-lg text-xs font-medium bg-surface-hover text-text-muted hover:text-primary hover:bg-primary/10 transition-all border border-dashed border-border flex items-center"
          >
            + Nueva
          </button>
        )}
      </div>

      {/* New category form — below chips, bigger touch targets */}
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
            ref={labelRef}
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
