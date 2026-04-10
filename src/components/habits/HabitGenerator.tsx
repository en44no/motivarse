import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, User, Plus, Loader2, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { generateHabits, type GeneratedHabit } from '../../services/ai.service';
import { useHabits } from '../../hooks/useHabits';
import { cn } from '../../lib/utils';
import type { HabitScope } from '../../types/habit';

interface HabitGeneratorProps {
  open: boolean;
  onClose: () => void;
}

const HABIT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

export function HabitGenerator({ open, onClose }: HabitGeneratorProps) {
  const [goal, setGoal] = useState('');
  const [scope, setScope] = useState<HabitScope>('individual');
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = useState<GeneratedHabit[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const { myHabits, addCustomHabit } = useHabits();

  async function handleGenerate() {
    const trimmed = goal.trim();
    if (!trimmed) return;

    setLoading(true);
    setHabits([]);
    setAddedIds(new Set());

    const existingNames = myHabits.map((h) => h.name);
    const result = await generateHabits(trimmed, scope, existingNames);

    setLoading(false);

    if (result.length === 0) {
      toast.error('No se pudo generar hábitos. Intentá de nuevo.');
      return;
    }
    setHabits(result);
  }

  async function handleAdd(habit: GeneratedHabit, index: number) {
    await addCustomHabit({
      name: habit.name,
      type: 'boolean',
      category: habit.category,
      icon: habit.icon,
      color: habit.color || HABIT_COLORS[index % HABIT_COLORS.length],
      frequency: habit.frequency,
      scope,
    });
    setAddedIds((prev) => new Set(prev).add(index));
  }

  function handleClose() {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setGoal('');
      setHabits([]);
      setAddedIds(new Set());
      setLoading(false);
    }, 300);
  }

  const canGenerate = goal.trim().length > 0 && !loading;
  const hasResults = habits.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Generador de hábitos"
      subtitle="Contame tu objetivo y la IA sugiere hábitos"
      footer={
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generando hábitos...
            </>
          ) : hasResults ? (
            <>
              <RefreshCw size={18} />
              Regenerar
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generar hábitos
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Goal input */}
        <div className="space-y-2">
          <label
            htmlFor="habit-gen-goal"
            className="block text-2xs font-semibold text-text-muted uppercase tracking-wider"
          >
            ¿Cuál es tu objetivo?
          </label>
          <input
            id="habit-gen-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGenerate) handleGenerate();
            }}
            placeholder='ej: "quiero dormir mejor" o "correr más seguido"'
            className="w-full rounded-xl border border-border bg-surface-hover px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        {/* Scope selector */}
        <div className="space-y-2">
          <span className="block text-2xs font-semibold text-text-muted uppercase tracking-wider">
            Para
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('individual')}
              aria-pressed={scope === 'individual'}
              className={cn(
                'inline-flex items-center justify-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                scope === 'individual'
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'bg-surface-hover text-text-secondary hover:bg-surface-light'
              )}
            >
              <User size={16} />
              Personal
            </button>
            <button
              type="button"
              onClick={() => setScope('shared')}
              aria-pressed={scope === 'shared'}
              className={cn(
                'inline-flex items-center justify-center gap-2 min-h-11 px-3 rounded-xl text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                scope === 'shared'
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'bg-surface-hover text-text-secondary hover:bg-surface-light'
              )}
            >
              <Users size={16} />
              Pareja
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-2xs text-text-muted font-semibold uppercase tracking-wider">
                  Sugerencias
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {habits.map((habit, i) => {
                const added = addedIds.has(i);
                const color = habit.color || HABIT_COLORS[i % HABIT_COLORS.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl border transition-colors',
                      added
                        ? 'bg-primary-soft border-primary/30'
                        : 'bg-surface-hover border-border hover:border-border-light'
                    )}
                  >
                    {/* Icon + color dot */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {habit.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                        {habit.name}
                      </p>
                      {habit.description && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                          {habit.description}
                        </p>
                      )}
                    </div>

                    {/* Add button */}
                    <IconButton
                      aria-label={added ? 'Hábito agregado' : `Agregar ${habit.name}`}
                      variant={added ? 'subtle' : 'solid'}
                      size="md"
                      disabled={added}
                      onClick={() => !added && handleAdd(habit, i)}
                    >
                      {added ? <Check size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
                    </IconButton>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty hint */}
        {!hasResults && !loading && (
          <div className="rounded-2xl border border-dashed border-border bg-surface-hover/40 px-4 py-5 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary-soft flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Escribí tu objetivo y pulsá <span className="font-semibold text-text-secondary">Generar hábitos</span>.
              <br />
              La IA va a sugerirte hábitos personalizados.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
