import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trash2, Lock, Plus,
  CalendarDays, Flame, BookOpen,
} from 'lucide-react';
import { subDays, addDays, isToday as isTodayFn, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { formatDate, formatDisplayDate, getToday } from '../lib/date-utils';
import { useJournal } from '../hooks/useJournal';
import { useJournalStats } from '../hooks/useJournalStats';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/Skeleton';
import { JournalWriteView } from '../components/journal/JournalWriteView';
import type { JournalEntry } from '../types/journal';

type ViewMode = 'list' | 'write';

export function JournalPage() {
  const navigate = useNavigate();
  const { entries, loading, todayEntry, saveEntry, deleteEntry } = useJournal();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [writeDate, setWriteDate] = useState(() => new Date());
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const dateStr = formatDate(writeDate);
  const isToday = isTodayFn(writeDate);

  // Find existing entry for write date
  const currentEntry = entries.find((e) => e.date === dateStr);

  // Track if content has unsaved changes
  const hasChanges = currentEntry
    ? content !== currentEntry.content || mood !== currentEntry.mood
    : content.trim() !== '' || mood !== undefined;

  // Sync content/mood when date changes
  useEffect(() => {
    if (currentEntry) {
      setContent(currentEntry.content);
      setMood(currentEntry.mood);
    } else {
      setContent('');
      setMood(undefined);
    }
    setSaveStatus('idle');
  }, [dateStr, currentEntry?.id]);

  const handleSave = useCallback(async () => {
    if (!content.trim() && !mood) return;
    setSaveStatus('saving');
    try {
      await saveEntry(dateStr, content, mood);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch {
      setSaveStatus('idle');
    }
  }, [dateStr, content, mood, saveEntry]);

  const handleMoodSelect = (emoji: string) => {
    setMood((prev) => prev === emoji ? undefined : emoji);
  };

  const goToPrevDay = () => setWriteDate((d) => subDays(d, 1));
  const goToNextDay = () => {
    if (!isToday) setWriteDate((d) => addDays(d, 1));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteEntry(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openWriteMode = (date?: Date) => {
    setWriteDate(date || new Date());
    setViewMode('write');
  };

  // No cleanup needed — manual save only

  // --- Stats ---
  const stats = useJournalStats(entries);

  // --- Mini calendar for current month ---
  const calendarData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });
    const entryDates = new Set(entries.map((e) => e.date));
    return { days, entryDates, startDow: getDay(start) === 0 ? 6 : getDay(start) - 1 };
  }, [entries]);

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => viewMode === 'write' ? setViewMode('list') : navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary">
                {viewMode === 'write' ? 'Escribir' : 'Mi Diario'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-muted bg-surface-light rounded-full px-2 py-0.5">
                <Lock size={9} />
                Personal
              </span>
            </div>
          </div>
        </div>

        {viewMode === 'list' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => openWriteMode()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/25"
          >
            <Plus size={16} />
            {todayEntry ? 'Editar hoy' : 'Escribir'}
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-surface rounded-2xl border border-border p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen size={14} className="text-primary" />
                  </div>
                  <p className="text-lg font-bold text-text-primary">{stats.totalEntries}</p>
                  <p className="text-[10px] text-text-muted">Entradas</p>
                </div>
                <div className="bg-surface rounded-2xl border border-border p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame size={14} className="text-orange-400" />
                  </div>
                  <p className="text-lg font-bold text-text-primary">{stats.streak}</p>
                  <p className="text-[10px] text-text-muted">Racha</p>
                </div>
                <div className="bg-surface rounded-2xl border border-border p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {stats.topMood ? (
                      <span className="text-sm">{stats.topMood[0]}</span>
                    ) : (
                      <CalendarDays size={14} className="text-secondary" />
                    )}
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {stats.topMood ? stats.topMood[1] : stats.thisMonthEntries}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {stats.topMood ? 'Mood top' : 'Este mes'}
                  </p>
                </div>
              </div>
            )}

            {/* Mini month calendar */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {format(new Date(), 'MMMM yyyy', { locale: es })}
                </h3>
                <span className="text-[10px] text-text-muted">
                  {stats?.thisMonthEntries || 0} entradas
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
                  <div key={d} className="text-[10px] text-text-muted text-center font-medium py-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: calendarData.startDow }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarData.days.map((day) => {
                  const ds = formatDate(day);
                  const hasEntry = calendarData.entryDates.has(ds);
                  const isTodayCell = ds === getToday();
                  const isFuture = day > new Date();
                  const entry = hasEntry ? entries.find((e) => e.date === ds) : null;

                  return (
                    <button
                      key={ds}
                      disabled={isFuture}
                      onClick={() => {
                        if (hasEntry) {
                          openWriteMode(day);
                        } else if (!isFuture) {
                          openWriteMode(day);
                        }
                      }}
                      className={cn(
                        'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors',
                        isFuture && 'opacity-25 cursor-not-allowed',
                        isTodayCell && 'ring-1 ring-primary/50',
                        hasEntry
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-hover',
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {entry?.mood && (
                        <span className="text-[8px] leading-none">{entry.mood}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entries list */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
                Entradas recientes
              </h3>
              {entries.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-8 text-center">
                  <span className="text-3xl mb-3 block">📝</span>
                  <p className="text-sm font-semibold text-text-primary mb-1">Tu diario está vacío</p>
                  <p className="text-xs text-text-muted">Escribí tu primera entrada para empezar a registrar cómo te sentís.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => {
                    const isExpanded = expandedEntry === entry.id;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        layout
                        className="bg-surface rounded-2xl border border-border overflow-hidden"
                      >
                        <button
                          className="w-full text-left p-4"
                          onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-text-secondary">
                              {formatDisplayDate(entry.date)}
                            </span>
                            {entry.mood && (
                              <span className="text-base">{entry.mood}</span>
                            )}
                          </div>
                          <p className={cn(
                            'text-sm text-text-primary leading-relaxed',
                            !isExpanded && 'line-clamp-2',
                          )}>
                            {entry.content || <span className="text-text-muted italic">Solo mood, sin texto</span>}
                          </p>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border">
                                <button
                                  onClick={() => openWriteMode(parseISO(entry.date))}
                                  className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(entry)}
                                  className="inline-flex items-center gap-1 text-xs text-danger hover:text-danger/80 transition-colors"
                                >
                                  <Trash2 size={13} />
                                  Eliminar
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Write mode */
          <JournalWriteView
            writeDate={writeDate}
            isToday={isToday}
            content={content}
            mood={mood}
            saveStatus={saveStatus}
            hasChanges={hasChanges}
            onContentChange={setContent}
            onMoodSelect={handleMoodSelect}
            onSave={handleSave}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
          />
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
    </div>
  );
}
