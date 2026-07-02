import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { gameState } from "../state/GameState";
import { EventBus } from "../state/EventBus";
import { EV } from "../state/events";
import type { GameScene } from "./GameScene";

// Read-only overlay. Reads GameState + a few GameScene getters each frame rather
// than threading events for continuously-changing values.
export class HUDScene extends Phaser.Scene {
  private game!: GameScene;
  private moneyText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private powerLabel!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Graphics;
  private flashT = 0; // ms remaining on the power-bar flash (set on a toggle)

  constructor() {
    super("HUD");
  }

  create() {
    this.game = this.scene.get("Game") as GameScene;
    const w = TUNING.board.width;

    // top bar background
    this.add.rectangle(0, 0, w, 40, 0x0b1220, 0.85).setOrigin(0, 0);

    this.moneyText = this.add.text(14, 10, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#fde68a",
    });

    this.repText = this.add.text(180, 10, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#86efac",
    });

    this.waveText = this.add
      .text(w - 14, 10, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#93c5fd",
      })
      .setOrigin(1, 0);

    this.powerLabel = this.add.text(400, 10, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#e2e8f0",
    });

    this.bar = this.add.graphics();

    // Flash the power bar whenever a building is toggled, so the drain registers.
    EventBus.on(EV.powerToggled, this.onPowerToggled, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      EventBus.off(EV.powerToggled, this.onPowerToggled, this)
    );
  }

  private onPowerToggled() {
    this.flashT = TUNING.fx.hudFlashMs;
  }

  update() {
    const supply = this.game.powerSupply;
    const available = Math.max(0, supply - this.game.powerLoad);
    const frac = supply > 0 ? Phaser.Math.Clamp(available / supply, 0, 1) : 0;

    this.moneyText.setText(`$ ${Math.floor(gameState.money)}`);
    this.repText.setText(`❤ ${Math.max(0, Math.ceil(gameState.reputation))}`);
    this.waveText.setText(
      `Wave ${this.game.waveNumber}/${this.game.waveCount}   owls: ${this.game.activePeople}   to-come: ${Math.max(
        0,
        this.game.remainingToSpawn
      )}`
    );

    // power meter — power still AVAILABLE (supply − load); full & green = lots free
    const x = 400;
    const y = 22;
    const bw = 150;
    const bh = 14;
    this.bar.clear();
    this.bar.fillStyle(0x1e293b, 1);
    this.bar.fillRect(x, y, bw, bh);
    const col =
      this.game.isBrownout || frac <= 0 ? 0xef4444 : frac > 0.4 ? 0x22c55e : frac > 0.2 ? 0xf59e0b : 0xef4444;
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
    const cap = this.game.batteryCapacity;
    if (cap > 0) {
      const bfrac = Phaser.Math.Clamp(this.game.batteryCharge / cap, 0, 1);
      this.bar.fillStyle(0x1e293b, 1);
      this.bar.fillRect(x, y + bh + 4, bw, 6);
      this.bar.fillStyle(0x38bdf8, 1);
      this.bar.fillRect(x, y + bh + 4, bw * bfrac, 6);
    }

    this.powerLabel.setText(this.game.isBrownout ? "⚡ BROWNOUT!" : `⚡ ${Math.round(available)}`);
    this.powerLabel.setColor(this.game.isBrownout ? "#fca5a5" : "#e2e8f0");
    this.powerLabel.setPosition(x + bw + 10, 12);
  }
}
