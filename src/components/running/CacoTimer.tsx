import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, X, SkipForward } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Confetti } from '../ui/Confetti';
import { ConfirmDialog } from '../ui/ConfirmDialog';
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

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

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

  const totalPhaseSeconds = Math.round(
    (phase === 'run' ? runMinutes : walkMinutes) * 60
  );

  const progress = totalPhaseSeconds > 0
    ? ((totalPhaseSeconds - secondsLeft) / totalPhaseSeconds) * 100
    : 0;

  // SVG progress ring params
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
        if (prev <= 4 && soundEnabled) playTimerBeep();
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
          setState('completed');
          return;
        }
        // Show phase switch then start next run
        if (soundEnabled) playTimerRun();
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
        playTimerComplete();
        setState('completed');
        return;
      }
      // Switch to run (next rep)
      playTimerRun();
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
  const phaseColor = isRunPhase ? '#22c55e' : '#3b82f6';
  const phaseBgClass = isRunPhase ? 'from-primary/20' : 'from-blue-500/20';

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between overflow-hidden"
      style={{ top: 0, bottom: 0, left: 0, right: 0, margin: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background gradient based on phase */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-to-b to-transparent opacity-60',
          state === 'completed' ? 'from-primary/30' : phaseBgClass
        )}
        key={`${phase}-${currentRep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.5 }}
      />

      {/* Phase switch flash overlay */}
      <AnimatePresence>
        {state === 'phase_switch' && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: phaseLabel === 'CORRER!'
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(59, 130, 246, 0.3)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              className="text-5xl font-extrabold text-white drop-shadow-lg"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {phaseLabel === 'CORRER!' ? 'CORRER! 🏃' : 'CAMINAR! 🚶'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed overlay with confetti */}
      <AnimatePresence>
        {state === 'completed' && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Confetti */}
            <Confetti count={40} />

            <motion.div
              className="text-center z-10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <motion.div
                className="text-7xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {'🎉'}
              </motion.div>
              <h2 className="text-4xl font-extrabold text-text-primary mb-2">
                Completado!
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                {repetitions} repeticiones terminadas
              </p>
              <button
                onClick={handleCompleteClose}
                className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-2xl hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/30"
              >
                Finalizar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <div className="relative z-10 w-full flex justify-end p-4 safe-top">
        <button
          onClick={handleCloseRequest}
          className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main timer area */}
      {state !== 'completed' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4">
          {/* Phase indicator */}
          <motion.div
            key={`phase-${phase}-${currentRep}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <span
              className={cn(
                'inline-block px-6 py-2 rounded-full text-lg font-bold',
                isRunPhase
                  ? 'bg-primary/20 text-primary'
                  : 'bg-blue-500/20 text-blue-400'
              )}
            >
              {isRunPhase ? 'CORRER 🏃' : 'CAMINAR 🚶'}
            </span>
          </motion.div>

          {/* Progress ring + timer */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 280 280"
            >
              {/* Background circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="var(--color-surface-light)"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <motion.circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke={phaseColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </svg>

            {/* Timer text inside ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-6xl sm:text-7xl font-extrabold font-mono text-text-primary tracking-tight"
                key={secondsLeft}
                initial={false}
                animate={
                  secondsLeft <= 5 && state === 'running'
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ duration: 0.3 }}
              >
                {formatTime(secondsLeft)}
              </motion.span>
              <span className="text-sm text-text-muted mt-2 font-medium">
                {state === 'idle'
                  ? 'Listo para empezar'
                  : state === 'paused'
                  ? 'En pausa'
                  : `${isRunPhase ? runMinutes : walkMinutes} min`}
              </span>
            </div>
          </div>

          {/* Repetition indicator */}
          <div className="text-center">
            <p className="text-base font-semibold text-text-secondary">
              Repeticion {currentRep} de {repetitions}
            </p>
            {/* Rep dots */}
            <div className="flex gap-2 justify-center mt-3">
              {Array.from({ length: repetitions }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    i < currentRep - 1
                      ? 'bg-primary'
                      : i === currentRep - 1
                      ? state === 'running' || state === 'paused'
                        ? 'bg-primary/60'
                        : 'bg-surface-light'
                      : 'bg-surface-light'
                  )}
                  animate={
                    i === currentRep - 1 && state === 'running'
                      ? { scale: [1, 1.3, 1] }
                      : {}
                  }
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {state !== 'completed' && (
        <div className="relative z-10 flex items-center justify-center gap-6 pt-4 pb-[max(3rem,env(safe-area-inset-bottom,3rem))]">
          {/* Stop button */}
          {(state === 'running' || state === 'paused') && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleStop}
              className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/20 transition-colors active:scale-90"
            >
              <Square size={22} fill="currentColor" />
            </motion.button>
          )}

          {/* Play/Pause button */}
          {state !== 'phase_switch' && (
            <motion.button
              onClick={handlePlayPause}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform',
                state === 'running'
                  ? 'bg-secondary shadow-secondary/30'
                  : 'bg-primary shadow-primary/30'
              )}
              whileTap={{ scale: 0.9 }}
            >
              {state === 'running' ? (
                <Pause size={32} fill="white" />
              ) : (
                <Play size={32} fill="white" className="ml-1" />
              )}
            </motion.button>
          )}

          {/* Skip button */}
          {(state === 'running' || state === 'paused') && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleSkip}
              className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center text-text-secondary hover:text-secondary hover:bg-secondary/20 transition-colors active:scale-90"
            >
              <SkipForward size={22} />
            </motion.button>
          )}
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
