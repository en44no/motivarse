import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Save, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDisplayDate } from '../../lib/date-utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
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

  return (
    <motion.div
      key="write"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Date navigation */}
      <Card className="p-2 flex items-center justify-between">
        <IconButton
          variant="ghost"
          size="md"
          aria-label="Dia anterior"
          onClick={onPrevDay}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary capitalize">
            {formatDisplayDate(writeDate)}
          </p>
          {isToday && (
            <p className="text-2xs text-primary font-semibold uppercase tracking-wide">
              Hoy
            </p>
          )}
        </div>
        <IconButton
          variant="ghost"
          size="md"
          aria-label="Dia siguiente"
          onClick={onNextDay}
          disabled={isToday}
        >
          <ChevronRight size={20} />
        </IconButton>
      </Card>

      {/* Mood selector */}
      <MoodSelector mood={mood} onSelect={onMoodSelect} options={MOOD_OPTIONS} />

      {/* Paper-like textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Como fue tu dia?"
          className={cn(
            'w-full min-h-[240px] max-h-[480px] resize-none rounded-2xl',
            'bg-surface border border-border/60 p-5 text-sm text-text-primary leading-relaxed',
            'placeholder:text-text-muted/60',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
            'transition-colors duration-150 ease-out',
            'shadow-sm',
          )}
          rows={8}
        />
        {/* Char count */}
        {content.length > 0 && (
          <div className="absolute bottom-3 right-4 text-2xs text-text-muted/60 tabular-nums pointer-events-none">
            {content.length} {content.length === 1 ? 'caracter' : 'caracteres'}
          </div>
        )}
      </div>

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={saveStatus === 'saving' || (!hasChanges && saveStatus !== 'saved')}
        variant={saveStatus === 'saved' ? 'ghost' : hasChanges ? 'primary' : 'ghost'}
        size="lg"
        className={cn(
          'w-full',
          saveStatus === 'saved' && 'bg-primary-soft text-primary',
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
