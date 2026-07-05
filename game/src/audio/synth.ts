// ============================================================================
// SYNTH — pure Web Audio tone generation. No Phaser, no asset files.
//
// Every sound in the game is built here from oscillators + gain envelopes,
// scheduled against a shared AudioContext clock. Composers below take
// (ctx, dest, when) and schedule one-shot effects into `dest` (a GainNode the
// caller owns for volume/mute). Kept Phaser-free so it stays unit-testable.
// ============================================================================

export interface ToneOpts {
  freq: number;
  type?: OscillatorType; // sine | square | sawtooth | triangle
  startAt: number; // absolute AudioContext time to begin
  dur: number; // seconds until fully silent
  gain?: number; // peak gain (0..1)
  attack?: number; // seconds to ramp up to peak
  release?: number; // seconds of exponential decay tail
  detune?: number; // cents
}

// Schedule a single enveloped oscillator note. Returns the stop time so callers
// can chain notes back-to-back.
export function tone(ctx: BaseAudioContext, dest: AudioNode, o: ToneOpts): number {
  const { freq, type = "sine", startAt, dur, gain = 0.3, attack = 0.005, detune = 0 } = o;
  const release = o.release ?? dur;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (detune) osc.detune.setValueAtTime(detune, startAt);

  const peak = startAt + attack;
  const end = startAt + Math.max(attack + 0.01, dur);
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), peak);
  // Exponential decay to (near) silence over the release tail.
  g.gain.exponentialRampToValueAtTime(0.0001, peak + release);

  osc.connect(g).connect(dest);
  osc.start(startAt);
  osc.stop(end + 0.02);
  return end;
}

// A short burst of white noise (crackle) shaped by a gain envelope.
export function noiseBurst(
  ctx: BaseAudioContext,
  dest: AudioNode,
  o: { startAt: number; dur: number; gain?: number }
): void {
  const { startAt, dur, gain = 0.2 } = o;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(Math.max(0.0001, gain), startAt);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  src.connect(g).connect(dest);
  src.start(startAt);
  src.stop(startAt + dur + 0.02);
}

// Note-name → frequency (equal temperament, A4 = 440). Accepts e.g. "C4", "F#5".
const SEMITONE: Record<string, number> = {
  C: -9, "C#": -8, Db: -8, D: -7, "D#": -6, Eb: -6, E: -5, F: -4,
  "F#": -3, Gb: -3, G: -2, "G#": -1, Ab: -1, A: 0, "A#": 1, Bb: 1, B: 2,
};
export function noteFreq(name: string): number {
  const m = /^([A-G]#?b?)(\d)$/.exec(name);
  if (!m) return 440;
  const semis = SEMITONE[m[1]] + (parseInt(m[2], 10) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

// ---- SFX composers ---------------------------------------------------------

// Ringing school bell — "class in session". Bright metallic partials driven by
// a fast clapper-style tremolo (an LFO on the gain) so it *rings* rather than
// chimes, held ~1.6s with a decaying tail.
export function bell(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const dur = 1.6;
  const f = noteFreq("A5");
  // Inharmonic partials give the clangy, metallic timbre of a real bell.
  const partials = [
    { mult: 1, gain: 0.32 },
    { mult: 2.4, gain: 0.16 },
    { mult: 3.9, gain: 0.1 },
    { mult: 5.3, gain: 0.06 },
  ];

  // Shared amplitude envelope: quick attack, exponential ring-out.
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(1, when + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  env.connect(dest);

  // Clapper tremolo: a fast LFO flutters the amplitude for the "brrring".
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  lfo.type = "square";
  lfo.frequency.setValueAtTime(22, when);
  lfoDepth.gain.setValueAtTime(0.5, when); // modulate ±0.5 around 0.5 base
  lfo.connect(lfoDepth).connect(env.gain);
  lfo.start(when);
  lfo.stop(when + dur + 0.05);

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f * p.mult, when);
    g.gain.setValueAtTime(p.gain, when);
    osc.connect(g).connect(env);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }
}

// Bright success chime — quick rising arpeggio.
export function chime(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const notes = ["E5", "G5", "C6"];
  notes.forEach((n, i) => {
    tone(ctx, dest, {
      freq: noteFreq(n), type: "triangle", startAt: when + i * 0.07, dur: 0.28, release: 0.26, gain: 0.3,
    });
  });
}

// Descending "womp" — rage-quit.
export function buzzer(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(320, when);
  osc.frequency.exponentialRampToValueAtTime(90, when + 0.45);
  g.gain.setValueAtTime(0.28, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
  osc.connect(g).connect(dest);
  osc.start(when);
  osc.stop(when + 0.55);
}

// Short positive fanfare — wave cleared.
export function fanfare(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const notes = ["C5", "E5", "G5", "C6"];
  notes.forEach((n, i) => {
    tone(ctx, dest, {
      freq: noteFreq(n), type: "square", startAt: when + i * 0.11, dur: 0.3, release: 0.25, gain: 0.22,
    });
  });
}

// Triumphant win sting.
export function winSting(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const notes = ["G4", "C5", "E5", "G5", "C6"];
  notes.forEach((n, i) => {
    tone(ctx, dest, {
      freq: noteFreq(n), type: "square", startAt: when + i * 0.12, dur: 0.5, release: 0.45, gain: 0.24,
    });
  });
}

// Sad descending lose sting.
export function loseSting(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const notes = ["G4", "F4", "Eb4", "C4"];
  notes.forEach((n, i) => {
    tone(ctx, dest, {
      freq: noteFreq(n), type: "triangle", startAt: when + i * 0.16, dur: 0.55, release: 0.5, gain: 0.26,
    });
  });
}

// Electric zap — tazer / electric-fly-zapper. Buzzy low sawtooth with a fast
// amplitude tremolo (LFO on the gain) plus a noise crackle on top.
export function zap(ctx: BaseAudioContext, dest: AudioNode, when: number): void {
  const dur = 0.22;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, when);
  osc.frequency.linearRampToValueAtTime(85, when + dur);

  // Tremolo: a fast LFO modulates a small gain around a decaying base to make
  // the harsh electric "bzzt" flutter.
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "square";
  lfo.frequency.setValueAtTime(55, when);
  lfoGain.gain.setValueAtTime(0.12, when);
  lfo.connect(lfoGain).connect(g.gain);

  g.gain.setValueAtTime(0.22, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g).connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
  lfo.start(when);
  lfo.stop(when + dur + 0.02);

  noiseBurst(ctx, dest, { startAt: when, dur: 0.12, gain: 0.12 });
}
