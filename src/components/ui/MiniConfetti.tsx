import { motion } from 'framer-motion';
import { useState } from 'react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e'];
const PARTICLE_COUNT = 10;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

interface Particle {
  id: number;
  color: string;
  x: number;
  y: number;
  scale: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    x: randomBetween(-28, 28),
    y: randomBetween(-32, -8),
    scale: randomBetween(0.6, 1.2),
  }));
}

export function MiniConfetti({ onComplete }: { onComplete?: () => void }) {
  const [particles] = useState(generateParticles);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0, p.scale, p.scale * 0.5],
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onAnimationComplete={i === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}
