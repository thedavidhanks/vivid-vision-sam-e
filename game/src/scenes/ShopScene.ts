import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { UPGRADES } from "../data/upgrades";
import { gameState } from "../state/GameState";
import { canAfford } from "../systems/economy";
import type { GameScene } from "./GameScene";

// Between-wave shop. Upgrades reveal by unlockWave; buying mutates GameState.
export class ShopScene extends Phaser.Scene {
  private nextWave = 1;

  constructor() {
    super("Shop");
  }

  init(data: { nextWave: number }) {
    this.nextWave = data.nextWave ?? 1;
  }

  create() {
    const { width, height } = TUNING.board;
    this.add.rectangle(0, 0, width, height, 0x0b1220, 0.82).setOrigin(0, 0);

    this.add
      .text(width / 2, 70, `Semester ${this.nextWave} cleared!`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const money = this.add
      .text(width / 2, 112, `You have $${Math.floor(gameState.money)}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#86efac",
      })
      .setOrigin(0.5);

    // upgrades unlocked by now and not already owned
    const available = UPGRADES.filter(
      (u) => u.unlockWave <= this.nextWave && !gameState.upgrades.has(u.id)
    );

    let y = 170;
    if (available.length === 0) {
      this.add
        .text(width / 2, y + 20, "No new upgrades available — save your cash.", {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#cbd5e1",
        })
        .setOrigin(0.5);
    }

    for (const u of available) {
      const card = this.add
        .rectangle(width / 2, y, 560, 66, 0x1e293b, 1)
        .setStrokeStyle(2, 0x334155)
        .setInteractive({ useHandCursor: true });

      const title = this.add
        .text(width / 2 - 260, y - 18, `${u.name}  —  $${u.cost}`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "18px",
          color: "#f8fafc",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      this.add
        .text(width / 2 - 260, y + 12, u.description, {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#94a3b8",
        })
        .setOrigin(0, 0.5);

      const refresh = () => {
        const affordable = canAfford(gameState.money, u.cost);
        card.setStrokeStyle(2, affordable ? 0x22c55e : 0x475569);
        title.setColor(affordable ? "#f8fafc" : "#64748b");
      };
      refresh();

      card.on("pointerdown", () => {
        if (!canAfford(gameState.money, u.cost)) return;
        gameState.money -= u.cost;
        gameState.upgrades.add(u.id);
        money.setText(`You have $${Math.floor(gameState.money)}`);
        card.disableInteractive();
        card.setFillStyle(0x14532d, 1);
        title.setText(`${u.name}  —  PURCHASED`);
      });

      y += 82;
    }

    const start = this.add
      .text(width / 2, height - 60, `▶  START SEMESTER ${this.nextWave + 1}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: "#0f172a",
        backgroundColor: "#34d399",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setPadding(16, 10, 16, 10)
      .setInteractive({ useHandCursor: true });

    start.on("pointerdown", () => {
      const game = this.scene.get("Game") as GameScene;
      this.scene.stop();
      game.beginNextWave(this.nextWave);
    });
  }
}
