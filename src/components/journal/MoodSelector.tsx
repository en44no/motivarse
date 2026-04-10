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
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
        Como te sentis?
      </p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const selected = mood === opt.emoji;
          return (
            <button
              key={opt.emoji}
              onClick={() => onSelect(opt.emoji)}
              className={cn(
                'flex-1 min-h-12 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl',
                'transition-colors duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                selected
                  ? 'bg-primary-soft ring-1 ring-primary/60'
                  : 'bg-surface border border-border/60 hover:bg-surface-hover',
              )}
              aria-label={opt.label}
              aria-pressed={selected}
            >
              <span className="text-2xl leading-none">{opt.emoji}</span>
              <span className={cn(
                'text-2xs font-medium',
                selected ? 'text-primary' : 'text-text-muted',
              )}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
