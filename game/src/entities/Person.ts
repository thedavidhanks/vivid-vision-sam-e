import Phaser from "phaser";
import type { PersonKind, Vec } from "../data/types";
import { TUNING } from "../data/tuning";

export type PersonState = "waiting" | "walking" | "atDoor" | "done";

// A professor (owl + grad cap) or student (owlet + backpack) crossing campus.
export class Person {
  scene: Phaser.Scene;
  kind: PersonKind;
  destId: string;
  destShort: string;

  sprite: Phaser.GameObjects.Sprite;
  ring: Phaser.GameObjects.Graphics; // patience indicator
  tag: Phaser.GameObjects.Text; // destination hint

  state: PersonState = "waiting";
  patience: number;
  maxPatience: number;

  path: Vec[] = [];
  seg = 0; // index of the segment start we're walking from

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PersonKind, destId: string, destShort: string) {
    this.scene = scene;
    this.kind = kind;
    this.destId = destId;
    this.destShort = destShort;
    this.maxPatience = TUNING.person.patience;
    this.patience = this.maxPatience;

    this.sprite = scene.add
      .sprite(x, y, kind)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.sprite.setData("kind", "person");
    this.sprite.setData("ref", this);

    this.ring = scene.add.graphics().setDepth(19);
    this.tag = scene.add
      .text(x, y - 26, destShort, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#cbd5e1",
        backgroundColor: "#1f2937",
      })
      .setOrigin(0.5)
      .setPadding(3, 1, 3, 1)
      .setDepth(21);
  }

  setPath(points: Vec[]) {
    this.path = points;
    this.seg = 0;
    this.state = "walking";
  }

  get pos(): Vec {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPos(x: number, y: number) {
    this.sprite.setPosition(x, y);
    this.tag.setPosition(x, y - 26);
    this.drawRing();
  }

  drawRing() {
    this.ring.clear();
    if (this.state === "done") return;
    const frac = Phaser.Math.Clamp(this.patience / this.maxPatience, 0, 1);
    const color = frac > 0.5 ? 0x34d399 : frac > 0.25 ? 0xfbbf24 : 0xf87171;
    // Only draw a visible timer when the person is losing patience (stuck).
    if (this.state === "walking") return;
    this.ring.lineStyle(3, color, 0.95);
    this.ring.beginPath();
    this.ring.arc(this.sprite.x, this.sprite.y, 18, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    this.ring.strokePath();
  }

  destroy() {
    this.sprite.destroy();
    this.ring.destroy();
    this.tag.destroy();
  }
}
