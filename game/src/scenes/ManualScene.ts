import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { gameState } from "../state/GameState";

// Paused-over manual/help overlay. GameScene launches this and pauses itself
// when the player hits Escape; Escape or the Resume button dismisses it and
// resumes the game (mirrors the ShopScene overlay pattern). The overlay also
// offers "Main Menu" and "Restart Level" exits.
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
      "• Click a person and DRAG a path to a similarly colored building. Release to send them.",
      "• Buildings must be powered ON (click them) to let people in —",
      "  but lit buildings drain your kWh reserve. Turn them off when idle!",
      "• Water leaks block paths. Click a DRONE and drag it to the leak to fix it.",
      "• People run out of patience if stuck. Lose too many and it's game over.",
      "• Clear a semester to reach the shop and spend your cash on upgrades.",
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

    const y = height - 70;
    this.makeButton(width / 2 - 230, y, "▶  RESUME  (Esc)", "#34d399", () => this.close());
    this.makeButton(width / 2, y, "↻  RESTART LEVEL", "#fbbf24", () => this.restart());
    this.makeButton(width / 2 + 230, y, "⏏  MAIN MENU", "#f87171", () => this.toMenu());

    this.input.keyboard?.on("keydown-ESC", () => this.close());
  }

  private makeButton(x: number, y: number, label: string, bg: string, onClick: () => void) {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#0f172a",
        backgroundColor: bg,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setPadding(16, 10, 16, 10)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerdown", onClick);
    return btn;
  }

  // Dismiss the overlay and resume the paused game.
  private close() {
    this.scene.resume("Game");
    this.scene.stop();
  }

  // Restart the run from wave 1 with fresh state.
  private restart() {
    gameState.reset();
    this.scene.stop("HUD");
    this.scene.stop("Game");
    this.scene.start("Game");
    this.scene.launch("HUD");
    this.scene.stop();
  }

  // Abandon the run and return to the main menu.
  private toMenu() {
    this.scene.stop("HUD");
    this.scene.stop("Game");
    this.scene.start("Menu");
    this.scene.stop();
  }
}
