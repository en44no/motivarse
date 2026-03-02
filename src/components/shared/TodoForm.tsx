import { useState, type FormEvent } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TodoPriority, TodoCategory, TodoRecurring } from '../../types/shared';
import { TODO_CATEGORIES } from '../../config/constants';

interface TodoFormProps {
  onSubmit: (title: string, priority: TodoPriority, category?: TodoCategory, recurring?: TodoRecurring) => void;
}

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'bg-surface-light text-text-muted' },
  { value: 'medium', label: 'Media', color: 'bg-secondary-soft text-secondary' },
  { value: 'high', label: 'Alta', color: 'bg-danger-soft text-danger' },
];

const RECURRING_OPTIONS: { value: TodoRecurring; label: string }[] = [
  { value: 'none', label: 'No' },
  { value: 'weekly', label: 'Sem' },
  { value: 'monthly', label: 'Mes' },
];

export function TodoForm({ onSubmit }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [category, setCategory] = useState<TodoCategory | undefined>(undefined);
  const [recurring, setRecurring] = useState<TodoRecurring>('none');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, category, recurring !== 'none' ? recurring : undefined);
    setTitle('');
    setCategory(undefined);
    setRecurring('none');
  }

  function cycleRecurring() {
    const order: TodoRecurring[] = ['none', 'weekly', 'monthly'];
    const idx = order.indexOf(recurring);
    setRecurring(order[(idx + 1) % order.length]);
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
        {TODO_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value === category ? undefined : cat.value)}
            className={cn(
              'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              category === cat.value
                ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary'
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Priority + Recurring row */}
      <div className="flex items-center justify-between">
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

        {/* Recurring cycle button */}
        <button
          type="button"
          onClick={cycleRecurring}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            recurring !== 'none'
              ? 'bg-accent/15 text-accent ring-1 ring-accent/40'
              : 'bg-surface-hover text-text-muted hover:text-text-secondary'
          )}
        >
          <RefreshCw size={11} />
          <span>{RECURRING_OPTIONS.find(o => o.value === recurring)?.label ?? 'No'}</span>
        </button>
      </div>
    </form>
  );
}
