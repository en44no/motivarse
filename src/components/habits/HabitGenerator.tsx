import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, User, Plus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog';
import { generateHabits, type GeneratedHabit } from '../../services/ai.service';
import { useHabits } from '../../hooks/useHabits';
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

  return (
    <Dialog open={open} onClose={handleClose} className="space-y-0 p-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Generador de hábitos</h2>
        </div>
        <p className="text-xs text-text-muted ml-10.5">
          Contame tu objetivo y la IA te sugiere hábitos
        </p>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* Goal input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            ¿Cuál es tu objetivo?
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder='ej: "quiero dormir mejor" o "correr más seguido"'
            className="w-full rounded-xl border border-border bg-surface-hover px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
        </div>

        {/* Scope selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Para
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('individual')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                scope === 'individual'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-secondary hover:bg-surface-light'
              }`}
            >
              <User size={15} />
              Personal
            </button>
            <button
              type="button"
              onClick={() => setScope('shared')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                scope === 'shared'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-surface-hover text-text-secondary hover:bg-surface-light'
              }`}
            >
              <Users size={15} />
              Pareja 💑
            </button>
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!goal.trim() || loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white font-semibold text-sm shadow-md shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generando hábitos...
            </>
          ) : habits.length > 0 ? (
            <>
              <RefreshCw size={16} />
              Regenerar
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generar hábitos
            </>
          )}
        </button>

        {/* Results */}
        <AnimatePresence>
          {habits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium">Sugerencias</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {habits.map((habit, i) => {
                const added = addedIds.has(i);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      added
                        ? 'bg-primary/8 border-primary/25 opacity-60'
                        : 'bg-surface-hover border-border hover:border-border-hover'
                    }`}
                  >
                    {/* Icon + color dot */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${habit.color || HABIT_COLORS[i % HABIT_COLORS.length]}20` }}
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
                    <button
                      type="button"
                      onClick={() => !added && handleAdd(habit, i)}
                      disabled={added}
                      className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        added
                          ? 'bg-primary/20 text-primary cursor-default'
                          : 'bg-primary text-white hover:bg-primary-hover active:scale-90'
                      }`}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
