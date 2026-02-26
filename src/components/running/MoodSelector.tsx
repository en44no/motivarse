import { cn } from '../../lib/utils';
import { MOOD_OPTIONS } from '../../config/constants';

interface MoodSelectorProps {
  value: number;
  onChange: (mood: 1 | 2 | 3 | 4 | 5) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">¿Cómo te sentiste?</label>
      <div className="flex justify-between gap-2">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value as 1 | 2 | 3 | 4 | 5)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1',
              value === option.value
                ? 'bg-primary-soft ring-2 ring-primary scale-105'
                : 'bg-surface-hover hover:bg-surface-light'
            )}
          >
            <span className="text-xl">{option.emoji}</span>
            <span className="text-[10px] text-text-muted">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
