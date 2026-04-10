import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Plus,
  RotateCcw,
  Droplet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { MiniConfetti } from '../ui/MiniConfetti';
import { ProgressBar } from '../ui/ProgressBar';
import { HabitStreakBadge } from './HabitStreakBadge';
import { WaterDrop } from './WaterDrop';
import { useWater } from '../../hooks/useWater';
import { useDensity } from '../../contexts/DensityContext';
import { vibrateSuccess, vibrateMilestone } from '../../lib/celebration-utils';
import { playSuccess, playCelebration } from '../../lib/sound-utils';
import { WATER_GOAL_ML, WATER_QUICK_AMOUNTS } from '../../types/water';
import type { Habit, HabitLog, HabitStreak } from '../../types/habit';

interface WaterCardProps {
  habit: Habit;
  log?: HabitLog;
  streak?: HabitStreak;
  partnerName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  soundEnabled?: boolean;
  isDragging?: boolean;
  reorderable?: boolean;
  isPastDate?: boolean;
  selectedDate?: string;
}

function formatAmount(ml: number): string {
  if (ml >= 1000) {
    const l = ml / 1000;
    return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
  }
  return `${ml}ml`;
}

export const WaterCard = memo(function WaterCard({
  habit,
  log,
  streak,
  partnerName,
  onEdit,
  onDelete,
  soundEnabled = true,
  isDragging = false,
  reorderable = false,
  selectedDate,
}: WaterCardProps) {
  const { isCompact } = useDensity();
  const { myTotal, partnerTotal, isGoalMet, addIntake, resetDay } = useWater(
    habit.id,
    selectedDate
  );
  const [showMenu, setShowMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const prevGoalMet = useRef(isGoalMet);

  const fillPercent = Math.min(myTotal / WATER_GOAL_ML, 1);
  const isShared = habit.scope === 'shared';

  // Detect when goal is first met → celebrate
  useEffect(() => {
    if (isGoalMet && !prevGoalMet.current) {
      setShowConfetti(true);
      vibrateMilestone();
      if (soundEnabled) playCelebration();
    }
    prevGoalMet.current = isGoalMet;
  }, [isGoalMet, soundEnabled]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  async function handleQuickAdd(amount: number) {
    vibrateSuccess();
    if (soundEnabled) playSuccess();
    await addIntake(amount);
  }

  async function handleCustomAdd() {
    const amount = parseInt(customAmount, 10);
    if (!amount || amount <= 0 || amount > 5000) return;
    vibrateSuccess();
    if (soundEnabled) playSuccess();
    await addIntake(amount);
    setCustomAmount('');
    setShowCustom(false);
  }

  // Compact row: shrunken, inline progress bar + quick-add
  if (isCompact) {
    const percent = Math.round(fillPercent * 100);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ layout: { duration: 0.18, ease: 'easeOut' }, duration: 0.15 }}
      >
        <div
          className={cn(
            'relative rounded-2xl border bg-surface px-3 py-2.5 shadow-sm border-t-white/[0.04]',
            'transition-colors duration-150',
            isGoalMet
              ? 'border-l-2 border-info/20'
              : 'border-border/60',
            isDragging && 'shadow-xl scale-[1.01] z-50'
          )}
          style={isGoalMet ? { borderLeftColor: 'var(--color-info)' } : undefined}
        >
          {showConfetti && (
            <MiniConfetti onComplete={() => setShowConfetti(false)} />
          )}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-info-soft text-info"
              aria-hidden
            >
              <Droplet size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    'text-sm font-semibold truncate',
                    isGoalMet ? 'text-text-primary' : 'text-text-secondary'
                  )}
                >
                  {habit.name}
                </h3>
                {streak && <HabitStreakBadge streak={streak.currentStreak} />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-surface-light overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-info"
                    initial={false}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-2xs font-mono text-text-muted tabular-nums shrink-0">
                  {formatAmount(myTotal)}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleQuickAdd(250)}
              aria-label="Agregar 250 ml de agua"
              className="w-11 h-11 rounded-full bg-info-soft text-info hover:bg-info/20 active:scale-95 transition-all duration-150 inline-flex items-center justify-center shrink-0"
            >
              <Plus size={18} />
            </button>
            {reorderable && (
              <div className="shrink-0 text-text-muted/40 touch-none">
                <GripVertical size={14} />
              </div>
            )}
            {(onEdit || onDelete) && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Opciones"
                  className="w-9 h-9 -mr-1 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]"
                  >
                    {onEdit && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Cozy: full card with drop, quick-adds, partner
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ layout: { duration: 0.18, ease: 'easeOut' }, duration: 0.15 }}
    >
      <Card
        className={cn(
          'transition-colors duration-150 relative overflow-hidden',
          isGoalMet &&
            'bg-gradient-to-r from-info-soft/50 to-transparent border-info/20 border-l-2',
          isDragging && 'shadow-xl scale-[1.02] z-50 relative'
        )}
        style={isGoalMet ? { borderLeftColor: 'var(--color-info)' } : undefined}
      >
        {showConfetti && (
          <MiniConfetti onComplete={() => setShowConfetti(false)} />
        )}

        {/* Header: name + streak + menu */}
        <div className="flex items-center gap-2 mb-3">
          <h3
            className={cn(
              'text-sm font-semibold truncate flex-1',
              isGoalMet ? 'text-text-primary' : 'text-text-secondary'
            )}
          >
            {habit.name}
          </h3>
          {streak && <HabitStreakBadge streak={streak.currentStreak} />}

          {reorderable && (
            <div className="shrink-0 text-text-muted/40 touch-none">
              <GripVertical size={16} />
            </div>
          )}

          {(onEdit || onDelete) && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Opciones"
                className="w-9 h-9 -mr-1 -mt-1 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px]"
                >
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Water drop visual */}
        <div className="flex justify-center py-1">
          <WaterDrop
            fillPercent={fillPercent}
            totalMl={myTotal}
            goalMl={WATER_GOAL_ML}
          />
        </div>

        {/* Quick-add buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {WATER_QUICK_AMOUNTS.map((item) => (
            <motion.button
              key={item.amount}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleQuickAdd(item.amount)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold',
                'bg-info-soft text-info border border-info/20',
                'hover:bg-info/20 active:bg-info/25',
                'transition-colors duration-150'
              )}
            >
              {item.label}
            </motion.button>
          ))}

          {/* Custom toggle */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setShowCustom(!showCustom);
            }}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
              showCustom
                ? 'bg-info/25 text-info border border-info/30'
                : 'bg-surface-light text-text-muted border border-border/60 hover:bg-info/10'
            )}
          >
            Custom
          </motion.button>
        </div>

        {/* Custom amount inline input */}
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-2 mt-2"
          >
            <div className="flex-1 flex items-center bg-surface-light rounded-xl border border-border/60 px-3 py-1.5">
              <input
                ref={customInputRef}
                type="number"
                inputMode="numeric"
                aria-label="Cantidad de agua en mililitros"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                placeholder="250"
                className="w-full bg-transparent text-sm text-text-primary outline-none font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-2xs text-text-muted ml-1 shrink-0">
                ml
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleCustomAdd}
              disabled={!customAmount || parseInt(customAmount, 10) <= 0}
              aria-label="Agregar cantidad personalizada"
              className={cn(
                'w-11 h-11 rounded-xl transition-colors duration-150 inline-flex items-center justify-center',
                customAmount && parseInt(customAmount, 10) > 0
                  ? 'bg-info-soft text-info hover:bg-info/25'
                  : 'bg-surface-light text-text-muted/40'
              )}
            >
              <Plus size={18} />
            </motion.button>
          </motion.div>
        )}

        {/* Partner progress */}
        {isShared && partnerName && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xs text-text-muted">{partnerName}</span>
              <span className="text-2xs font-mono tabular-nums text-text-secondary">
                {formatAmount(partnerTotal)} / {formatAmount(WATER_GOAL_ML)}
              </span>
            </div>
            <ProgressBar
              value={Math.min((partnerTotal / WATER_GOAL_ML) * 100, 100)}
              size="sm"
              color={partnerTotal >= WATER_GOAL_ML ? 'primary' : 'secondary'}
            />
          </div>
        )}

        {/* Reset button */}
        {myTotal > 0 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={resetDay}
              className="flex items-center gap-1.5 px-3 h-9 text-2xs text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-hover transition-colors duration-150"
            >
              <RotateCcw size={12} />
              Reiniciar día
            </button>
          </div>
        )}
      </Card>
    </motion.div>
  );
});
