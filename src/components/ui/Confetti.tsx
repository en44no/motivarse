import { useState } from 'react';
import { getThemeColor } from '../../lib/utils';

function getColors(): string[] {
  const primary = getThemeColor('--color-primary') || '#22c55e';
  return [primary, '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#eab308'];
}

interface ParticleData {
  key: number;
  delay: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  driftX: number;
  rotate: number;
}

function generateParticles(count: number, colors: string[]): ParticleData[] {
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    delay: Math.random() * 0.8,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 6,
    duration: 2.5 + Math.random() * 1.5,
    driftX: (Math.random() - 0.5) * 200,
    rotate: Math.random() * 720 - 360,
  }));
}

interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 40 }: ConfettiProps) {
  const [colors] = useState(getColors);
  const [particles] = useState(() => generateParticles(count, colors));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[200]">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate3d(var(--drift-x), 120vh, 0) rotate(var(--rotate)); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.key}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.x}%`,
            top: '-5%',
            '--drift-x': `${p.driftX}px`,
            '--rotate': `${p.rotate}deg`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
