import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Target, BookOpen, Footprints, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Confetti } from '../ui/Confetti';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { useDataContext } from '../../contexts/DataContext';
import {
  subscribeToActiveChallenge,
  createWeeklyChallenge,
  updateChallengeProgress,
  completeChallenge,
  type Challenge,
  type ChallengeType,
} from '../../services/challenges.service';
import { getToday } from '../../lib/date-utils';
import { startOfWeek, format } from 'date-fns';

const CHALLENGE_TYPES: {
  type: ChallengeType;
  label: string;
  description: string;
  icon: typeof Trophy;
  defaultTarget: number;
  unit: string;
}[] = [
  {
    type: 'habits',
    label: 'Hábitos',
    description: 'Quien completa más hábitos esta semana',
    icon: Target,
    defaultTarget: 20,
    unit: 'hábitos',
  },
  {
    type: 'runs',
    label: 'Carreras',
    description: 'Correr X km entre los dos',
    icon: Footprints,
    defaultTarget: 10,
    unit: 'km',
  },
  {
    type: 'journal',
    label: 'Diario',
    description: 'Escribir en el diario X días',
    icon: BookOpen,
    defaultTarget: 5,
    unit: 'días',
  },
];

function getChallengeConfig(type: ChallengeType) {
  return CHALLENGE_TYPES.find((c) => c.type === type) || CHALLENGE_TYPES[0];
}

