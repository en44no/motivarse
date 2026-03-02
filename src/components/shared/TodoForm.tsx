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

export function TodoForm({ categories, onSubmit, onAddCategory }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [category, setCategory] = useState<string | undefined>(undefined);

  // Inline new-category form state
  const [showNewCat, setShowNewCat] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, category);
    setTitle('');
    setCategory(undefined);
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
          placeholder="Agregar mandado..."
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
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {/* "None" chip */}
        <button
          type="button"
          onClick={() => setCategory(undefined)}
          className={cn(
            'shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            category === undefined
              ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
              : 'bg-surface-hover text-text-muted hover:text-text-secondary'
          )}
        >
          Sin cat.
        </button>

        {/* Loaded categories */}
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id === category ? undefined : cat.id)}
            className={cn(
              'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              category === cat.id
                ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}

        {/* "+ Nueva" button or inline form */}
        {!showNewCat ? (
          <button
            type="button"
            onClick={openNewCat}
            className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-hover text-text-muted hover:text-primary hover:bg-primary/10 transition-all border border-dashed border-border"
          >
            + Nueva
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-1 bg-surface border border-primary/40 rounded-lg px-2 py-0.5 ring-1 ring-primary/20">
            {/* Emoji input */}
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              onKeyDown={handleNewCatKeyDown}
              placeholder="😀"
              maxLength={2}
              className="w-7 text-center text-sm bg-transparent outline-none placeholder:text-text-muted"
            />
            {/* Label input */}
            <input
              ref={labelRef}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleNewCatKeyDown}
              placeholder="Nombre"
              className="w-20 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
            {/* Confirm */}
            <button
              type="button"
              onClick={confirmNewCat}
              disabled={!newLabel.trim() || savingCat}
              className="text-primary disabled:opacity-40 hover:text-primary-hover transition-colors"
            >
              <Check size={13} strokeWidth={2.5} />
            </button>
            {/* Cancel */}
            <button
              type="button"
              onClick={cancelNewCat}
              className="text-text-muted hover:text-danger transition-colors"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

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
