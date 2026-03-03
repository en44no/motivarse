import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Trash2, Lock, Check } from 'lucide-react';
import { subDays, addDays, isToday as isTodayFn } from 'date-fns';
import { cn } from '../../lib/utils';
import { formatDate, formatDisplayDate } from '../../lib/date-utils';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MOOD_OPTIONS } from '../../config/constants';
import type { JournalEntry } from '../../types/journal';

interface JournalSheetProps {
  open: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSave: (date: string, content: string, mood?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AUTOSAVE_DELAY = 1500;

export function JournalSheet({ open, onClose, entries, onSave, onDelete }: JournalSheetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef(content);
  const moodRef = useRef(mood);

  const dateStr = formatDate(currentDate);
  const isToday = isTodayFn(currentDate);
  const isFuture = currentDate > new Date();

  // Find existing entry for current date
  const currentEntry = entries.find((e) => e.date === dateStr);

  // Recent entries (excluding current date), last 7 entries
  const recentEntries = entries.filter((e) => e.date !== dateStr).slice(0, 7);

  // Sync content/mood when date changes or entry loads
  useEffect(() => {
    if (currentEntry) {
      setContent(currentEntry.content);
      setMood(currentEntry.mood);
    } else {
      setContent('');
      setMood(undefined);
    }
    setSaveStatus('idle');
    contentRef.current = currentEntry?.content ?? '';
    moodRef.current = currentEntry?.mood;
  }, [dateStr, currentEntry?.id]);

  // Reset date to today when opening
  useEffect(() => {
    if (open) {
      setCurrentDate(new Date());
      setExpandedEntry(null);
    }
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const doSave = useCallback(
    async (text: string, selectedMood?: string) => {
      if (!text.trim() && !selectedMood) return;
      setSaveStatus('saving');
      try {
        await onSave(dateStr, text, selectedMood);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
      } catch {
        setSaveStatus('idle');
      }
    },
    [dateStr, onSave],
  );

  // Debounced auto-save on content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!newContent.trim() && !moodRef.current) {
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('idle');
    saveTimeoutRef.current = setTimeout(() => {
      doSave(newContent, moodRef.current);
    }, AUTOSAVE_DELAY);
  };

  const handleMoodSelect = (emoji: string) => {
    const newMood = mood === emoji ? undefined : emoji;
    setMood(newMood);
    moodRef.current = newMood;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    // Save immediately on mood change if there's content, or save mood alone
    if (contentRef.current.trim() || newMood) {
      doSave(contentRef.current, newMood);
    }
  };

  const goToPrevDay = () => setCurrentDate((d) => subDays(d, 1));
  const goToNextDay = () => {
    if (!isToday) setCurrentDate((d) => addDays(d, 1));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <Fragment>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-surface border-t border-border"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">Mi Diario</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-muted bg-surface-light rounded-full px-2 py-0.5">
                    <Lock size={10} />
                    Solo vos podés ver esto
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Date navigation */}
              <div className="px-5 pb-4 flex items-center justify-between">
                <button
                  onClick={goToPrevDay}
                  className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-semibold text-text-primary">
                  {formatDisplayDate(currentDate)}
                </span>
                <button
                  onClick={goToNextDay}
                  disabled={isToday || isFuture}
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    isToday || isFuture
                      ? 'text-text-muted/30 cursor-not-allowed'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover',
                  )}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Mood selector */}
              <div className="px-5 pb-3">
                <p className="text-xs text-text-muted mb-2">¿Cómo te sentís?</p>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.emoji}
                      onClick={() => handleMoodSelect(opt.emoji)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all',
                        mood === opt.emoji
                          ? 'bg-primary/10 ring-2 ring-primary/40 scale-110'
                          : 'bg-surface-light hover:bg-surface-hover',
                      )}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="text-[9px] text-text-muted">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="px-5 pb-2">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="¿Cómo fue tu día?"
                    className={cn(
                      'w-full min-h-[120px] max-h-[300px] resize-none rounded-2xl',
                      'bg-surface-light border border-border p-4 text-sm text-text-primary',
                      'placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30',
                      'transition-all',
                    )}
                    rows={4}
                  />
                  {/* Save status */}
                  <div className="absolute bottom-3 right-3">
                    <AnimatePresence mode="wait">
                      {saveStatus === 'saving' && (
                        <motion.span
                          key="saving"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] text-text-muted"
                        >
                          Guardando...
                        </motion.span>
                      )}
                      {saveStatus === 'saved' && (
                        <motion.span
                          key="saved"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="inline-flex items-center gap-1 text-[11px] text-primary font-medium"
                        >
                          <Check size={12} />
                          Guardado
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Recent entries */}
              {recentEntries.length > 0 && (
                <div className="px-5 pt-3 pb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Entradas recientes
                  </h3>
                  <div className="space-y-2">
                    {recentEntries.map((entry) => {
                      const isExpanded = expandedEntry === entry.id;
                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          className="bg-surface-light rounded-xl border border-border p-3"
                        >
                          <button
                            className="w-full text-left"
                            onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-text-secondary">
                                {formatDisplayDate(entry.date)}
                                {entry.mood && (
                                  <span className="ml-1.5">{entry.mood}</span>
                                )}
                              </span>
                            </div>
                            <p className={cn(
                              'text-sm text-text-primary',
                              !isExpanded && 'line-clamp-2',
                            )}>
                              {entry.content}
                            </p>
                          </button>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-end mt-2 pt-2 border-t border-border"
                            >
                              <button
                                onClick={() => setDeleteTarget(entry)}
                                className="inline-flex items-center gap-1 text-xs text-danger hover:text-danger/80 transition-colors p-1"
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Safe area bottom padding */}
              <div className="pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))]" />
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar entrada"
        description="¿Seguro que querés eliminar esta entrada del diario? No se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </>
  );
}