export function ChallengeCard() {
  const { user, profile } = useAuthContext();
  const { couple, partnerId, partnerName } = useCoupleContext();
  const { habitLogs, runLogs } = useDataContext();

  const coupleId = profile?.coupleId || couple?.coupleId || null;
  const userId = user?.uid || null;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState<ChallengeType>('habits');
  const [target, setTarget] = useState(20);
  const [creating, setCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Subscribe to active challenge
  useEffect(() => {
    if (!coupleId) return;
    const unsub = subscribeToActiveChallenge(coupleId, setChallenge);
    return () => unsub();
  }, [coupleId]);

  // Auto-calculate progress for habits challenge
  const weekStart = useMemo(() => {
    if (!challenge) return '';
    return challenge.weekStart;
  }, [challenge]);

  useEffect(() => {
    if (!challenge || !userId || challenge.type !== 'habits') return;

    // Count completed habits this week for both users
    const start = challenge.weekStart;
    const today = getToday();
    const myCompleted = habitLogs.filter(
      (l) => l.userId === userId && l.completed && l.date >= start && l.date <= today,
    ).length;

    const currentProgress = challenge.progress[userId] || 0;
    if (myCompleted !== currentProgress) {
      updateChallengeProgress(challenge.id, userId, myCompleted).catch(console.error);
    }
  }, [challenge, userId, habitLogs, weekStart]);

  // Auto-calculate for partner too (runs)
  useEffect(() => {
    if (!challenge || !userId || challenge.type !== 'runs') return;

    const start = challenge.weekStart;
    const today = getToday();
    const myKm = runLogs
      .filter((l) => l.userId === userId && l.date >= start && l.date <= today)
      .reduce((sum, l) => sum + (l.distance || 0), 0);
    const rounded = Math.round(myKm * 10) / 10;

    const currentProgress = challenge.progress[userId] || 0;
    if (rounded !== currentProgress) {
      updateChallengeProgress(challenge.id, userId, rounded).catch(console.error);
    }
  }, [challenge, userId, runLogs, weekStart]);

  // Check if challenge is completed
  useEffect(() => {
    if (!challenge || challenge.status !== 'active') return;
    const config = getChallengeConfig(challenge.type);

    if (challenge.type === 'runs') {
      // Combined distance
      const total = Object.values(challenge.progress).reduce((s, v) => s + v, 0);
      if (total >= challenge.target) {
        completeChallenge(challenge.id).catch(console.error);
        setShowConfetti(true);
        toast.success('Reto completado! 🎉');
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } else {
      // Both users must reach target (or individual competition)
      const myProgress = challenge.progress[userId || ''] || 0;
      const partnerProgress = challenge.progress[partnerId || ''] || 0;
      if (myProgress >= challenge.target || partnerProgress >= challenge.target) {
        completeChallenge(challenge.id).catch(console.error);
        setShowConfetti(true);
        toast.success('Reto completado! 🎉');
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
  }, [challenge, userId, partnerId]);

  const handleCreate = async () => {
    if (!coupleId || creating) return;
    setCreating(true);
    try {
      const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
      await createWeeklyChallenge(coupleId, selectedType, target, weekStartStr);
      toast.success('Reto creado!');
      setShowCreate(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('No se pudo crear el reto');
    } finally {
      setCreating(false);
    }
  };

  if (!coupleId || !partnerId) return null;

  // No active challenge — show "create" button
  if (!challenge && !showCreate) {
    return (
      <Card
        variant="interactive"
        onClick={() => setShowCreate(true)}
        className="bg-gradient-to-r from-secondary/5 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-soft flex items-center justify-center">
            <Trophy size={20} className="text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Reto semanal</p>
            <p className="text-xs text-text-muted">Creá un reto para la pareja</p>
          </div>
          <Plus size={20} className="text-text-muted" />
        </div>
      </Card>
    );
  }

  // Show create form
  if (showCreate) {
    const config = getChallengeConfig(selectedType);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-secondary/30">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-secondary" />
            <h3 className="text-sm font-bold text-text-primary">Nuevo reto semanal</h3>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {CHALLENGE_TYPES.map((ct) => {
              const Icon = ct.icon;
              const isSelected = selectedType === ct.type;
              return (
                <button
                  key={ct.type}
                  onClick={() => {
                    setSelectedType(ct.type);
                    setTarget(ct.defaultTarget);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                    isSelected
                      ? 'border-secondary bg-secondary-soft text-secondary'
                      : 'border-border bg-surface-light text-text-muted hover:border-border-light',
                  )}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium">{ct.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-text-muted mb-3">{config.description}</p>

          {/* Target input */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-text-muted">Meta:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTarget((t) => Math.max(1, t - (config.type === 'runs' ? 1 : 5)))}
                className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-text-muted hover:bg-surface-hover active:scale-95"
              >
                -
              </button>
              <span className="text-lg font-bold font-mono text-text-primary w-12 text-center">
                {target}
              </span>
              <button
                onClick={() => setTarget((t) => t + (config.type === 'runs' ? 1 : 5))}
                className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-text-muted hover:bg-surface-hover active:scale-95"
              >
                +
              </button>
              <span className="text-xs text-text-muted">{config.unit}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted bg-surface-light hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-secondary hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear reto'}
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Active challenge view
  if (!challenge) return null;

  const config = getChallengeConfig(challenge.type);
  const Icon = config.icon;
  const myProgress = challenge.progress[userId || ''] || 0;
  const partnerProgress = challenge.progress[partnerId || ''] || 0;
  const myName = profile?.displayName || 'Yo';

  const myPercent = Math.min(100, Math.round((myProgress / challenge.target) * 100));
  const partnerPercent = Math.min(100, Math.round((partnerProgress / challenge.target) * 100));

  const isCompleted = challenge.status === 'completed';
  const isRunsChallenge = challenge.type === 'runs';
  const combinedProgress = isRunsChallenge ? myProgress + partnerProgress : 0;
  const combinedPercent = isRunsChallenge
    ? Math.min(100, Math.round((combinedProgress / challenge.target) * 100))
    : 0;

  return (
    <>
      {showConfetti && <Confetti count={40} />}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={cn(
            'bg-gradient-to-r from-secondary/5 to-transparent',
            isCompleted && 'border-primary/30',
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                isCompleted ? 'bg-primary-soft' : 'bg-secondary-soft',
              )}
            >
              {isCompleted ? (
                <Trophy size={20} className="text-primary" />
              ) : (
                <Icon size={20} className="text-secondary" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {isCompleted ? 'Reto completado!' : 'Reto semanal'}
              </p>
              <p className="text-xs text-text-muted">{config.description}</p>
            </div>
            {!isCompleted && (
              <span className="text-xs font-medium text-secondary bg-secondary-soft px-2 py-1 rounded-lg">
                Meta: {challenge.target} {config.unit}
              </span>
            )}
          </div>

          {isRunsChallenge ? (
            // Combined progress bar for runs
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Progreso combinado</span>
                <span className="font-mono font-semibold text-text-primary">
                  {combinedProgress}/{challenge.target} {config.unit}
                </span>
              </div>
              <div className="h-3 bg-surface-light rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isCompleted ? 'bg-primary' : 'bg-secondary',
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${combinedPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>{myName}: {myProgress} km</span>
                <span>{partnerName}: {partnerProgress} km</span>
              </div>
            </div>
          ) : (
            // Individual progress bars
            <div className="space-y-3">
              {/* My progress */}
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>{myName}</span>
                  <span className="font-mono font-semibold text-text-primary">
                    {myProgress}/{challenge.target}
                  </span>
                </div>
                <div className="h-3 bg-surface-light rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      myPercent >= 100 ? 'bg-primary' : 'bg-secondary',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${myPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
              {/* Partner progress */}
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>{partnerName}</span>
                  <span className="font-mono font-semibold text-text-primary">
                    {partnerProgress}/{challenge.target}
                  </span>
                </div>
                <div className="h-3 bg-surface-light rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      partnerPercent >= 100 ? 'bg-primary' : 'bg-accent',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${partnerPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
              </div>
            </div>
          )}

          {isCompleted && (
            <motion.div
              className="mt-3 pt-3 border-t border-border/50 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs font-semibold text-secondary flex items-center gap-1 mx-auto"
              >
                Crear nuevo reto <ChevronRight size={14} />
              </button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </>
  );
}
