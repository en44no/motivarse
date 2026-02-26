import { useState } from 'react';
import { Play, Clock, Repeat, Timer } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CACO_PLAN, SESSIONS_PER_WEEK } from '../../lib/caco-plan';
import { CacoTimer } from './CacoTimer';

interface CacoWeekDetailProps {
  currentWeek: number;
  currentSession: number;
  onTimerComplete?: () => void;
}

export function CacoWeekDetail({ currentWeek, currentSession, onTimerComplete }: CacoWeekDetailProps) {
  const [showTimer, setShowTimer] = useState(false);
  const plan = CACO_PLAN[currentWeek - 1];
  if (!plan) return null;

  function handleTimerComplete() {
    setShowTimer(false);
    onTimerComplete?.();
  }

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">Semana {currentWeek}</h3>
            <p className="text-xs text-text-muted">Sesión {currentSession} de {SESSIONS_PER_WEEK}</p>
          </div>
          <Badge variant="primary">
            <Play size={12} /> Próxima sesión
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-surface rounded-xl p-3 text-center border border-border/50 shadow-sm">
            <Clock size={16} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-bold font-mono text-text-primary">{plan.totalMinutes}</p>
            <p className="text-[10px] text-text-muted">minutos</p>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center border border-border/50 shadow-sm">
            <Play size={16} className="mx-auto text-secondary mb-1" />
            <p className="text-lg font-bold font-mono text-text-primary">{plan.runMinutes}</p>
            <p className="text-[10px] text-text-muted">min correr</p>
          </div>
          <div className="bg-surface rounded-xl p-3 text-center border border-border/50 shadow-sm">
            <Repeat size={16} className="mx-auto text-accent mb-1" />
            <p className="text-lg font-bold font-mono text-text-primary">{plan.repetitions}x</p>
            <p className="text-[10px] text-text-muted">repeticiones</p>
          </div>
        </div>

        {/* Start Timer button */}
        <Button
          onClick={() => setShowTimer(true)}
          variant="primary"
          size="lg"
          className="w-full mb-4"
        >
          <Timer size={18} />
          Iniciar Timer
        </Button>

        {/* Session dots */}
        <div className="flex gap-2">
          {Array.from({ length: SESSIONS_PER_WEEK }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                i < currentSession - 1
                  ? 'bg-primary'
                  : i === currentSession - 1
                  ? 'bg-primary/50 animate-pulse'
                  : 'bg-surface-light'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-text-muted mt-3 leading-relaxed">
          {plan.walkMinutes > 0
            ? `Alterná ${plan.runMinutes} min corriendo con ${plan.walkMinutes} min caminando, ${plan.repetitions} veces.`
            : `¡Corré ${plan.runMinutes} minutos sin parar! 🏆`}
        </p>
      </Card>

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
