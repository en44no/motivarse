import { useState } from 'react';
import { Lock, ChevronRight, BookOpen } from 'lucide-react';
import { useJournal } from '../../hooks/useJournal';
import { Card } from '../ui/Card';
import { JournalSheet } from './JournalSheet';

export function JournalCard() {
  const { entries, todayEntry, saveEntry, deleteEntry } = useJournal();
  const [sheetOpen, setSheetOpen] = useState(false);

  const preview = todayEntry?.content
    ? todayEntry.content.length > 70
      ? todayEntry.content.slice(0, 70) + '...'
      : todayEntry.content
    : null;

  return (
    <>
      <Card
        variant="interactive"
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-3 p-4"
      >
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
          <BookOpen size={20} className="text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-semibold text-text-primary">Mi diario</p>
            {todayEntry?.mood && (
              <span className="text-sm leading-none">{todayEntry.mood}</span>
            )}
          </div>
          {preview ? (
            <p className="text-xs text-text-muted truncate leading-relaxed">{preview}</p>
          ) : (
            <p className="text-xs text-text-muted">Toca para escribir</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 shrink-0 text-text-muted/50">
          <Lock size={12} />
          <ChevronRight size={16} />
        </div>
      </Card>

      <JournalSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        entries={entries}
        onSave={saveEntry}
        onDelete={deleteEntry}
      />
    </>
  );
}
