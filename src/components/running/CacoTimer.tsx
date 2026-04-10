import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, X, SkipForward, Footprints } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Confetti } from '../ui/Confetti';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { IconButton } from '../ui/IconButton';
import { ProgressRing } from './ProgressRing';
import { playTimerRun, playTimerWalk, playTimerBeep, playTimerComplete } from '../../lib/sound-utils';
import { useAuthContext } from '../../contexts/AuthContext';

interface CacoTimerProps {
  runMinutes: number;
  walkMinutes: number;
  repetitions: number;
  onComplete: () => void;
  onClose: () => void;
}

type TimerState = 'idle' | 'running' | 'paused' | 'phase_switch' | 'completed';
type Phase = 'run' | 'walk';

export function CacoTimer({
  runMinutes,
  walkMinutes,
  repetitions,
  onComplete,
  onClose,
}: CacoTimerProps) {
  const { profile } = useAuthContext();
  const soundEnabled = profile?.settings?.soundEnabled ?? true;

  const [state, setState] = useState<TimerState>('idle');
  const [phase, setPhase] = useState<Phase>('run');
  const [currentRep, setCurrentRep] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(runMinutes * 60));
  const [phaseLabel, setPhaseLabel] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Keep screen awake while timer is running
  useEffect(() => {
    if (state !== 'running' && state !== 'phase_switch') {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }
    if (wakeLockRef.current) return;
    navigator.wakeLock?.request('screen')
      .then((lock) => { wakeLockRef.current = lock; })
      .catch(() => {});
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [state]);

  const totalPhaseSeconds = Math.round(
    (phase === 'run' ? runMinutes : walkMinutes) * 60
  );

  const progress = totalPhaseSeconds > 0
    ? ((totalPhaseSeconds - secondsLeft) / totalPhaseSeconds) * 100
    : 0;

  const isActive = state === 'running' || state === 'paused' || state === 'phase_switch';

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Core timer tick
  useEffect(() => {
    if (state !== 'running') {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Interval ended
          clearTimer();
          handleIntervalEnd();
          return 0;
        }
        // Countdown beeps for last 3 seconds
        if (prev <= 4) {
          if (soundEnabled) playTimerBeep();
          navigator.vibrate?.(30);
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, phase, currentRep]);

  function handleIntervalEnd() {
    if (phase === 'run') {
      // After run, check if we need a walk phase
      if (walkMinutes <= 0) {
        // No walk phase, go to next rep or complete
        if (currentRep >= repetitions) {
          if (soundEnabled) playTimerComplete();
          navigator.vibrate?.([100, 50, 100, 50, 200]);
          setState('completed');
          return;
        }
        // Show phase switch then start next run
        if (soundEnabled) playTimerRun();
        navigator.vibrate?.([50, 30, 50]);
        setState('phase_switch');
        setPhaseLabel('CORRER!');
        setTimeout(() => {
          setCurrentRep((r) => r + 1);
          setSecondsLeft(Math.round(runMinutes * 60));
          setPhase('run');
          setState('running');
        }, 1500);
        return;
      }
      // Switch to walk
      if (soundEnabled) playTimerWalk();
      navigator.vibrate?.([50, 30, 50]);
      setState('phase_switch');
      setPhaseLabel('CAMINAR!');
      setTimeout(() => {
        setPhase('walk');
        setSecondsLeft(Math.round(walkMinutes * 60));
        setState('running');
      }, 1500);
    } else {
      // After walk, check if all reps done
      if (currentRep >= repetitions) {
        if (soundEnabled) playTimerComplete();
        navigator.vibrate?.([100, 50, 100, 50, 200]);
        setState('completed');
        return;
      }
      // Switch to run (next rep)
      if (soundEnabled) playTimerRun();
      navigator.vibrate?.([50, 30, 50]);
      setState('phase_switch');
      setPhaseLabel('CORRER!');
      setTimeout(() => {
        setCurrentRep((r) => r + 1);
        setPhase('run');
        setSecondsLeft(Math.round(runMinutes * 60));
        setState('running');
      }, 1500);
    }
  }

  function handleSkip() {
    clearTimer();
    handleIntervalEnd();
  }

  function handlePlayPause() {
    if (state === 'idle') {
      setPhase('run');
      setCurrentRep(1);
      setSecondsLeft(Math.round(runMinutes * 60));
      setState('running');
    } else if (state === 'running') {
      setState('paused');
    } else if (state === 'paused') {
      setState('running');
    }
  }

  function handleStop() {
    clearTimer();
    setState('idle');
    setPhase('run');
    setCurrentRep(1);
    setSecondsLeft(Math.round(runMinutes * 60));
  }

  function handleCloseRequest() {
    if (isActive) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }

  function handleConfirmClose() {
    clearTimer();
    setShowCloseConfirm(false);
    onClose();
  }

  function handleCompleteClose() {
    onComplete();
    onClose();
  }

  const isRunPhase = phase === 'run';
  // Use semantic tokens; walk phase uses info (cyan-ish) token from index.css
  const phaseColor = isRunPhase ? 'var(--color-primary)' : 'var(--color-info)';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-background"
      style={{ top: 0, bottom: 0, left: 0, right: 0, margin: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Background gradient based on phase */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-to-b to-transparent',
          state === 'completed'
            ? 'from-primary-soft'
            : isRunPhase
            ? 'from-primary-soft'
            : 'from-info-soft',
        )}
        key={`${phase}-${currentRep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Phase switch flash overlay */}
      <AnimatePresence>
        {state === 'phase_switch' && (
          <motion.div
            className={cn(
              'absolute inset-0 z-50 flex items-center justify-center',
              phaseLabel === 'CORRER!' ? 'bg-primary-soft' : 'bg-info-soft',
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span className="text-5xl" aria-hidden="true">
                {phaseLabel === 'CORRER!' ? '🏃' : '🚶'}
              </span>
              <span className="text-4xl font-extrabold tracking-tight text-text-primary">
                {phaseLabel === 'CORRER!' ? 'CORRER!' : 'CAMINAR!'}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed overlay with confetti */}
      <AnimatePresence>
        {state === 'completed' && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Confetti count={40} />

            <motion.div
              className="z-10 text-center"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-5xl">
                🎉
              </div>
              <h2 className="text-3xl font-bold text-text-primary">Completado</h2>
              <p className="mt-2 text-base text-text-secondary">
                {repetitions} {repetitions === 1 ? 'repetición' : 'repeticiones'} terminadas
              </p>
              <button
                type="button"
                onClick={handleCompleteClose}
                className="mt-8 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-contrast shadow-[var(--shadow-glow-primary)] transition-colors duration-150 hover:bg-primary-hover active:scale-[0.97]"
              >
                Finalizar sesión
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <div className="safe-top relative z-10 flex w-full justify-end p-3">
        <IconButton
          variant="ghost"
          size="md"
          onClick={handleCloseRequest}
          aria-label="Cerrar timer"
        >
          <X size={20} />
        </IconButton>
      </div>

      {/* Main timer area */}
      {state !== 'completed' && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4">
          {/* Phase indicator */}
          <motion.div
            key={`phase-${phase}-${currentRep}`}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <span
              role="status"
              aria-live="polite"
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-5 py-2 text-base font-bold uppercase tracking-wide',
                isRunPhase
                  ? 'bg-primary-soft text-primary ring-1 ring-primary/30'
                  : 'bg-info-soft text-info ring-1 ring-info/30',
              )}
            >
              {isRunPhase ? (
                <Footprints size={14} />
              ) : (
                <span className="text-sm" aria-hidden="true">🚶</span>
              )}
              {isRunPhase ? 'Correr' : 'Caminar'}
            </span>
          </motion.div>

          {/* Progress ring + timer */}
          <ProgressRing
            progress={progress}
            secondsLeft={secondsLeft}
            state={state}
            phaseColor={phaseColor}
            isRunPhase={isRunPhase}
            runMinutes={runMinutes}
            walkMinutes={walkMinutes}
            aria-label={`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
          />

          {/* Repetition indicator */}
          <div className="text-center">
            <p className="text-2xs uppercase tracking-wide text-text-muted">Repetición</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-text-secondary">
              {currentRep} <span className="text-text-muted">de</span> {repetitions}
            </p>
            {/* Rep dots */}
            <div className="mt-3 flex justify-center gap-1.5">
              {Array.from({ length: repetitions }).map((_, i) => {
                const isDone = i < currentRep - 1;
                const isActive = i === currentRep - 1;
                return (
                  <motion.div
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors duration-200',
                      isDone
                        ? 'bg-primary'
                        : isActive
                        ? state === 'running' || state === 'paused'
                          ? isRunPhase
                            ? 'bg-primary/70'
                            : 'bg-info/70'
                          : 'bg-surface-light'
                        : 'bg-surface-light',
                    )}
                    animate={
                      isActive && state === 'running'
                        ? { scale: [1, 1.25, 1] }
                        : { scale: 1 }
                    }
                    transition={{
                      repeat: isActive && state === 'running' ? Infinity : 0,
                      duration: 2,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {state !== 'completed' && (
        <div className="relative z-10 flex items-center justify-center gap-5 pt-4 pb-[max(3rem,env(safe-area-inset-bottom,3rem))]">
          {/* Stop button */}
          <AnimatePresence>
            {(state === 'running' || state === 'paused') && (
              <motion.button
                key="stop"
                type="button"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={handleStop}
                aria-label="Detener sesión"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-surface/80 text-text-secondary backdrop-blur transition-colors duration-150 hover:border-danger/40 hover:bg-danger/10 hover:text-danger active:scale-95"
              >
                <Square size={20} fill="currentColor" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Play/Pause button */}
          {state !== 'phase_switch' && (
            <motion.button
              type="button"
              onClick={handlePlayPause}
              aria-label={state === 'running' ? 'Pausar' : state === 'paused' ? 'Reanudar' : 'Iniciar'}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              className={cn(
                'flex h-[88px] w-[88px] items-center justify-center rounded-full text-primary-contrast shadow-lg transition-colors duration-150',
                state === 'running'
                  ? 'bg-secondary shadow-[var(--shadow-glow-secondary)] hover:bg-secondary-hover'
                  : 'bg-primary shadow-[var(--shadow-glow-primary)] hover:bg-primary-hover',
              )}
            >
              {state === 'running' ? (
                <Pause size={34} fill="currentColor" />
              ) : (
                <Play size={34} fill="currentColor" className="ml-1" />
              )}
            </motion.button>
          )}

          {/* Skip button */}
          <AnimatePresence>
            {(state === 'running' || state === 'paused') && (
              <motion.button
                key="skip"
                type="button"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={handleSkip}
                aria-label="Saltar fase"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-surface/80 text-text-secondary backdrop-blur transition-colors duration-150 hover:border-info/40 hover:bg-info/10 hover:text-info active:scale-95"
              >
                <SkipForward size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm close dialog */}
      <ConfirmDialog
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleConfirmClose}
        title="Salir del timer?"
        description="Tu progreso actual se va a perder. Estas seguro?"
        confirmLabel="Salir"
        cancelLabel="Seguir"
        variant="warning"
      />
    </motion.div>
  );
}
