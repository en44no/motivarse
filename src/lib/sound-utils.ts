/**
 * Sound effects using Web Audio API — no external files needed.
 * AudioContext is created lazily on first user interaction.
 */

let audioCtx: AudioContext | null = null;
let contextReady = false;

function ensureContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => { contextReady = true; });
      // First interaction — context won't be ready yet, skip this one
      if (!contextReady) return null;
    } else {
      contextReady = true;
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Call this once on any early user interaction (e.g. first tap on the app)
 * so that subsequent sound calls work immediately.
 */
export function warmUpAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => { contextReady = true; });
    } else {
      contextReady = true;
    }
  } catch {
    // Audio not supported
  }
}

function playTone(
  frequency: number,
  duration: number,
  startTime: number,
  ctx: AudioContext,
  volume = 0.3,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle'; // warmer than sine, more audible
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  // Fade out smoothly
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/** Two ascending tones — habit completed */
export function playSuccess() {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(660, 0.18, now, ctx, 0.35);        // E5
  playTone(880, 0.25, now + 0.15, ctx, 0.35); // A5
}

/** Short celebratory jingle — 100% or milestone */
export function playCelebration() {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(523, 0.15, now, ctx, 0.3);         // C5
  playTone(660, 0.15, now + 0.12, ctx, 0.3);  // E5
  playTone(784, 0.15, now + 0.24, ctx, 0.3);  // G5
  playTone(1047, 0.35, now + 0.36, ctx, 0.4); // C6 — longer, louder
}

/** Short error blip */
export function playError() {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(300, 0.2, now, ctx, 0.25);
  playTone(250, 0.3, now + 0.15, ctx, 0.25);
}
