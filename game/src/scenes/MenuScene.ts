import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { gameState } from "../state/GameState";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    const { width, height } = TUNING.board;
    this.cameras.main.setBackgroundColor("#0f172a");

    this.add
      .text(width / 2, height / 2 - 150, "CAMPUS CONTROL", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "56px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 96, "Route the owls. Mind the power.", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#94a3b8",
      })
      .setOrigin(0.5);

    const how = [
      "🦉 Owls with caps = professors.   🐤 Owlets with backpacks = students.",
      "• Click a person and DRAG a path to their building. Release to send them.",
      "• Some buildings must be powered ON (click them) to let people in —",
      "  but lit buildings drain your kWh reserve. Turn them off when idle!",
      "• Water leaks block paths. Click a DRONE and drag it to the leak to fix it.",
      "• People run out of patience if stuck. Lose too many and it's game over.",
    ];
    this.add
      .text(width / 2, height / 2 + 20, how.join("\n"), {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#cbd5e1",
        align: "left",
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height / 2 + 180, "▶  CLICK TO START", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#0f172a",
        backgroundColor: "#34d399",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setPadding(16, 10, 16, 10)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: start,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.input.once("pointerdown", () => {
      gameState.reset();
      this.scene.start("Game");
      this.scene.launch("HUD");
    });
  }
}
