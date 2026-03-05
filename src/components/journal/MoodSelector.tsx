import { cn } from '../../lib/utils';

interface MoodOption {
  emoji: string;
  label: string;
}

interface MoodSelectorProps {
  mood: string | undefined;
  onSelect: (emoji: string) => void;
  options: MoodOption[];
}

export function MoodSelector({ mood, onSelect, options }: MoodSelectorProps) {
  return (
    <div>
      <p className="text-xs text-text-muted mb-2 px-1">¿Cómo te sentís?</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.emoji}
            onClick={() => onSelect(opt.emoji)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all',
              mood === opt.emoji
                ? 'bg-primary/10 ring-2 ring-primary/40 scale-105'
                : 'bg-surface border border-border hover:bg-surface-hover',
            )}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-[9px] text-text-muted">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
