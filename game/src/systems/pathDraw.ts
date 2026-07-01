import Phaser from "phaser";
import type { Vec } from "../data/types";
import { TUNING } from "../data/tuning";

export type DrawSourceKind = "person" | "drone";

export interface DrawSource {
  kind: DrawSourceKind;
  ref: any; // Person | Drone
  start: Vec;
}

// Captures a free-draw polyline (ATC-style) from a selected person or drone and
// renders a live preview. GameScene owns commit/validation.
export class DrawController {
  scene: Phaser.Scene;
  gfx: Phaser.GameObjects.Graphics;
  active = false;
  source: DrawSource | null = null;
  points: Vec[] = [];
  color = 0x38bdf8;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(15);
  }

  begin(source: DrawSource, color: number) {
    this.active = true;
    this.source = source;
    this.color = color;
    this.points = [{ x: source.start.x, y: source.start.y }];
    this.redraw();
  }

  addPoint(p: Vec) {
    if (!this.active) return;
    const last = this.points[this.points.length - 1];
    if (Phaser.Math.Distance.Between(last.x, last.y, p.x, p.y) >= TUNING.draw.minPointDist) {
      this.points.push({ x: p.x, y: p.y });
      this.redraw();
    }
  }

  /** Finish drawing; returns the captured points (or null if nothing meaningful). */
  end(): Vec[] | null {
    if (!this.active) return null;
    const pts = this.points;
    this.active = false;
    this.source = null;
    this.gfx.clear();
    return pts.length >= 2 ? pts : null;
  }

  cancel() {
    this.active = false;
    this.source = null;
    this.points = [];
    this.gfx.clear();
  }

  flashInvalid(pts: Vec[]) {
    this.gfx.clear();
    this.gfx.lineStyle(3, 0xf87171, 0.9);
    this.strokePts(pts);
    this.scene.time.delayedCall(220, () => this.gfx.clear());
  }

  private redraw() {
    this.gfx.clear();
    this.gfx.lineStyle(3, this.color, 0.85);
    this.strokePts(this.points);
  }

  private strokePts(pts: Vec[]) {
    if (pts.length < 2) return;
    this.gfx.beginPath();
    this.gfx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) this.gfx.lineTo(pts[i].x, pts[i].y);
    this.gfx.strokePath();
  }
}
