import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCoupleContext } from '../../contexts/CoupleContext';
import { subscribeToReactions, type Reaction } from '../../services/reactions.service';

interface FloatingEmoji {
  id: string;
  type: string;
  x: number;
}

/**
 * Shows floating emoji animations when partner sends reactions.
 * Renders as fixed overlay on the dashboard.
 */
export function ReceivedReactions() {
  const { user } = useAuthContext();
  const { couple } = useCoupleContext();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const coupleId = couple?.coupleId || null;
  const userId = user?.uid || null;

  useEffect(() => {
    if (!coupleId) return;

    const unsub = subscribeToReactions(coupleId, (reactions) => {
      // On initial load, just mark all as seen
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        reactions.forEach((r) => seenRef.current.add(r.id));
        return;
      }

      // Find new reactions directed at me
      const newReactions = reactions.filter(
        (r) => r.toUserId === userId && !seenRef.current.has(r.id),
      );

      newReactions.forEach((r) => {
        seenRef.current.add(r.id);
        const floating: FloatingEmoji = {
          id: r.id,
          type: r.type,
          x: 20 + Math.random() * 60, // random x between 20% and 80%
        };
        setFloatingEmojis((prev) => [...prev, floating]);

        // Auto-remove after animation
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((f) => f.id !== floating.id));
        }, 2500);
      });
    });

    return () => unsub();
  }, [coupleId, userId]);

  if (floatingEmojis.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {floatingEmojis.map((emoji) => (
          <motion.div
            key={emoji.id}
            className="absolute text-4xl"
            style={{ left: `${emoji.x}%` }}
            initial={{ bottom: '20%', opacity: 1, scale: 0.5 }}
            animate={{
              bottom: '70%',
              opacity: [1, 1, 0],
              scale: [0.5, 1.4, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
          >
            {emoji.type}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
