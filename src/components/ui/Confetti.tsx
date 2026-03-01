import { motion } from 'framer-motion';

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#eab308'];

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${x}%`,
        top: '-5%',
      }}
      initial={{ y: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: '120vh',
        opacity: [1, 1, 0.8, 0],
        rotate: Math.random() * 720 - 360,
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay,
        ease: 'easeIn',
      }}
    />
  );
}

interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 40 }: ConfettiProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    delay: Math.random() * 0.8,
    x: Math.random() * 100,
    key: i,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[200]">
      {particles.map((p) => (
        <ConfettiParticle key={p.key} delay={p.delay} x={p.x} />
      ))}
    </div>
  );
}
