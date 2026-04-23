// Web Audio API — all sounds generated programmatically, no files needed.
// Guard against SSR; components are all "use client" but the module may be evaluated server-side.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(
  ac: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine",
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
}

// Soft click for countdown numbers above 3
export function playTick() {
  const ac = getCtx();
  if (!ac) return;
  tone(ac, 480, ac.currentTime, 0.12, 0.06, "square");
}

// Resonant bell strike for countdown 3-2-1
export function playDramaticTick() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.7, 0.17, "sine");
  tone(ac, 440, t + 0.01, 0.4, 0.05, "sine");
  tone(ac, 660, t + 0.02, 0.25, 0.025, "sine");
}

// Rising shimmer for each spotlight item reveal
export function playReveal() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const notes = [261.6, 329.6, 392, 523.3]; // C4 E4 G4 C5
  notes.forEach((freq, i) => {
    tone(ac, freq, t + i * 0.065, 0.55, 0.07, "sine");
  });
}

// Majestic major chord for the final results screen
export function playFanfare() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const chord = [130.8, 164.8, 196, 261.6, 329.6]; // C3 E3 G3 C4 E4
  chord.forEach((freq, i) => {
    tone(ac, freq, t + i * 0.04, 2.2, 0.05, "sine");
  });
  // Octave sparkle on top
  tone(ac, 523.3, t + 0.18, 1.5, 0.035, "sine");
}
