import { useState, useEffect } from 'react';
import { getThemeColor } from '../../lib/utils';

function getColors(): string[] {
  const primary = getThemeColor('--color-primary') || '#22c55e';
  return [primary, '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e'];
}

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
  const colors = getColors();
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: randomBetween(-28, 28),
    y: randomBetween(-32, -8),
    scale: randomBetween(0.6, 1.2),
  }));
}

export function MiniConfetti({ onComplete }: { onComplete?: () => void }) {
  const [particles] = useState(generateParticles);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-center">
      <style>{`
        @keyframes miniConfettiBurst {
          0% { transform: translate3d(0, 0, 0) scale(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translate3d(var(--tx), var(--ty), 0) scale(var(--end-scale)); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: p.color,
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`,
            '--end-scale': p.scale * 0.5,
            animation: `miniConfettiBurst 0.6s ease-out forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
