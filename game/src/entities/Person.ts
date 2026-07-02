import Phaser from "phaser";
import type { PersonKind, Vec } from "../data/types";
import type { OwlView } from "../art/owl";
import { TUNING } from "../data/tuning";

export type PersonState = "waiting" | "walking" | "atDoor" | "done";

// A professor (owl + grad cap) or student (owlet + backpack) crossing campus.
export class Person {
  scene: Phaser.Scene;
  kind: PersonKind;
  destId: string;

  sprite: Phaser.GameObjects.Sprite;
  ring: Phaser.GameObjects.Graphics; // patience indicator

  state: PersonState = "waiting";
  patience: number;
  maxPatience: number;

  path: Vec[] = [];
  seg = 0; // index of the segment start we're walking from

  private facingView: OwlView = "front"; // which baked pose is currently shown
  private tex: string; // texture/anim key prefix — `${kind}_${destId}` (garment tinted per building)

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PersonKind, destId: string) {
    this.scene = scene;
    this.kind = kind;
    this.destId = destId;
    this.tex = `${kind}_${destId}`;
    this.maxPatience = TUNING.person.patience;
    this.patience = this.maxPatience;

    this.sprite = scene.add
      .sprite(x, y, `${this.tex}_front_0`) // standing, facing the viewer
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.sprite.setData("kind", "person");
    this.sprite.setData("ref", this);

    this.ring = scene.add.graphics().setDepth(19);
  }

  setPath(points: Vec[]) {
    this.path = points;
    this.seg = 0;
    this.state = "walking";
  }

  get pos(): Vec {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  // How satisfied the owl is right now: fraction of patience remaining (1 = fresh,
  // 0 = about to rage-quit). Drives the delivery payout — see GameScene.deliver.
  get satisfaction(): number {
    return Phaser.Math.Clamp(this.patience / this.maxPatience, 0, 1);
  }

  setPos(x: number, y: number) {
    const dx = x - this.sprite.x;
    const dy = y - this.sprite.y;
    this.sprite.setPosition(x, y);
    this.drawRing();
    if (this.state === "walking" && (dx !== 0 || dy !== 0)) this.faceMovement(dx, dy);
  }

  // Point the owl the way it's walking (Left = mirrored Right) and run the walk cycle.
  private faceMovement(dx: number, dy: number) {
    let view: OwlView;
    let dir: "down" | "up" | "side";
    let flip = false;
    if (Math.abs(dx) >= Math.abs(dy)) {
      view = "side";
      dir = "side";
      flip = dx < 0; // moving left → mirror the right-facing art
    } else if (dy > 0) {
      view = "front";
      dir = "down";
    } else {
      view = "back";
      dir = "up";
    }
    this.facingView = view;
    this.sprite.setFlipX(flip);
    const key = `${this.tex}_walk_${dir}`;
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) {
      this.sprite.play(key);
    }
  }

  // Freeze on a standing frame (keeps the last-faced direction) while not walking.
  idle() {
    if (this.sprite.anims.isPlaying) this.sprite.anims.stop();
    this.sprite.setTexture(`${this.tex}_${this.facingView}_0`);
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
  }
}
