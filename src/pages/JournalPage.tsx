import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trash2, Lock, Plus,
  CalendarDays, Flame, BookOpen, Pencil,
} from 'lucide-react';
import { subDays, addDays, isToday as isTodayFn, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { formatDate, formatDisplayDate, getToday } from '../lib/date-utils';
import { useJournal } from '../hooks/useJournal';
import { useJournalStats } from '../hooks/useJournalStats';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
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
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Volver"
            onClick={() => viewMode === 'write' ? setViewMode('list') : navigate(-1)}
            className="-ml-2"
          >
            <ArrowLeft size={20} />
          </IconButton>
          <div>
            <h1 className="text-lg font-bold text-text-primary leading-tight">
              {viewMode === 'write' ? 'Escribir' : 'Mi diario'}
            </h1>
            <div className="flex items-center gap-1 text-2xs text-text-muted mt-0.5">
              <Lock size={10} />
              <span>Solo vos podes ver esto</span>
            </div>
          </div>
        </div>

        {viewMode === 'list' && (
          <Button
            onClick={() => openWriteMode()}
            size="md"
            variant="primary"
          >
            {todayEntry ? <Pencil size={16} /> : <Plus size={16} />}
            {todayEntry ? 'Editar hoy' : 'Escribir'}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5">
                <Card className="p-3 text-center">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-primary-soft flex items-center justify-center">
                    <BookOpen size={15} className="text-primary" />
                  </div>
                  <p className="text-xl font-bold text-text-primary tabular-nums leading-none">
                    {stats.totalEntries}
                  </p>
                  <p className="text-2xs text-text-muted mt-1 uppercase tracking-wide">Entradas</p>
                </Card>
                <Card className="p-3 text-center">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-warning-soft flex items-center justify-center">
                    <Flame size={15} className="text-warning" />
                  </div>
                  <p className="text-xl font-bold text-text-primary tabular-nums leading-none">
                    {stats.streak}
                  </p>
                  <p className="text-2xs text-text-muted mt-1 uppercase tracking-wide">Racha</p>
                </Card>
                <Card className="p-3 text-center">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-accent-soft flex items-center justify-center">
                    {stats.topMood ? (
                      <span className="text-base leading-none">{stats.topMood[0]}</span>
                    ) : (
                      <CalendarDays size={15} className="text-accent" />
                    )}
                  </div>
                  <p className="text-xl font-bold text-text-primary tabular-nums leading-none">
                    {stats.topMood ? stats.topMood[1] : stats.thisMonthEntries}
                  </p>
                  <p className="text-2xs text-text-muted mt-1 uppercase tracking-wide">
                    {stats.topMood ? 'Mood top' : 'Este mes'}
                  </p>
                </Card>
              </div>
            )}

            {/* Mini month calendar */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {format(new Date(), 'MMMM yyyy', { locale: es })}
                </h3>
                <span className="text-2xs text-text-muted tabular-nums">
                  {stats?.thisMonthEntries || 0} entradas
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
                  <div key={d} className="text-2xs text-text-muted text-center font-semibold py-1 uppercase">
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
                        if (!isFuture) openWriteMode(day);
                      }}
                      className={cn(
                        'relative h-9 flex flex-col items-center justify-center rounded-lg text-xs font-medium tabular-nums',
                        'transition-colors duration-150 ease-out',
                        isFuture && 'opacity-25 cursor-not-allowed',
                        isTodayCell && !hasEntry && 'ring-1 ring-primary/60 text-text-primary',
                        isTodayCell && hasEntry && 'ring-1 ring-primary',
                        hasEntry
                          ? 'bg-primary-soft text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-hover',
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {entry?.mood && (
                        <span className="text-2xs leading-none mt-0.5">{entry.mood}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Entries list */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 px-1">
                Entradas recientes
              </h3>
              {entries.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-soft flex items-center justify-center">
                    <BookOpen size={24} className="text-primary" />
                  </div>
                  <p className="text-base font-semibold text-text-primary mb-1">Tu diario esta vacio</p>
                  <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
                    Escribi tu primera entrada para empezar a registrar como te sentis.
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => {
                    const isExpanded = expandedEntry === entry.id;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025, duration: 0.18, ease: 'easeOut' }}
                        layout
                      >
                        <Card className="overflow-hidden p-0">
                          <button
                            className="w-full text-left p-4 hover:bg-surface-hover transition-colors duration-150"
                            onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                                {formatDisplayDate(entry.date)}
                              </span>
                              {entry.mood && (
                                <span className="text-lg leading-none">{entry.mood}</span>
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
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-border/60">
                                  <button
                                    onClick={() => openWriteMode(parseISO(entry.date))}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors h-9 px-2"
                                  >
                                    <Pencil size={13} />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(entry)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80 transition-colors h-9 px-2"
                                  >
                                    <Trash2 size={13} />
                                    Eliminar
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
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
        description="Seguro que queres eliminar esta entrada del diario? No se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
