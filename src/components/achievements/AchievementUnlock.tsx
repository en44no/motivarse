import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { AchievementDef } from '../../types/shared';

interface AchievementUnlockProps {
  achievement: AchievementDef | null;
  onDismiss: () => void;
}

function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = 80 + Math.random() * 60;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 4 + Math.random() * 6;
    const colors = [
      'var(--color-primary)',
      'var(--color-secondary)',
      'var(--color-accent)',
      '#FFD700',
      '#FF6B6B',
    ];
    const color = colors[i % colors.length];

    return (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          top: '50%',
          left: '50%',
        }}
        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
        animate={{
          x,
          y,
          opacity: [1, 1, 0],
          scale: [0, 1.2, 0.5],
        }}
        transition={{
          duration: 1.2,
          delay: 0.3 + i * 0.03,
          ease: 'easeOut',
        }}
      />
    );
  });

  return <>{particles}</>;
}

export function AchievementUnlock({ achievement, onDismiss }: AchievementUnlockProps) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  const handleClick = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const content = (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClick}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative flex flex-col items-center gap-4 p-8"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 300,
              delay: 0.1,
            }}
          >
            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full flex items-center justify-center">
                <Particles />
              </div>
            </div>

            {/* Glow ring */}
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
                opacity: 0.3,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 2, 1.5] }}
              transition={{ duration: 1, delay: 0.2 }}
            />

            {/* Emoji */}
            <motion.span
              className="text-7xl relative z-10 drop-shadow-lg"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.3, 1], rotate: [-20, 10, 0] }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 200,
                delay: 0.2,
              }}
            >
              {achievement.icon}
            </motion.span>

            {/* Label */}
            <motion.div
              className="bg-surface/95 backdrop-blur-md rounded-2xl px-6 py-4 text-center shadow-xl border border-border/50 relative z-10 max-w-[280px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Logro desbloqueado
              </p>
              <p className="text-lg font-bold text-text-primary">
                {achievement.name}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {achievement.description}
              </p>
            </motion.div>

            {/* Tap to dismiss hint */}
            <motion.p
              className="text-xs text-white/50 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Toca para cerrar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
