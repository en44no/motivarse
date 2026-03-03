import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useJournal } from '../../hooks/useJournal';
import { JournalSheet } from './JournalSheet';

export function JournalCard() {
  const { entries, todayEntry, saveEntry, deleteEntry } = useJournal();
  const [sheetOpen, setSheetOpen] = useState(false);

  const preview = todayEntry?.content
    ? todayEntry.content.length > 60
      ? todayEntry.content.slice(0, 60) + '...'
      : todayEntry.content
    : null;

  return (
    <>
      <motion.button
        className={cn(
          'w-full text-left bg-surface rounded-2xl border border-border p-4',
          'flex items-center gap-3 shadow-sm',
          'hover:bg-surface-hover transition-colors active:scale-[0.98]',
        )}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSheetOpen(true)}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg">📝</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {preview ? (
            <>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-semibold text-text-primary">Mi diario</p>
                {todayEntry?.mood && (
                  <span className="text-sm">{todayEntry.mood}</span>
                )}
              </div>
              <p className="text-xs text-text-muted truncate">{preview}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-primary">Mi diario</p>
              <p className="text-xs text-text-muted">Tocá para escribir</p>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 shrink-0">
          <Lock size={12} className="text-text-muted/50" />
          <ChevronRight size={16} className="text-text-muted/40" />
        </div>
      </motion.button>

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
