import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { gameState } from "../state/GameState";
import { EventBus } from "../state/EventBus";
import { EV } from "../state/events";
import type { GameScene } from "./GameScene";
import type { PersonKind } from "../data/types";

// Read-only overlay styled as SAM-e's console: system-telemetry readouts, a
// blinking ONLINE status, an owl roster (one glyph per expected owl this wave),
// plus a subtle CRT screen effect (scanlines + flicker + vignette) so the whole
// board reads like a monitor. Continuous values are polled each frame; discrete
// owl outcomes (delivered / rage-quit) arrive via EventBus.
export class HUDScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private statusText!: Phaser.GameObjects.Text;
  private crText!: Phaser.GameObjects.Text;
  private integText!: Phaser.GameObjects.Text;
  private cycleText!: Phaser.GameObjects.Text;
  private pwrLabel!: Phaser.GameObjects.Text;
  private availText!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Graphics;
  private flicker!: Phaser.GameObjects.Rectangle;
  private flashT = 0; // ms remaining on the power-bar flash (set on a toggle)
  private dotOn = true; // blink state of the ● status indicator
  private blinkTimer?: Phaser.Time.TimerEvent;

  // Owl roster — one glyph per expected owl, filled left→right as owls resolve.
  private owlIcons: Phaser.GameObjects.Text[] = [];
  private owlResolved = 0; // how many glyphs have been flipped this wave
  private owlWave = -1; // wave the current roster was built for

  // Centered, enlarged power meter (shared with the toggle-flash + battery bar).
  private static readonly PWR = { x: 400, y: 8, w: 180, h: 14 };

  constructor() {
    super("HUD");
  }

  create() {
    this.gameScene = this.scene.get("Game") as GameScene;
    const w = TUNING.board.width;
    const hud = TUNING.fx.hud;
    this.dotOn = true;
    this.flashT = 0;
    this.owlIcons = [];
    this.owlResolved = 0;
    this.owlWave = -1;

    // top bar background + bright console divider along its bottom edge
    this.add.rectangle(0, 0, w, 52, 0x0b1220, 0.85).setOrigin(0, 0);
    this.add.rectangle(0, 52, w, 1, hud.accent, 0.5).setOrigin(0, 0);

    const readout = (x: number, color: string, origin = 0) =>
      this.add
        .text(x, 8, "", { fontFamily: "monospace", fontSize: "15px", color })
        .setOrigin(origin, 0);

    this.statusText = readout(12, hud.online);
    this.crText = readout(150, "#fde68a");
    this.integText = readout(250, hud.online);
    this.pwrLabel = readout(360, "#e2e8f0");
    this.pwrLabel.setText("PWR");
    this.availText = readout(590, "#e2e8f0");
    this.cycleText = readout(w - 12, "#93c5fd", 1);

    this.bar = this.add.graphics();

    this.buildCrt();

    // Blink the ● status dot; update() reads dotOn to compose the label.
    this.blinkTimer = this.time.addEvent({
      delay: hud.dotBlinkMs,
      loop: true,
      callback: () => (this.dotOn = !this.dotOn),
    });

    EventBus.on(EV.powerToggled, this.onPowerToggled, this);
    EventBus.on(EV.personDelivered, this.onOwlDelivered, this);
    EventBus.on(EV.personRageQuit, this.onOwlFailed, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(EV.powerToggled, this.onPowerToggled, this);
      EventBus.off(EV.personDelivered, this.onOwlDelivered, this);
      EventBus.off(EV.personRageQuit, this.onOwlFailed, this);
      this.blinkTimer?.remove();
    });
  }

  private onPowerToggled() {
    this.flashT = TUNING.fx.hudFlashMs;
  }

  private onOwlDelivered(kind: PersonKind) {
    const hud = TUNING.fx.hud;
    this.resolveOwl(kind === "professor" ? hud.owlProfessor : hud.owlStudent);
  }

  private onOwlFailed() {
    this.resolveOwl(TUNING.fx.hud.owlFail);
  }

  // Flip the next pending roster glyph to its resolved icon.
  private resolveOwl(glyph: string) {
    const icon = this.owlIcons[this.owlResolved];
    if (!icon) return;
    icon.setText(glyph).setAlpha(1);
    this.owlResolved++;
  }

  // (Re)build the roster of faded owl outlines for the current wave.
  private buildOwlRoster(total: number) {
    const hud = TUNING.fx.hud;
    for (const icon of this.owlIcons) icon.destroy();
    this.owlIcons = [];
    this.owlResolved = 0;
    for (let i = 0; i < total; i++) {
      this.owlIcons.push(
        this.add
          .text(hud.owlStartX + i * hud.owlStep, hud.owlY, hud.owlPending, {
            fontFamily: "sans-serif",
            fontSize: `${hud.owlSize}px`,
          })
          .setOrigin(0, 0)
          .setAlpha(hud.owlPendingAlpha)
      );
    }
  }

  // Draw the CRT overlay once: scanlines, a flicker wash, and an edge vignette.
  // All non-interactive + high depth so they sit over the board without eating
  // the game's drag input.
  private buildCrt() {
    const { width, height } = TUNING.board;
    const crt = TUNING.fx.crt;

    const scan = this.add.graphics().setDepth(902);
    scan.fillStyle(crt.scanlineColor, crt.scanlineAlpha);
    for (let y = 0; y < height; y += crt.scanlineSpacing) {
      scan.fillRect(0, y, width, 1);
    }

    // Faux vignette: nested rectangle strokes fading inward from the edge.
    const vig = this.add.graphics().setDepth(901);
    for (let i = 0; i < crt.vignetteSize; i++) {
      const a = crt.vignetteAlpha * (1 - i / crt.vignetteSize);
      vig.lineStyle(1, crt.vignetteColor, a);
      vig.strokeRect(i, i, width - i * 2, height - i * 2);
    }

    this.flicker = this.add
      .rectangle(0, 0, width, height, crt.flickerColor, crt.flickerBaseAlpha)
      .setOrigin(0, 0)
      .setDepth(900);
  }

  update() {
    const hud = TUNING.fx.hud;
    const crt = TUNING.fx.crt;
    const brownout = this.gameScene.isBrownout;
    const supply = this.gameScene.powerSupply;
    const available = Math.max(0, supply - this.gameScene.powerLoad);
    const frac = supply > 0 ? Phaser.Math.Clamp(available / supply, 0, 1) : 0;

    // Rebuild the owl roster when a new wave begins (poll-driven so it survives
    // any event-timing race at launch / between waves).
    if (this.owlWave !== this.gameScene.waveNumber && this.gameScene.expectedOwls > 0) {
      this.owlWave = this.gameScene.waveNumber;
      this.buildOwlRoster(this.gameScene.expectedOwls);
    }

    // --- status + telemetry readouts ---
    const dot = this.dotOn ? "●" : " ";
    this.statusText.setText(`SAM-e ${dot} ${brownout ? "FAULT" : "ONLINE"}`);
    this.statusText.setColor(brownout ? hud.fault : hud.online);

    this.crText.setText(`CR ${Math.floor(gameState.money)}`);

    const integ = Math.min(100, Math.max(0, Math.ceil(gameState.reputation)));
    this.integText.setText(`INTEG ${integ}%`);
    this.integText.setColor(integ > 50 ? "#86efac" : integ > 25 ? "#fbbf24" : "#fca5a5");

    this.cycleText.setText(`CYCLE ${this.gameScene.waveNumber}/${this.gameScene.waveCount}`);

    // --- power meter (available = supply − load; full & green = lots free) ---
    const { x, y, w: bw, h: bh } = HUDScene.PWR;
    this.bar.clear();
    this.bar.fillStyle(0x1e293b, 1);
    this.bar.fillRect(x, y, bw, bh);
    const col =
      brownout || frac <= 0 ? 0xef4444 : frac > 0.4 ? 0x22c55e : frac > 0.2 ? 0xf59e0b : 0xef4444;
    this.bar.fillStyle(col, 1);
    this.bar.fillRect(x, y, bw * frac, bh);
    this.bar.lineStyle(1, 0x475569, 1);
    this.bar.strokeRect(x, y, bw, bh);

    // Flash overlay on toggle: a bright wash + thick stroke that fades out.
    if (this.flashT > 0) {
      this.flashT = Math.max(0, this.flashT - this.sys.game.loop.delta);
      const a = this.flashT / TUNING.fx.hudFlashMs;
      this.bar.fillStyle(0xf8fafc, 0.5 * a);
      this.bar.fillRect(x, y, bw, bh);
      this.bar.lineStyle(2, 0x7dd3fc, a);
      this.bar.strokeRect(x - 1, y - 1, bw + 2, bh + 2);
    }

    // battery bar (only when a battery is owned)
    const cap = this.gameScene.batteryCapacity;
    if (cap > 0) {
      const bfrac = Phaser.Math.Clamp(this.gameScene.batteryCharge / cap, 0, 1);
      this.bar.fillStyle(0x1e293b, 1);
      this.bar.fillRect(x, y + bh + 3, bw, 4);
      this.bar.fillStyle(0x38bdf8, 1);
      this.bar.fillRect(x, y + bh + 3, bw * bfrac, 4);
    }

    this.availText.setText(brownout ? "BROWNOUT" : `${Math.round(available)}`);
    this.availText.setColor(brownout ? "#fca5a5" : "#e2e8f0");

    // --- CRT flicker: smooth sine wobble around the base alpha ---
    const flick = crt.flickerBaseAlpha + crt.flickerAmplitude * Math.sin(this.time.now * crt.flickerSpeed);
    this.flicker.setAlpha(Math.max(0, flick));
  }
}
