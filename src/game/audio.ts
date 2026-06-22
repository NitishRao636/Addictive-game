// Tiny WebAudio synthesizer — no asset loading, instant SFX

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted() {
  return muted;
}

export function primeAudio() {
  // Call from a user gesture handler to ensure first sound plays
  return getCtx();
}

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctor) ctx = new Ctor();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  sweepTo?: number;
  attack?: number;
  release?: number;
};

function playTone(t: Tone, when = 0, detune = 0) {
  const c = getCtx();
  if (!c) return;
  const start = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = t.type ?? "square";
  osc.frequency.setValueAtTime(t.freq, start);
  if (t.sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, t.sweepTo),
      start + t.dur,
    );
  }
  if (detune) osc.detune.value = detune;
  const vol = t.vol ?? 0.15;
  const a = t.attack ?? 0.005;
  const r = t.release ?? 0.06;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + a);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur + r);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + t.dur + r + 0.02);
}

export const sfx = {
  shoot() {
    playTone({ freq: 880, sweepTo: 440, dur: 0.08, type: "sawtooth", vol: 0.08 });
    playTone({ freq: 220, sweepTo: 110, dur: 0.06, type: "triangle", vol: 0.06 }, 0);
  },
  hit() {
    playTone({ freq: 320, sweepTo: 160, dur: 0.07, type: "square", vol: 0.1 });
  },
  kill() {
    playTone({ freq: 520, sweepTo: 80, dur: 0.18, type: "sawtooth", vol: 0.14 });
    playTone({ freq: 1200, sweepTo: 200, dur: 0.18, type: "triangle", vol: 0.06 }, 0.01);
  },
  damage() {
    playTone({ freq: 200, sweepTo: 80, dur: 0.18, type: "sawtooth", vol: 0.18 });
    playTone({ freq: 90, dur: 0.18, type: "square", vol: 0.1 }, 0);
  },
  wave() {
    playTone({ freq: 440, dur: 0.1, type: "triangle", vol: 0.1 });
    playTone({ freq: 660, dur: 0.1, type: "triangle", vol: 0.1 }, 0.08);
    playTone({ freq: 880, dur: 0.16, type: "triangle", vol: 0.1 }, 0.16);
  },
  ui() {
    playTone({ freq: 600, dur: 0.05, type: "square", vol: 0.06 });
  },
};
