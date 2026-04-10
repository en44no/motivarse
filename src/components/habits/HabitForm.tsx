import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Save, Bell } from 'lucide-react';
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
    reminder?: Habit['reminder'];
  }) => void;
  editingHabit?: Habit;
}

export function HabitForm({ open, onClose, onSubmit, editingHabit }: HabitFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [scope, setScope] = useState<Habit['scope']>('individual');
  const [completionMode, setCompletionMode] = useState<Habit['completionMode']>('both');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

  const isEditing = !!editingHabit;
  const formId = 'habit-form';

  // Pre-fill form when editing
  useEffect(() => {
    if (open && editingHabit) {
      setName(editingHabit.name);
      setColor(editingHabit.color);
      setScope(editingHabit.scope);
      setCompletionMode(editingHabit.completionMode || 'both');
      setFrequency(editingHabit.frequency);
      setCustomDays(editingHabit.customDays || []);
      setReminderEnabled(editingHabit.reminder?.enabled ?? false);
      setReminderTime(editingHabit.reminder?.time ?? '09:00');
    } else if (open && !editingHabit) {
      setName('');
      setColor(COLORS[0]);
      setScope('individual');
      setCompletionMode('both');
      setFrequency('daily');
      setCustomDays([]);
      setReminderEnabled(false);
      setReminderTime('09:00');
    }
  }, [open, editingHabit]);

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
      reminder: reminderEnabled ? { enabled: true, time: reminderTime } : undefined,
    });
    setName('');
    setScope('individual');
    setCompletionMode('both');
    setFrequency('daily');
    setCustomDays([]);
    setReminderEnabled(false);
    setReminderTime('09:00');
    onClose();
  }

  const canSubmit =
    name.trim().length > 0 && (frequency !== 'custom' || customDays.length > 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar hábito' : 'Nuevo hábito'}
      subtitle={
        isEditing
          ? 'Ajustá los detalles del hábito'
          : 'Creá un hábito personalizado'
      }
      footer={
        <Button
          type="submit"
          form={formId}
          className="w-full"
          size="lg"
          disabled={!canSubmit}
        >
          {isEditing ? <Save size={18} /> : <Plus size={18} />}
          {isEditing ? 'Guardar cambios' : 'Crear hábito'}
        </Button>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nombre del hábito"
          placeholder="Ej: Meditar 10 minutos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-2">
          <span className="block text-sm font-medium text-text-secondary">Color</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className="w-11 h-11 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface flex items-center justify-center"
              >
                <span
                  className="block rounded-full"
                  style={{
                    backgroundColor: c,
                    width: color === c ? '28px' : '24px',
                    height: color === c ? '28px' : '24px',
                    boxShadow: color === c ? `0 0 12px ${c}60` : 'none',
                    transition: 'all 150ms ease-out',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Frequency selector */}
        <div className="space-y-2">
          <span className="block text-sm font-medium text-text-secondary">Frecuencia</span>
          <div className="grid grid-cols-2 gap-2">
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
                aria-pressed={frequency === opt.value}
                className={cn(
                  'min-h-11 px-3 rounded-xl text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  frequency === opt.value
                    ? 'bg-primary text-primary-contrast shadow-sm'
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
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text-secondary">
              Seleccioná los días
            </span>
            <div
              role="group"
              aria-label="Días de la semana"
              className="flex gap-1.5 justify-between"
            >
              {DAY_LABELS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-label={day.label}
                  aria-pressed={customDays.includes(day.value)}
                  className={cn(
                    'w-11 h-11 rounded-full text-xs font-bold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    customDays.includes(day.value)
                      ? 'bg-primary text-primary-contrast shadow-sm shadow-primary/30'
                      : 'bg-surface-alt text-text-muted hover:text-text-secondary'
                  )}
                  title={day.label}
                >
                  {day.short}
                </button>
              ))}
            </div>
            {customDays.length === 0 && (
              <p className="text-xs text-danger mt-1">Elegí al menos un día</p>
            )}
          </div>
        )}

        {/* Scope toggle: Individual vs Compartido */}
        <div className="space-y-2">
          <span className="block text-sm font-medium text-text-secondary">Alcance</span>
          <div
            role="radiogroup"
            aria-label="Alcance del hábito"
            className="flex rounded-xl bg-surface-alt p-1 gap-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={scope === 'individual'}
              onClick={() => setScope('individual')}
              className={cn(
                'flex-1 min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                scope === 'individual'
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Individual
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={scope === 'shared'}
              onClick={() => setScope('shared')}
              className={cn(
                'flex-1 min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                scope === 'shared'
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Compartido
            </button>
          </div>
        </div>

        {/* Completion mode toggle - only for shared */}
        {scope === 'shared' && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text-secondary">
              Modo de completado
            </span>
            <div
              role="radiogroup"
              aria-label="Modo de completado"
              className="flex rounded-xl bg-surface-alt p-1 gap-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={completionMode === 'any'}
                onClick={() => setCompletionMode('any')}
                className={cn(
                  'flex-1 min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  completionMode === 'any'
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Con uno alcanza
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={completionMode === 'both'}
                onClick={() => setCompletionMode('both')}
                className={cn(
                  'flex-1 min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  completionMode === 'both'
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Ambos deben cumplir
              </button>
            </div>
          </div>
        )}

        {/* Reminder toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Bell size={16} />
              Recordatorio
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={reminderEnabled}
              aria-label="Activar recordatorio"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors shrink-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                reminderEnabled ? 'bg-primary' : 'bg-surface-alt'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                  reminderEnabled && 'translate-x-5'
                )}
              />
            </button>
          </div>
          {reminderEnabled && (
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              aria-label="Hora del recordatorio"
              className="w-full rounded-xl bg-surface-hover border border-border px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          )}
        </div>
      </form>
    </Dialog>
  );
}
