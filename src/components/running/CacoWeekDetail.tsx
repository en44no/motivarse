import { useState } from 'react';
import { Play, Clock, Repeat, Timer, Footprints } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { CACO_PLAN, SESSIONS_PER_WEEK } from '../../lib/caco-plan';
import { CacoTimer } from './CacoTimer';
import { cn } from '../../lib/utils';

interface CacoWeekDetailProps {
  currentWeek: number;
  currentSession: number;
  weekSessionsFromLogs?: number;
  onTimerComplete?: () => void;
}

export function CacoWeekDetail({
  currentWeek,
  currentSession,
  weekSessionsFromLogs,
  onTimerComplete,
}: CacoWeekDetailProps) {
  const [showTimer, setShowTimer] = useState(false);
  const plan = CACO_PLAN[currentWeek - 1];
  if (!plan) return null;

  function handleTimerComplete() {
    setShowTimer(false);
    onTimerComplete?.();
  }

  const completed = weekSessionsFromLogs ?? Math.max(currentSession - 1, 0);
  const isWeekDone = completed >= SESSIONS_PER_WEEK;

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary-soft/60 via-surface to-surface shadow-[var(--shadow-glow-primary)]">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xs uppercase tracking-wide text-primary">
                Sesión del día
              </p>
              <h2 className="mt-1 text-xl font-bold text-text-primary">
                Semana {currentWeek}
                <span className="ml-1.5 text-sm font-medium text-text-muted">
                  de {CACO_PLAN.length}
                </span>
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-primary-contrast">
              <Play size={10} fill="currentColor" />
              Próxima
            </span>
          </div>

          {/* Sesion description */}
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {plan.walkMinutes > 0
              ? `Alterná ${plan.runMinutes} min corriendo con ${plan.walkMinutes} min caminando, ${plan.repetitions} veces.`
              : `¡Corré ${plan.runMinutes} minutos sin parar! 🏆`}
          </p>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatTile
              icon={<Clock size={14} className="text-primary" />}
              value={plan.totalMinutes}
              label="minutos"
            />
            <StatTile
              icon={<Footprints size={14} className="text-info" />}
              value={plan.runMinutes}
              label="min correr"
            />
            <StatTile
              icon={<Repeat size={14} className="text-accent" />}
              value={`${plan.repetitions}x`}
              label="repeticiones"
            />
          </div>

          {/* Start Timer button */}
          <Button
            onClick={() => setShowTimer(true)}
            variant="primary"
            size="lg"
            className="mt-4 w-full"
          >
            <Timer size={18} />
            Iniciar timer
          </Button>
        </div>

        {/* Session progress footer */}
        <div className="border-t border-border/60 bg-surface/40 px-5 py-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
              Sesiones esta semana
            </span>
            <span className="text-2xs font-bold tabular-nums text-primary">
              {completed} / {SESSIONS_PER_WEEK}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: SESSIONS_PER_WEEK }).map((_, i) => {
              const isDone = i < completed;
              const isNext = i === completed && !isWeekDone;
              return (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-200',
                    isDone
                      ? 'bg-primary'
                      : isNext
                      ? 'bg-primary/40'
                      : 'bg-surface-light',
                  )}
                  aria-label={`Sesion ${i + 1}${isDone ? ' completada' : isNext ? ' proxima' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </article>

      {/* CaCo Timer overlay */}
      <AnimatePresence>
        {showTimer && (
          <CacoTimer
            runMinutes={plan.runMinutes}
            walkMinutes={plan.walkMinutes}
            repetitions={plan.repetitions}
            onComplete={handleTimerComplete}
            onClose={() => setShowTimer(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/80 p-2.5 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 text-lg font-bold tabular-nums text-text-primary leading-none">
        {value}
      </p>
      <p className="mt-1 text-2xs text-text-muted">{label}</p>
    </div>
  );
}
