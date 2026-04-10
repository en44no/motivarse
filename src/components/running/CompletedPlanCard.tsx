import { motion } from 'framer-motion';
import { Trophy, PartyPopper } from 'lucide-react';
import { CACO_PLAN } from '../../lib/caco-plan';

interface CompletedPlanCardProps {
  totalRuns: number;
  totalDistanceKm: number;
}

export function CompletedPlanCard({ totalRuns, totalDistanceKm }: CompletedPlanCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary-soft/60 via-surface to-accent-soft/30 p-6 text-center shadow-[var(--shadow-glow-primary)]"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft ring-1 ring-primary/30">
        <Trophy className="text-primary" size={32} />
      </div>

      <h2 className="text-xl font-bold text-text-primary">Plan CaCo completado</h2>
      <p className="mt-1.5 text-sm text-text-secondary">
        ¡Felicitaciones! Completaste las {CACO_PLAN.length} semanas del programa.
      </p>

      <div className="mt-5 flex justify-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-primary leading-none">
            {totalRuns}
          </p>
          <p className="mt-1.5 text-2xs uppercase tracking-wide text-text-muted">
            Sesiones
          </p>
        </div>
        <div className="h-10 w-px bg-border/60" aria-hidden="true" />
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-accent leading-none">
            {totalDistanceKm.toFixed(1)}
          </p>
          <p className="mt-1.5 text-2xs uppercase tracking-wide text-text-muted">
            Km totales
          </p>
        </div>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface/60 px-3 py-1.5 text-xs text-text-muted ring-1 ring-border/60">
        <PartyPopper size={14} className="text-secondary" />
        <span>Seguí corriendo con carreras libres</span>
      </div>
    </motion.article>
  );
}
