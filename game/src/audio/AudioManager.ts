// ============================================================================
// AUDIO MANAGER — Phaser-aware glue between the EventBus and the synth.
//
// Owns the Web Audio node graph (master → sfx/music sub-mixes), subscribes to
// gameplay events and fires the matching SFX, drives the music loop, and
// handles the mute toggle (keyboard + programmatic for the HUD button).
//
// Piggybacks on Phaser's WebAudioSoundManager context, which Phaser resumes on
// the first user gesture — so no custom unlock handling is needed.
// ============================================================================
import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { EventBus } from "../state/EventBus";
import { EV } from "../state/events";
import type { PersonKind } from "../data/types";
import { bell, buzzer, chime, fanfare, loseSting, winSting, zap } from "./synth";
import { MusicPlayer } from "./music";

class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private music: MusicPlayer | null = null;
  private muted = false;
  private started = false; // has the music loop been kicked off yet

  constructor(game: Phaser.Game) {
    if (!TUNING.audio.enabled) return;
    const ctx = (game.sound as Phaser.Sound.WebAudioSoundManager).context;
    if (!ctx) return; // HTML5 / NoAudio fallback — stay silent, never throw
    this.ctx = ctx;

    const a = TUNING.audio;
    this.master = ctx.createGain();
    this.master.gain.value = a.startMuted ? 0 : a.masterVolume;
    this.master.connect(ctx.destination);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = a.sfxVolume;
    this.sfxGain.connect(this.master);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = a.musicVolume;
    this.musicGain.connect(this.master);

    this.muted = a.startMuted;
    this.music = new MusicPlayer(ctx, this.musicGain);

    this.subscribe();
    this.installMuteKey(a.muteKey);
  }

  private subscribe(): void {
    EventBus.on(EV.waveChanged, this.onWaveChanged, this);
    EventBus.on(EV.personDelivered, this.onDelivered, this);
    EventBus.on(EV.personRageQuit, this.onRageQuit, this);
    EventBus.on(EV.waveCleared, this.onWaveCleared, this);
    EventBus.on(EV.powerToggled, this.onPowerToggled, this);
    EventBus.on(EV.gameWon, this.onGameWon, this);
    EventBus.on(EV.gameOver, this.onGameOver, this);
  }

  // Fire a one-shot SFX composer at "now", guarding a live context.
  private play(fn: (ctx: BaseAudioContext, dest: AudioNode, when: number) => void): void {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    fn(this.ctx, this.sfxGain, this.ctx.currentTime + 0.01);
  }

  private onWaveChanged = () => {
    this.ensureMusic();
    this.play(bell);
  };
  private onDelivered = (_kind: PersonKind) => this.play(chime);
  private onRageQuit = () => this.play(buzzer);
  private onWaveCleared = () => this.play(fanfare);
  private onPowerToggled = () => this.play(zap);
  private onGameWon = () => this.play(winSting);
  private onGameOver = () => this.play(loseSting);

  // Start the music loop once, on the first wave (a reliable post-gesture point).
  private ensureMusic(): void {
    if (this.started || !this.music) return;
    this.started = true;
    if (this.ctx?.state === "suspended") void this.ctx.resume();
    this.music.start();
  }

  private installMuteKey(key: string): void {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === key.toLowerCase()) this.toggleMute();
    });
  }

  get isMuted(): boolean {
    return this.muted;
  }

  // Flip mute: master gain to 0 or back to the configured level.
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      const level = this.muted ? 0 : TUNING.audio.masterVolume;
      this.master.gain.setTargetAtTime(level, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }
}

let instance: AudioManager | null = null;

// Construct the singleton once, after the Phaser.Game exists.
export function initAudio(game: Phaser.Game): void {
  if (!instance) instance = new AudioManager(game);
}

// Reachable by the HUD mute button; no-op safe if audio never initialized.
export function toggleMute(): boolean {
  return instance?.toggleMute() ?? false;
}
export function isMuted(): boolean {
  return instance?.isMuted ?? false;
}
