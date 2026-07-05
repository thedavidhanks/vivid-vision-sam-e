import { drawOwl, type OwlKind, type OwlView } from "../src/art/owl";

// Headless preview: a minimal shim implementing the subset of Phaser's Graphics
// API that drawOwl() actually uses, emitting SVG instead of drawing to a canvas.
// Lets us render the procedural owl art to a viewable image with no browser.

const hex = (c: number) => "#" + (c & 0xffffff).toString(16).padStart(6, "0");

class SvgGraphics {
  parts: string[] = [];
  private fill = "#000";
  private fillA = 1;
  private strokeW = 1;
  private stroke = "#000";
  private strokeA = 1;
  private path: string[] = [];

  fillStyle(color: number, alpha = 1) {
    this.fill = hex(color);
    this.fillA = alpha;
  }
  lineStyle(width: number, color: number, alpha = 1) {
    this.strokeW = width;
    this.stroke = hex(color);
    this.strokeA = alpha;
  }
  fillCircle(x: number, y: number, r: number) {
    this.parts.push(
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${this.fill}" fill-opacity="${this.fillA}" stroke="none"/>`
    );
  }
  fillEllipse(x: number, y: number, w: number, h: number) {
    // Phaser fillEllipse takes full width/height (diameters)
    this.parts.push(
      `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="${this.fill}" fill-opacity="${this.fillA}" stroke="none"/>`
    );
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${this.fill}" fill-opacity="${this.fillA}" stroke="none"/>`
    );
  }
  fillRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${this.fill}" fill-opacity="${this.fillA}" stroke="none"/>`
    );
  }
  fillTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    this.parts.push(
      `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${this.fill}" fill-opacity="${this.fillA}" stroke="none"/>`
    );
  }
  beginPath() {
    this.path = [];
  }
  moveTo(x: number, y: number) {
    this.path.push(`M ${x} ${y}`);
  }
  lineTo(x: number, y: number) {
    this.path.push(`L ${x} ${y}`);
  }
  strokePath() {
    this.parts.push(
      `<path d="${this.path.join(" ")}" fill="none" stroke="${this.stroke}" stroke-opacity="${this.strokeA}" stroke-width="${this.strokeW}" stroke-linecap="round"/>`
    );
  }
}

const SIZES: Record<OwlKind, { w: number; h: number }> = {
  professor: { w: 48, h: 60 },
  student: { w: 40, h: 50 },
};
const GARMENT: Record<OwlKind, number> = { professor: 0x2f6df6, student: 0xe23b3b };

const CELLS: { label: string; kind: OwlKind; view: OwlView; flip: boolean }[] = [
  { label: "DOWN", kind: "professor", view: "front", flip: false },
  { label: "UP", kind: "professor", view: "back", flip: false },
  { label: "LEFT", kind: "professor", view: "side", flip: true },
  { label: "RIGHT", kind: "professor", view: "side", flip: false },
  { label: "DOWN", kind: "student", view: "front", flip: false },
  { label: "UP", kind: "student", view: "back", flip: false },
  { label: "LEFT", kind: "student", view: "side", flip: true },
  { label: "RIGHT", kind: "student", view: "side", flip: false },
];

const SCALE = 5;
const COL_W = 200;
const ROW_H = 330;
const START_X = 120;
const cols = 4;
const ROW_TOP = 250;

function cell(c: (typeof CELLS)[number], cx: number, cy: number, frame: 0 | 1): string {
  const { w, h } = SIZES[c.kind];
  const g = new SvgGraphics();
  drawOwl(g as any, { kind: c.kind, view: c.view, frame, w, h, garment: GARMENT[c.kind] });
  const flip = c.flip ? `translate(${w} 0) scale(-1 1)` : "";
  // center the wxh art box within the cell, scaled up
  const tx = cx - (w * SCALE) / 2;
  const ty = cy - (h * SCALE) / 2;
  return `<g transform="translate(${tx} ${ty}) scale(${SCALE})"><g transform="${flip}">${g.parts.join("")}</g></g>`;
}

const rows = 2;
const width = START_X + cols * COL_W;
const height = ROW_TOP - 100 + rows * ROW_H;
const out: string[] = [];
out.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
);
out.push(`<rect width="${width}" height="${height}" fill="#0f172a"/>`);
out.push(
  `<text x="${width / 2}" y="34" fill="#e2e8f0" font-family="DejaVu Sans Mono, monospace" font-size="18" text-anchor="middle">Owl &amp; Owlet — ${process.argv[2] ?? "preview"}</text>`
);

["professor", "student"].forEach((kind, r) => {
  const rowCy = ROW_TOP + r * ROW_H;
  out.push(
    `<text x="24" y="${rowCy}" fill="#e2e8f0" font-family="DejaVu Sans Mono, monospace" font-size="13">${kind === "professor" ? "OWL" : "OWLET"}</text>`
  );
  CELLS.filter((c) => c.kind === kind).forEach((c, col) => {
    const cx = START_X + col * COL_W + COL_W / 2;
    if (r === 0) {
      out.push(
        `<text x="${cx}" y="70" fill="#93c5fd" font-family="DejaVu Sans Mono, monospace" font-size="13" text-anchor="middle">${c.label}</text>`
      );
    }
    out.push(cell(c, cx, rowCy, 0));
  });
});
out.push(`</svg>`);

process.stdout.write(out.join("\n"));
