import Phaser from "phaser";

// All art is generated at runtime as textures — no external asset files, so the
// build is a tiny self-contained static bundle.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  create() {
    this.makeOwl("professor", 42, 46, 0x8b5a2b, 0xd9b382, "cap");
    this.makeOwl("student", 32, 36, 0xb5794a, 0xe6cba0, "beanie");
    this.makeDrone("drone", 30, 30);
    this.scene.start("Menu");
  }

  private makeOwl(
    key: string,
    w: number,
    h: number,
    body: number,
    belly: number,
    hat: "cap" | "beanie"
  ) {
    const g = this.add.graphics();
    const cx = w / 2;
    const cy = h / 2 + 3;

    // ear tufts
    g.fillStyle(body, 1);
    g.fillTriangle(cx - 11, cy - 5, cx - 4, cy - 13, cx - 2, cy - 3);
    g.fillTriangle(cx + 11, cy - 5, cx + 4, cy - 13, cx + 2, cy - 3);

    // body + belly
    g.fillStyle(body, 1);
    g.fillEllipse(cx, cy, w - 8, h - 14);
    g.fillStyle(belly, 1);
    g.fillEllipse(cx, cy + 4, (w - 8) * 0.55, (h - 14) * 0.62);

    // eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6, cy - 2, 5);
    g.fillCircle(cx + 6, cy - 2, 5);
    g.fillStyle(0x1f2937, 1);
    g.fillCircle(cx - 6, cy - 2, 2.4);
    g.fillCircle(cx + 6, cy - 2, 2.4);

    // beak
    g.fillStyle(0xf4a300, 1);
    g.fillTriangle(cx - 3, cy + 4, cx + 3, cy + 4, cx, cy + 10);

    if (hat === "cap") {
      // graduation cap
      g.fillStyle(0x111827, 1);
      g.fillRect(cx - 12, cy - 15, 24, 4); // mortarboard
      g.fillRect(cx - 6, cy - 21, 12, 6); // crown
      g.lineStyle(2, 0xffd23f, 1);
      g.beginPath();
      g.moveTo(cx + 10, cy - 15);
      g.lineTo(cx + 14, cy - 6);
      g.strokePath();
      g.fillStyle(0xffd23f, 1);
      g.fillCircle(cx + 14, cy - 5, 2);
    } else {
      // beanie + pom
      g.fillStyle(0xd1495b, 1);
      g.fillEllipse(cx, cy - 11, 22, 9);
      g.fillRect(cx - 11, cy - 11, 22, 4);
      g.fillStyle(0xf7b32b, 1);
      g.fillCircle(cx, cy - 17, 3);
      // little backpack strap hint
      g.fillStyle(0x2563eb, 1);
      g.fillRect(cx - 9, cy - 1, 3, 8);
      g.fillRect(cx + 6, cy - 1, 3, 8);
    }

    g.generateTexture(key, w, h);
    g.destroy();
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
