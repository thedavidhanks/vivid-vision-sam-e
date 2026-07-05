// ============================================================================
// MUSIC — a looping chiptune march, synthesized (no audio files).
//
// The melody is stored as a note table (name + beats) and played back on a
// pulse wave for an 8-bit feel, with a simple root-note bass underneath. A
// Web-Audio lookahead scheduler queues notes slightly ahead of the clock so the
// loop stays seamless regardless of the JS timer's jitter.
//
// NOTE: this is an original, upbeat fight-song-style march (a Rice-spirited
// homage), not a transcription of any specific copyrighted tune. To use an
// exact score, replace MELODY/BASS below with its notes — the player is generic.
// ============================================================================
import { noteFreq, tone } from "./synth";

interface Step {
  note: string | null; // note name, or null for a rest
  beats: number; // length in beats
}

const BPM = 150;
const BEAT = 60 / BPM; // seconds per beat

// A bright I–IV–V major-key march phrase (two 4-bar lines) that loops.
const MELODY: Step[] = [
  { note: "G4", beats: 0.5 }, { note: "C5", beats: 0.5 }, { note: "E5", beats: 1 }, { note: "C5", beats: 0.5 }, { note: "E5", beats: 0.5 },
  { note: "G5", beats: 1.5 }, { note: "E5", beats: 0.5 },
  { note: "F5", beats: 0.5 }, { note: "E5", beats: 0.5 }, { note: "D5", beats: 1 }, { note: "G4", beats: 0.5 }, { note: "B4", beats: 0.5 },
  { note: "D5", beats: 1.5 }, { note: null, beats: 0.5 },
  { note: "E5", beats: 0.5 }, { note: "D5", beats: 0.5 }, { note: "C5", beats: 1 }, { note: "E5", beats: 0.5 }, { note: "G5", beats: 0.5 },
  { note: "A5", beats: 1 }, { note: "G5", beats: 0.5 }, { note: "F5", beats: 0.5 },
  { note: "E5", beats: 1 }, { note: "D5", beats: 1 }, { note: "C5", beats: 1.5 }, { note: null, beats: 0.5 },
];

// Root-note bass line, one note per bar, following I–I–IV–V–I.
const BASS: Step[] = [
  { note: "C3", beats: 2 }, { note: "C3", beats: 2 },
  { note: "G2", beats: 2 }, { note: "G2", beats: 2 },
  { note: "C3", beats: 2 }, { note: "F2", beats: 2 },
  { note: "G2", beats: 2 }, { note: "C3", beats: 2 },
];

function totalBeats(steps: Step[]): number {
  return steps.reduce((s, n) => s + n.beats, 0);
}

// Plays MELODY + BASS on a loop into `dest`, using a setInterval pump that
// schedules any notes falling within a short lookahead window.
export class MusicPlayer {
  private ctx: BaseAudioContext;
  private dest: AudioNode;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0; // absolute ctx time of the next loop's start
  private readonly loopLen = totalBeats(MELODY) * BEAT;
  private readonly lookahead = 0.15; // schedule this many seconds ahead

  constructor(ctx: BaseAudioContext, dest: AudioNode) {
    this.ctx = ctx;
    this.dest = dest;
  }

  get playing(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer !== null) return;
    // Start a hair in the future so the first notes schedule cleanly.
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.pump(), 40);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Schedule whole loop iterations while their start falls within the window.
  private pump(): void {
    while (this.nextTime < this.ctx.currentTime + this.lookahead) {
      this.scheduleLoop(this.nextTime);
      this.nextTime += this.loopLen;
    }
  }

  private scheduleLoop(start: number): void {
    this.scheduleLine(MELODY, start, { type: "square", gain: 0.22, release: 0.9 });
    this.scheduleLine(BASS, start, { type: "triangle", gain: 0.28, release: 0.95 });
  }

  private scheduleLine(
    steps: Step[],
    start: number,
    opts: { type: OscillatorType; gain: number; release: number }
  ): void {
    let t = start;
    for (const step of steps) {
      const len = step.beats * BEAT;
      if (step.note) {
        tone(this.ctx, this.dest, {
          freq: noteFreq(step.note),
          type: opts.type,
          startAt: t,
          dur: len * opts.release,
          release: len * opts.release,
          gain: opts.gain,
          attack: 0.008,
        });
      }
      t += len;
    }
  }
}
