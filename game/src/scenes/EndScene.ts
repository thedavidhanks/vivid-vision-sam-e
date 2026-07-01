import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { gameState } from "../state/GameState";

export class EndScene extends Phaser.Scene {
  private won = false;
  private money = 0;
  private wave = 1;

  constructor() {
    super("End");
  }

  init(data: { won: boolean; money: number; wave: number }) {
    this.won = data.won;
    this.money = data.money ?? 0;
    this.wave = data.wave ?? 1;
  }

  create() {
    const { width, height } = TUNING.board;
    this.cameras.main.setBackgroundColor(this.won ? "#052e16" : "#3f1d1d");

    // persist a simple best score
    const prev = Number(localStorage.getItem("campusControl.best") ?? 0);
    const best = Math.max(prev, this.money);
    localStorage.setItem("campusControl.best", String(best));

    this.add
      .text(width / 2, height / 2 - 120, this.won ? "CAMPUS ONLINE 🦉" : "GAME OVER", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "58px",
        color: this.won ? "#86efac" : "#fca5a5",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 - 40,
        this.won
          ? "You kept the owls moving and the lights (mostly) off."
          : `Reputation ran out on wave ${this.wave}.`,
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "20px",
          color: "#e2e8f0",
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 20,
        `Earnings: $${Math.floor(this.money)}     Best: $${Math.floor(best)}`,
        {
          fontFamily: "monospace",
          fontSize: "22px",
          color: "#fde68a",
        }
      )
      .setOrigin(0.5);

    const again = this.add
      .text(width / 2, height / 2 + 110, "▶  PLAY AGAIN", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: "#0f172a",
        backgroundColor: "#34d399",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setPadding(16, 10, 16, 10)
      .setInteractive({ useHandCursor: true });

    again.on("pointerdown", () => {
      gameState.reset();
      this.scene.start("Game");
      this.scene.launch("HUD");
    });
  }
}
