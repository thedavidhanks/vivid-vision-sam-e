import Phaser from "phaser";
import { drawOwl, type OwlKind, type OwlView } from "../art/owl";

// Standalone harness (served by Vite at /owl-preview.html) that bakes the owl
// textures with drawOwl, wires up walk animations, and lays out all four
// directions for both kinds so the art can be reviewed before it goes in-game.

const SIZES: Record<OwlKind, { w: number; h: number }> = {
  professor: { w: 48, h: 60 },
  student: { w: 40, h: 50 },
};

// dir -> which baked view + whether to mirror horizontally
const DIRS: { label: string; view: OwlView; flip: boolean }[] = [
  { label: "DOWN", view: "front", flip: false },
  { label: "UP", view: "back", flip: false },
  { label: "LEFT", view: "side", flip: true },
  { label: "RIGHT", view: "side", flip: false },
];

const VIEWS: OwlView[] = ["front", "back", "side"];
const KINDS: OwlKind[] = ["professor", "student"];
// Sample garment colors for the preview (in-game these are the destination building color).
const GARMENT: Record<OwlKind, number> = { professor: 0x2f6df6, student: 0xe23b3b };
const SCALE = 3;

class PreviewScene extends Phaser.Scene {
  constructor() {
    super("Preview");
  }

  create() {
    // Bake textures + build one walk anim per (kind, view).
    for (const kind of KINDS) {
      const { w, h } = SIZES[kind];
      for (const view of VIEWS) {
        for (const frame of [0, 1] as const) {
          const g = this.add.graphics();
          drawOwl(g, { kind, view, frame, w, h, garment: GARMENT[kind] });
          g.generateTexture(`${kind}_${view}_${frame}`, w, h);
          g.destroy();
        }
        this.anims.create({
          key: `${kind}_${view}`,
          frames: [{ key: `${kind}_${view}_0` }, { key: `${kind}_${view}_1` }],
          frameRate: 6,
          repeat: -1,
        });
      }
    }

    const colW = 200;
    const startX = 140;
    const rowY = [170, 360];

    KINDS.forEach((kind, r) => {
      this.add
        .text(24, rowY[r] - 12, kind === "professor" ? "OWL\n(cap+stole)" : "OWLET\n(backpack)", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#e2e8f0",
        })
        .setOrigin(0, 0.5);

      DIRS.forEach((d, c) => {
        const x = startX + c * colW;
        const y = rowY[r];
        if (r === 0) {
          this.add
            .text(x, 70, d.label, { fontFamily: "monospace", fontSize: "13px", color: "#93c5fd" })
            .setOrigin(0.5);
        }
        this.add
          .sprite(x, y, `${kind}_${d.view}_0`)
          .setScale(SCALE)
          .setFlipX(d.flip)
          .play(`${kind}_${d.view}`);
      });
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: startWidth(),
  height: 470,
  backgroundColor: "#0f172a",
  parent: "game",
  scene: [PreviewScene],
  render: { pixelArt: false, antialias: true },
});

function startWidth() {
  return 140 + 4 * 200 + 20;
}
