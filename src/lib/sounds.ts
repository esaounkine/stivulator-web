/**
 * Cartoon sound effects synthesised with the Web Audio API.
 * No external assets — everything is generated on the fly.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.12) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

export const sounds = {
  /** Rapid high-pitched chirps — tickle fingers */
  tickle: () => {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => playTone(900 + Math.random() * 700, 0.05, 'sine', 0.06), i * 50);
    }
  },

  /** "Ha-ha-ha!" — three wobbly descending notes */
  laugh: () => {
    const ctx = getCtx();
    [650, 520, 480].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(freq - 100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }, i * 160);
    });
  },

  /** Crunch + munch noise */
  eat: () => {
    playNoise(0.12, 0.12);
    setTimeout(() => playNoise(0.08, 0.08), 80);
    setTimeout(() => playTone(280, 0.12, 'square', 0.04), 40);
  },

  /** Slide-whistle down + sad "boing" */
  dodge: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);

    setTimeout(() => playTone(140, 0.25, 'sine', 0.1), 320);
  },

  /** Quick swoosh as the item leaves the hand */
  throw: () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  },

  /** Coin-like ding-ding for scoring */
  score: () => {
    playTone(1047, 0.09, 'sine', 0.1); // C6
    setTimeout(() => playTone(1319, 0.18, 'sine', 0.09), 70); // E6
  },

  /** Pop for character swap */
  swap: () => {
    playTone(380, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(560, 0.07, 'sine', 0.09), 50);
  },

  /** Soft thud when an item drops (non-Steve miss) */
  drop: () => {
    playTone(180, 0.15, 'triangle', 0.06);
  },
};
