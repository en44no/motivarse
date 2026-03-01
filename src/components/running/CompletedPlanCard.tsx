import { motion } from 'framer-motion';
import { Trophy, PartyPopper } from 'lucide-react';
import { Card } from '../ui/Card';

interface CompletedPlanCardProps {
  totalRuns: number;
  totalDistanceKm: number;
}

export function CompletedPlanCard({ totalRuns, totalDistanceKm }: CompletedPlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Card className="bg-gradient-to-br from-primary/15 via-surface to-accent/10 border-primary/30 text-center py-8">
        <motion.div
          className="text-5xl mb-3"
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <Trophy className="mx-auto text-primary" size={48} />
        </motion.div>

        <h2 className="text-xl font-extrabold text-text-primary mb-1">
          Plan CaCo completado!
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Felicitaciones! Completaste las 11 semanas del programa.
        </p>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-primary">{totalRuns}</p>
            <p className="text-xs text-text-muted">Sesiones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-accent">{totalDistanceKm.toFixed(1)}</p>
            <p className="text-xs text-text-muted">Km totales</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-muted">
          <PartyPopper size={14} className="text-secondary" />
          <span>Segui corriendo con carreras libres!</span>
        </div>
      </Card>
    </motion.div>
  );
}
