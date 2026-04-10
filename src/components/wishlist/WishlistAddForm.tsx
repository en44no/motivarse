import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CoupleCategory } from '../../types/category';

type ManagingCat = { id: string; emoji: string; label: string } | null;

interface WishlistAddFormProps {
  categories: CoupleCategory[];
  selectedCategory: string | undefined;
  onCategoryChange: (id: string | undefined) => void;
  onAdd: (title: string, category?: string, description?: string) => Promise<void>;
  onAddCategory: (label: string, emoji: string) => Promise<CoupleCategory | null>;
  onUpdateCategory: (id: string, label: string, emoji: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function WishlistAddForm({
  categories,
  selectedCategory,
  onCategoryChange,
  onAdd,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: WishlistAddFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      await onAdd(title.trim(), selectedCategory, description.trim() || undefined);
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
      if (created) onCategoryChange(created.id);
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
    } else if (e.key === 'Escape') cancelNewCat();
  }

  // ── Long-press to manage category ─────────────────────────────────────────
  function startLongPress(cat: CoupleCategory) {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowNewCat(false);
      setManagingCat({ id: cat.id, emoji: cat.emoji, label: cat.label });
      navigator.vibrate?.(40);
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
    onCategoryChange(selectedCategory === cat.id ? undefined : cat.id);
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
    if (selectedCategory === managingCat.id) onCategoryChange(undefined);
    setManagingCat(null);
  }
  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') setManagingCat(null);
  }

  return (
    <>
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-3">
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
            className="flex-1 rounded-xl border border-border/60 bg-surface-light px-4 h-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
          <button
            type="submit"
            disabled={!title.trim() || adding}
            aria-label="Agregar deseo"
            className="w-11 h-11 rounded-xl bg-primary text-primary-contrast inline-flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 shrink-0"
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
            className="text-2xs text-text-muted hover:text-primary transition-colors px-1"
          >
            + Agregar descripción
          </button>
        )}

        {showDescription && (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full rounded-xl border border-border/60 bg-surface-light px-4 h-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        )}

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none items-center">
          {/* Sin cat. */}
          <button
            type="button"
            onClick={() => onCategoryChange(undefined)}
            className={cn(
              'shrink-0 h-8 px-3 inline-flex items-center rounded-full text-xs font-medium transition-colors',
              selectedCategory === undefined
                ? 'bg-primary-soft text-primary ring-1 ring-primary/40'
                : 'bg-surface-hover text-text-muted hover:text-text-secondary',
            )}
          >
            Sin cat.
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
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
                  'shrink-0 h-8 inline-flex items-center gap-1 px-3 rounded-full text-xs font-medium transition-colors select-none',
                  isManaging
                    ? 'bg-primary-soft text-primary ring-2 ring-primary/50'
                    : isSelected
                      ? 'bg-primary-soft text-primary ring-1 ring-primary/40'
                      : 'bg-surface-hover text-text-muted hover:text-text-secondary',
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
              className="shrink-0 h-8 px-3 inline-flex items-center rounded-full text-xs font-medium bg-surface-hover text-text-muted hover:text-primary hover:bg-primary-soft transition-colors border border-dashed border-border"
            >
              + Nueva
            </button>
          )}
        </div>
      </form>

      {/* Edit existing category — shown on long-press */}
      {managingCat && (
        <div className="flex items-center gap-2 bg-surface-light rounded-xl p-2 border border-primary/30">
          <input
            value={managingCat.emoji}
            onChange={(e) => setManagingCat({ ...managingCat, emoji: e.target.value })}
            onKeyDown={handleEditKeyDown}
            maxLength={2}
            className="w-11 h-11 text-center text-base bg-surface rounded-lg border border-border/60 outline-none shrink-0"
          />
          <input
            ref={editLabelRef}
            value={managingCat.label}
            onChange={(e) => setManagingCat({ ...managingCat, label: e.target.value })}
            onKeyDown={handleEditKeyDown}
            placeholder="Nombre"
            className="flex-1 h-11 text-sm bg-surface rounded-lg border border-border/60 px-3 outline-none text-text-primary placeholder:text-text-muted min-w-0"
          />
          <button
            type="button"
            onClick={saveEdit}
            disabled={!managingCat.label.trim()}
            aria-label="Guardar categoría"
            className="w-11 h-11 rounded-lg bg-primary text-primary-contrast inline-flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover transition-colors shrink-0"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={deleteManaging}
            aria-label="Eliminar categoría"
            className="w-11 h-11 rounded-lg bg-danger-soft text-danger inline-flex items-center justify-center hover:bg-danger hover:text-white transition-colors shrink-0"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setManagingCat(null)}
            aria-label="Cancelar"
            className="w-11 h-11 rounded-lg bg-surface text-text-muted border border-border/60 hover:text-text-primary inline-flex items-center justify-center transition-colors shrink-0"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* New category form */}
      {showNewCat && (
        <div className="flex items-center gap-2 bg-surface-light rounded-xl p-2 border border-primary/30">
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            onKeyDown={handleNewCatKeyDown}
            placeholder="📌"
            maxLength={2}
            className="w-11 h-11 text-center text-base bg-surface rounded-lg border border-border/60 outline-none placeholder:text-text-muted shrink-0"
          />
          <input
            ref={newLabelRef}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleNewCatKeyDown}
            placeholder="Nombre de categoría"
            className="flex-1 h-11 text-sm bg-surface rounded-lg border border-border/60 px-3 outline-none text-text-primary placeholder:text-text-muted min-w-0"
          />
          <button
            type="button"
            onClick={confirmNewCat}
            disabled={!newLabel.trim() || savingCat}
            aria-label="Crear categoría"
            className="w-11 h-11 rounded-lg bg-primary text-primary-contrast inline-flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover transition-colors shrink-0"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelNewCat}
            aria-label="Cancelar"
            className="w-11 h-11 rounded-lg bg-surface text-text-muted border border-border/60 hover:text-text-primary inline-flex items-center justify-center transition-colors shrink-0"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
