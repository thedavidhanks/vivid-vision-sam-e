import Phaser from "phaser";
import { TUNING } from "../data/tuning";

// Paused-over manual/help overlay. GameScene launches this and pauses itself
// when the player hits Escape; Escape or the Resume button dismisses it and
// resumes the game (mirrors the ShopScene overlay pattern).
export class ManualScene extends Phaser.Scene {
  constructor() {
    super("Manual");
  }

  create() {
    const { width, height } = TUNING.board;
    this.add.rectangle(0, 0, width, height, 0x0b1220, 0.86).setOrigin(0, 0);

    this.add
      .text(width / 2, 80, "PAUSED — MANUAL", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "40px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const how = [
      "🦉 Owls with caps = professors.   🐤 Owlets with backpacks = students.",
      "",
      "• Click a person and DRAG a path to their building. Release to send them.",
      "• Some buildings must be powered ON (click them) to let people in —",
      "  but lit buildings drain your kWh reserve. Turn them off when idle!",
      "• Water leaks block paths. Click a DRONE and drag it to the leak to fix it.",
      "• People run out of patience if stuck. Lose too many and it's game over.",
      "• Clear a wave to reach the shop and spend your cash on upgrades.",
      "",
      "You lose when reputation hits 0 — from rage-quits or brownouts.",
    ];
    this.add
      .text(width / 2, height / 2, how.join("\n"), {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#cbd5e1",
        align: "left",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const resume = this.add
      .text(width / 2, height - 70, "▶  RESUME  (Esc)", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: "#0f172a",
        backgroundColor: "#34d399",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setPadding(16, 10, 16, 10)
      .setInteractive({ useHandCursor: true });

    resume.on("pointerdown", () => this.close());
    this.input.keyboard?.on("keydown-ESC", () => this.close());
  }

  private close() {
    this.scene.resume("Game");
    this.scene.stop();
  }
}
