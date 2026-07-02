import Phaser from "phaser";
import { drawOwl, type OwlKind, type OwlView } from "../art/owl";
import { TUNING } from "../data/tuning";
import { CAMPUS } from "../data/campus";

// All art is generated at runtime as textures — no external asset files, so the
// build is a tiny self-contained static bundle.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  create() {
    this.makeOwls();
    this.makeDrone("drone", 30, 30);
    this.scene.start("Menu");
  }

  // Bake a walking-owl spritesheet in code: for each kind and facing (front / back /
  // side), two frames of a walk cycle, plus a looping animation per direction. The
  // garment (owl cap+stole / owlet backpack) is tinted to the destination building's
  // color, so textures + anims are keyed per building id. Left is produced at runtime
  // by flipping the side textures (see Person).
  private makeOwls() {
    const sizes: Record<OwlKind, { w: number; h: number }> = {
      professor: { w: 48, h: 60 },
      student: { w: 40, h: 50 },
    };
    // view -> the direction suffix used for its walk animation
    const views: { view: OwlView; dir: "down" | "up" | "side" }[] = [
      { view: "front", dir: "down" },
      { view: "back", dir: "up" },
      { view: "side", dir: "side" },
    ];

    for (const b of CAMPUS.buildings) {
      const garment = b.color ?? 0x94a3b8;
      for (const kind of ["professor", "student"] as OwlKind[]) {
        const { w, h } = sizes[kind];
        for (const { view, dir } of views) {
          for (const frame of [0, 1] as const) {
            const g = this.add.graphics();
            drawOwl(g, { kind, view, frame, w, h, garment });
            g.generateTexture(`${kind}_${b.id}_${view}_${frame}`, w, h);
            g.destroy();
          }
          this.anims.create({
            key: `${kind}_${b.id}_walk_${dir}`,
            frames: [{ key: `${kind}_${b.id}_${view}_0` }, { key: `${kind}_${b.id}_${view}_1` }],
            frameRate: TUNING.person.walkFrameRate,
            repeat: -1,
          });
        }
      }
    }
  }

  private makeDrone(key: string, w: number, h: number) {
    const g = this.add.graphics();
    const cx = w / 2;
    const cy = h / 2;
    g.lineStyle(3, 0x5b6b7a, 1);
    g.beginPath();
    g.moveTo(cx - 10, cy - 10);
    g.lineTo(cx + 10, cy + 10);
    g.moveTo(cx + 10, cy - 10);
    g.lineTo(cx - 10, cy + 10);
    g.strokePath();
    g.fillStyle(0x7fd1ff, 0.95);
    for (const [dx, dy] of [
      [-10, -10],
      [10, -10],
      [-10, 10],
      [10, 10],
    ]) {
      g.fillCircle(cx + dx, cy + dy, 4);
    }
    g.fillStyle(0x334155, 1);
    g.fillCircle(cx, cy, 6);
    g.fillStyle(0x22d3ee, 1);
    g.fillCircle(cx, cy, 2.5);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
