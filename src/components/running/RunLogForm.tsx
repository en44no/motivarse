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

  return (
    <Dialog open={open} onClose={onClose} title={isFreeRun ? 'Registrar carrera libre' : 'Registrar sesión CaCo'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle CaCo / Libre */}
        <div className="flex rounded-xl border border-border bg-surface-hover p-1 gap-1">
          <button
            type="button"
            onClick={() => setIsFreeRun(false)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              !isFreeRun
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Sesión CaCo
          </button>
          <button
            type="button"
            onClick={() => setIsFreeRun(true)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              isFreeRun
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Carrera libre
          </button>
        </div>

        {/* Shared toggle - only for free runs */}
        {isFreeRun && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">¿Corriste en pareja?</label>
            <div className="flex rounded-xl bg-surface-alt p-1 gap-1">
              <button
                type="button"
                onClick={() => setIsSharedRun(true)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                  isSharedRun
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                Juntos
              </button>
              <button
                type="button"
                onClick={() => setIsSharedRun(false)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                  !isSharedRun
                    ? 'bg-primary text-white shadow-sm'
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

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Nota (opcional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-hover px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={2}
            placeholder="¿Cómo estuvo la sesión?"
          />
        </div>

        <Button type="submit" className="w-full" size="lg">
          <Play size={18} />
          {isFreeRun ? 'Registrar carrera libre' : 'Registrar sesión'}
        </Button>
      </form>
    </Dialog>
  );
}
