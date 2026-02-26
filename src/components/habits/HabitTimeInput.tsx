import { useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface HabitTimeInputProps {
  value: string;
  goalTime?: string;
  comparison?: 'before' | 'after';
  onSubmit: (time: string, metGoal: boolean) => void;
  completed: boolean;
  color: string;
}

export function HabitTimeInput({ value, goalTime, comparison, onSubmit, completed, color }: HabitTimeInputProps) {
  const [time, setTime] = useState(value || new Date().toTimeString().slice(0, 5));

  function handleSubmit() {
    let metGoal = true;
    if (goalTime && comparison) {
      metGoal = comparison === 'before' ? time <= goalTime : time >= goalTime;
    }
    onSubmit(time, metGoal);
  }

  if (completed) {
    const metGoal = goalTime && comparison
      ? (comparison === 'before' ? value <= goalTime : value >= goalTime)
      : true;

    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-mono font-bold',
            metGoal ? 'bg-primary-soft text-primary' : 'bg-secondary-soft text-secondary'
          )}
        >
          <Clock size={14} />
          {value}
        </div>
        {metGoal ? (
          <span className="text-xs text-primary">Meta cumplida ✓</span>
        ) : (
          <span className="text-xs text-secondary">Meta: {comparison === 'before' ? 'antes de' : 'después de'} {goalTime}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="bg-surface-hover border border-border rounded-xl px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <Button size="sm" onClick={handleSubmit}>
        <Check size={16} />
      </Button>
      {goalTime && (
        <span className="text-xs text-text-muted">
          Meta: {comparison === 'before' ? '≤' : '≥'} {goalTime}
        </span>
      )}
    </div>
  );
}
