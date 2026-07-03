import Phaser from "phaser";
import type { Vec } from "../data/types";
import { TUNING } from "../data/tuning";

// A water leak: blocks any person-path that crosses it until a drone repairs it.
export class Obstruction {
  scene: Phaser.Scene;
  x: number;
  y: number;
  radius: number;
  gfx: Phaser.GameObjects.Graphics;
  t = 0; // animation clock
  claimed = false; // a drone is on its way / fixing

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = TUNING.water.radius;
    this.gfx = scene.add.graphics().setDepth(8);
  }

  get pos(): Vec {
    return { x: this.x, y: this.y };
  }

  update(dt: number) {
    this.t += dt;
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
    this.gfx.clear();
    this.gfx.fillStyle(0x2b6cb0, 0.28 + 0.12 * pulse);
    this.gfx.fillCircle(this.x, this.y, this.radius);
    this.gfx.lineStyle(2, 0x63b3ed, 0.9);
    this.gfx.strokeCircle(this.x, this.y, this.radius * (0.7 + 0.25 * pulse));
    // droplet
    this.gfx.fillStyle(0xbfe3ff, 0.95);
    this.gfx.fillCircle(this.x, this.y - 3, 4);
  }

  contains(p: Vec, pad = 0): boolean {
    return Phaser.Math.Distance.Between(p.x, p.y, this.x, this.y) <= this.radius + pad;
  }

  destroy() {
    this.gfx.destroy();
  }
}
