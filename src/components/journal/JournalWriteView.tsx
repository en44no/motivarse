import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Save, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDisplayDate } from '../../lib/date-utils';
import { Button } from '../ui/Button';
import { MoodSelector } from './MoodSelector';
import { MOOD_OPTIONS } from '../../config/constants';

interface JournalWriteViewProps {
  writeDate: Date;
  isToday: boolean;
  content: string;
  mood: string | undefined;
  saveStatus: 'idle' | 'saving' | 'saved';
  hasChanges: boolean;
  onContentChange: (value: string) => void;
  onMoodSelect: (emoji: string) => void;
  onSave: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export function JournalWriteView({
  writeDate,
  isToday,
  content,
  mood,
  saveStatus,
  hasChanges,
  onContentChange,
  onMoodSelect,
  onSave,
  onPrevDay,
  onNextDay,
}: JournalWriteViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Focus textarea when entering write mode
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, []);

  return (
    <motion.div
      key="write"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="space-y-4"
    >
      {/* Date navigation */}
      <div className="flex items-center justify-between bg-surface rounded-2xl border border-border p-2">
        <button
          onClick={onPrevDay}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-text-primary">
          {formatDisplayDate(writeDate)}
        </span>
        <button
          onClick={onNextDay}
          disabled={isToday}
          className={cn(
            'p-2 rounded-xl transition-colors',
            isToday
              ? 'text-text-muted/30 cursor-not-allowed'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-hover',
          )}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Mood selector */}
      <MoodSelector mood={mood} onSelect={onMoodSelect} options={MOOD_OPTIONS} />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="¿Cómo fue tu día?"
        className={cn(
          'w-full min-h-[200px] max-h-[400px] resize-none rounded-2xl',
          'bg-surface border border-border p-4 text-sm text-text-primary leading-relaxed',
          'placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30',
          'transition-all',
        )}
        rows={6}
      />

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={saveStatus === 'saving' || (!hasChanges && saveStatus !== 'saved')}
        variant={saveStatus === 'saved' ? 'ghost' : hasChanges ? 'primary' : 'ghost'}
        size="lg"
        className={cn(
          'w-full',
          saveStatus === 'saved' && 'bg-primary/10 text-primary',
        )}
      >
        {saveStatus === 'saving' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Guardando...
          </>
        ) : saveStatus === 'saved' ? (
          <>
            <Check size={16} />
            Guardado
          </>
        ) : (
          <>
            <Save size={16} />
            Guardar
          </>
        )}
      </Button>
    </motion.div>
  );
}
