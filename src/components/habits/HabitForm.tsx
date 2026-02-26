import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import type { Habit } from '../../types/habit';

const COLORS = ['#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#eab308'];

const DAY_LABELS = [
  { value: 1, short: 'L', label: 'Lunes' },
  { value: 2, short: 'M', label: 'Martes' },
  { value: 3, short: 'X', label: 'Miércoles' },
  { value: 4, short: 'J', label: 'Jueves' },
  { value: 5, short: 'V', label: 'Viernes' },
  { value: 6, short: 'S', label: 'Sábado' },
  { value: 0, short: 'D', label: 'Domingo' },
];

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: Habit['type'];
    category: Habit['category'];
    icon: string;
    color: string;
    frequency: Habit['frequency'];
    customDays?: number[];
    scope: Habit['scope'];
    completionMode?: Habit['completionMode'];
  }) => void;
}

export function HabitForm({ open, onClose, onSubmit }: HabitFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [scope, setScope] = useState<Habit['scope']>('individual');
  const [completionMode, setCompletionMode] = useState<Habit['completionMode']>('both');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);

  function toggleDay(day: number) {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (frequency === 'custom' && customDays.length === 0) return;

    onSubmit({
      name: name.trim(),
      type: 'boolean',
      category: 'custom',
      icon: 'Target',
      color,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      scope,
      completionMode: scope === 'shared' ? completionMode : undefined,
    });
    setName('');
    setScope('individual');
    setCompletionMode('both');
    setFrequency('daily');
    setCustomDays([]);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo hábito">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del hábito"
          placeholder="Ej: Meditar 10 minutos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: color === c ? `0 0 12px ${c}60` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Frequency selector */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Frecuencia</label>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { value: 'daily', label: 'Todos los días' },
              { value: 'weekdays', label: 'Lunes a viernes' },
              { value: 'weekends', label: 'Fines de semana' },
              { value: 'custom', label: 'Días específicos' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-medium transition-all',
                  frequency === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-alt text-text-muted hover:text-text-secondary'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom days picker */}
        {frequency === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Seleccioná los días</label>
            <div className="flex gap-1.5 justify-between">
              {DAY_LABELS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'w-9 h-9 rounded-full text-xs font-bold transition-all',
                    customDays.includes(day.value)
                      ? 'bg-primary text-white shadow-sm shadow-primary/30'
                      : 'bg-surface-alt text-text-muted hover:text-text-secondary'
                  )}
                  title={day.label}
                >
                  {day.short}
                </button>
              ))}
            </div>
            {customDays.length === 0 && (
              <p className="text-xs text-danger mt-1.5">Elegí al menos un día</p>
            )}
          </div>
        )}

        {/* Scope toggle: Individual vs Compartido */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Alcance</label>
          <div className="flex rounded-xl bg-surface-alt p-1 gap-1">
            <button
              type="button"
              onClick={() => setScope('individual')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                scope === 'individual'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setScope('shared')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                scope === 'shared'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Compartido
            </button>
          </div>
        </div>

        {/* Completion mode toggle - only for shared */}
        {scope === 'shared' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Modo de completado</label>
            <div className="flex rounded-xl bg-surface-alt p-1 gap-1">
              <button
                type="button"
                onClick={() => setCompletionMode('any')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                  completionMode === 'any'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Con uno alcanza
              </button>
              <button
                type="button"
                onClick={() => setCompletionMode('both')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                  completionMode === 'both'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Ambos deben cumplir
              </button>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg">
          <Plus size={18} />
          Crear hábito
        </Button>
      </form>
    </Dialog>
  );
}
