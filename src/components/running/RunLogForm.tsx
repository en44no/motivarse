import { useState, useEffect, type FormEvent } from 'react';
import { Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { MoodSelector } from './MoodSelector';

interface RunLogFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    durationMinutes: number;
    distanceKm?: number;
    mood: 1 | 2 | 3 | 4 | 5;
    note?: string;
    paceMinKm?: string;
    isFreeRun?: boolean;
    isSharedRun?: boolean;
  }) => void;
  suggestedDuration?: number;
  defaultFreeRun?: boolean;
}

export function RunLogForm({ open, onClose, onSubmit, suggestedDuration, defaultFreeRun = false }: RunLogFormProps) {
  const [isFreeRun, setIsFreeRun] = useState(defaultFreeRun);
  const [isSharedRun, setIsSharedRun] = useState(true);
  const [duration, setDuration] = useState(suggestedDuration?.toString() || '30');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState('');

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setIsFreeRun(defaultFreeRun);
      setIsSharedRun(true);
      if (!defaultFreeRun && suggestedDuration) {
        setDuration(suggestedDuration.toString());
      } else if (defaultFreeRun) {
        setDuration('30');
      }
    }
  }, [open, defaultFreeRun, suggestedDuration]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      durationMinutes: parseInt(duration) || 0,
      distanceKm: distance ? parseFloat(distance) : undefined,
      mood,
      note: note.trim() || undefined,
      paceMinKm: pace.trim() || undefined,
      isFreeRun: isFreeRun || undefined,
      isSharedRun: isFreeRun ? isSharedRun : true,
    });
    // Reset form
    setPace('');
    setNote('');
    setDistance('');
    onClose();
  }

  const formId = 'run-log-form';
  const canSubmit = (parseInt(duration) || 0) > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isFreeRun ? 'Registrar carrera libre' : 'Registrar sesión CaCo'}
      subtitle={isFreeRun ? 'Entrada libre sin plan' : 'Sesión del plan Couch a Corredor'}
      footer={
        <Button
          type="submit"
          form={formId}
          className="w-full"
          size="lg"
          disabled={!canSubmit}
        >
          <Play size={18} />
          {isFreeRun ? 'Registrar carrera libre' : 'Registrar sesión'}
        </Button>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {/* Toggle CaCo / Libre */}
        <div
          role="tablist"
          aria-label="Tipo de carrera"
          className="flex rounded-xl border border-border bg-surface-hover p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isFreeRun}
            onClick={() => setIsFreeRun(false)}
            className={cn(
              'flex-1 min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              !isFreeRun
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Sesión CaCo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isFreeRun}
            onClick={() => setIsFreeRun(true)}
            className={cn(
              'flex-1 min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              isFreeRun
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            Carrera libre
          </button>
        </div>

        {/* Shared toggle - only for free runs */}
        {isFreeRun && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text-secondary">
              ¿Corriste en pareja?
            </span>
            <div
              role="radiogroup"
              aria-label="Tipo de compañía"
              className="flex rounded-xl bg-surface-alt p-1 gap-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={isSharedRun}
                onClick={() => setIsSharedRun(true)}
                className={cn(
                  'flex-1 min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  isSharedRun
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Juntos
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!isSharedRun}
                onClick={() => setIsSharedRun(false)}
                className={cn(
                  'flex-1 min-h-11 px-3 rounded-lg text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  !isSharedRun
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Solo/a
              </button>
            </div>
          </div>
        )}

        <Input
          label="Duración (minutos)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
          placeholder="30"
          inputMode="numeric"
          min={1}
        />

        {isFreeRun && (
          <>
            <Input
              label="Distancia (km, opcional)"
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="3.5"
              inputMode="decimal"
            />

            <Input
              label="Ritmo (min/km, opcional)"
              type="text"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              placeholder="6:30"
            />
          </>
        )}

        <MoodSelector value={mood} onChange={setMood} />

        <div className="space-y-2">
          <label
            htmlFor="run-log-note"
            className="block text-sm font-medium text-text-secondary"
          >
            Nota (opcional)
          </label>
          <textarea
            id="run-log-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-hover px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-colors"
            rows={3}
            placeholder="¿Cómo estuvo la sesión?"
          />
        </div>
      </form>
    </Dialog>
  );
}
