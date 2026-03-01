/**
 * Sound effects using Web Audio API — no external files needed
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(frequency: number, duration: number, startTime: number, ctx: AudioContext, volume = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Two ascending tones — habit completed */
export function playSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(523.25, 0.15, now, ctx);       // C5
  playTone(659.25, 0.2, now + 0.12, ctx); // E5
}

/** Short celebratory jingle — 100% or milestone */
export function playCelebration() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(523.25, 0.12, now, ctx, 0.12);        // C5
  playTone(659.25, 0.12, now + 0.1, ctx, 0.12);  // E5
  playTone(783.99, 0.12, now + 0.2, ctx, 0.12);  // G5
  playTone(1046.5, 0.25, now + 0.3, ctx, 0.15);  // C6
}

/** Short error blip */
export function playError() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(220, 0.15, now, ctx, 0.1); // A3
  playTone(196, 0.2, now + 0.12, ctx, 0.1); // G3
}
