import { motion, useSpring, useTransform } from 'framer-motion';
import { memo, useEffect, useId } from 'react';

interface WaterDropProps {
  fillPercent: number; // 0-1
  totalMl: number;
  goalMl: number;
}

function formatLiters(ml: number): string {
  if (ml >= 1000) {
    const l = ml / 1000;
    return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
  }
  return `${ml}ml`;
}

function getWaterColor(percent: number): { fill: string; glow: string } {
  if (percent <= 0) return { fill: '#475569', glow: 'transparent' };
  if (percent < 0.5) return { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.15)' };
  if (percent < 0.8) return { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)' };
  if (percent < 1) return { fill: '#2563eb', glow: 'rgba(37, 99, 235, 0.25)' };
  return { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' };
}

// Teardrop SVG path — wider belly, pointed top
const DROP_PATH = 'M50 4 C50 4, 14 52, 14 68 C14 88, 30 100, 50 100 C70 100, 86 88, 86 68 C86 52, 50 4, 50 4 Z';

export const WaterDrop = memo(function WaterDrop({ fillPercent, totalMl, goalMl }: WaterDropProps) {
  const clipId = useId();
  const gradientId = useId();
  const glowId = useId();
  const clamped = Math.min(1, Math.max(0, fillPercent));
  const percent = Math.round(clamped * 100);
  const { fill, glow } = getWaterColor(clamped);
  const isComplete = clamped >= 1;

  // Spring-animated fill height for smooth transitions
  const springFill = useSpring(clamped, { stiffness: 60, damping: 18, mass: 0.8 });
  // Map 0-1 to SVG y coordinates: bottom of drop (100) to top of water area (~20)
  const waterY = useTransform(springFill, [0, 1], [100, 16]);

  useEffect(() => {
    springFill.set(clamped);
  }, [clamped, springFill]);

  // Use CSS animations for waves instead of framer-motion to avoid JS overhead

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow ring behind the drop when complete — CSS animation */}
      {isComplete && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(ellipse at 50% 60%, ${glow}, transparent 70%)`,
            animation: 'glowPulse 2.5s ease-in-out infinite',
          }}
        />
      )}

      <svg
        viewBox="0 0 100 106"
        role="img"
        aria-label={`Progreso de agua: ${totalMl >= 1000 ? (totalMl / 1000).toFixed(1) + 'L' : totalMl + 'ml'} de ${goalMl / 1000}L`}
        className="w-[100px] h-[120px] drop-shadow-sm"
        style={{
          filter: isComplete ? `drop-shadow(0 0 12px ${glow})` : undefined,
          containIntrinsicSize: '100px 120px',
          contain: 'layout style paint',
        }}
      >
        <defs>
          {/* Teardrop clip */}
          <clipPath id={clipId}>
            <path d={DROP_PATH} />
          </clipPath>

          {/* Water gradient */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={0.85} />
            <stop offset="100%" stopColor={fill} stopOpacity={1} />
          </linearGradient>

          {/* Glow filter */}
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Drop outline */}
        <path
          d={DROP_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
          opacity={0.5}
        />

        {/* Drop interior background */}
        <path
          d={DROP_PATH}
          fill="currentColor"
          className="text-surface-light"
          opacity={0.3}
        />

        {/* Water fill — clipped to teardrop shape */}
        <g clipPath={`url(#${clipId})`}>
          {/* Main water body */}
          <motion.rect
            x="0"
            width="100"
            height="100"
            y={waterY}
            fill={`url(#${gradientId})`}
          />

          {/* Animated wave on water surface — CSS animation for performance */}
          <motion.g style={{ y: waterY }}>
            <path
              d="M-10,4 C5,0 15,8 30,4 C45,0 55,8 70,4 C80,1 85,6 100,4 C115,0 125,8 140,4 L140,0 L-10,0 Z"
              fill={fill}
              opacity={0.6}
              style={{ animation: 'waveShift 3s ease-in-out infinite' }}
            />
            <path
              d="M-10,3 C10,7 20,0 40,3 C60,6 70,0 90,3 C110,6 120,0 140,3 L140,0 L-10,0 Z"
              fill={fill}
              opacity={0.35}
              style={{ animation: 'waveShift 4s ease-in-out infinite reverse' }}
            />
          </motion.g>

          {/* Light reflection — subtle highlight */}
          <ellipse
            cx="36"
            cy="56"
            rx="8"
            ry="16"
            fill="white"
            opacity={clamped > 0.1 ? 0.08 : 0}
            transform="rotate(-15 36 56)"
          />
        </g>

        {/* Volume text */}
        <text
          x="50"
          y="62"
          textAnchor="middle"
          className="fill-text-primary"
          style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}
        >
          {formatLiters(totalMl)} / {formatLiters(goalMl)}
        </text>

        {/* Percentage */}
        <text
          x="50"
          y="78"
          textAnchor="middle"
          style={{ fontSize: '10px', fontWeight: 600 }}
          fill={fill}
          opacity={0.9}
        >
          {percent}%
        </text>
      </svg>
      {/* CSS keyframes injected once globally */}
    </div>
  );
});
