import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !canInstall || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mx-4 mt-2 mb-1 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          {isIOS ? <Share size={18} className="text-primary" /> : <Download size={18} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Instalar Gestionarse</p>
          {isIOS ? (
            <p className="text-xs text-text-muted">
              Tocá <Share size={12} className="inline text-primary" /> y luego <span className="font-semibold text-text-secondary">"Agregar a inicio"</span>
            </p>
          ) : (
            <p className="text-xs text-text-muted">Agregá la app a tu pantalla de inicio</p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
          >
            Instalar
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 text-text-muted hover:text-text-secondary transition-colors"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
