import type Phaser from "phaser";

// Procedural owl / owlet art. One function draws a single pose onto a Graphics
// object; PreloadScene calls it to bake textures, and the preview harness calls
// it to show every combination. Keeping it here (Phaser-based, but self-contained)
// means the preview and the real game can never drift apart.

export type OwlKind = "professor" | "student";
export type OwlView = "front" | "back" | "side"; // "side" faces RIGHT; left is flipX at runtime

export interface DrawOwlOpts {
  kind: OwlKind;
  view: OwlView;
  frame: 0 | 1; // walk cycle frame
  w: number;
  h: number;
  garment: number; // destination-building color: owl cap+stole / owlet backpack
}

// Palette — reuses the warm browns already used elsewhere in the game.
const PALETTE: Record<OwlKind, { body: number; belly: number }> = {
  professor: { body: 0x8b5a2b, belly: 0xd9b382 },
  student: { body: 0xb5794a, belly: 0xe6cba0 },
};
const BEAK = 0xf4a300;
const LEG = 0xe0983a;
const EYE_W = 0xffffff;
const EYE_P = 0x1f2937;
const GOLD = 0xffd23f; // gold trim/tassel/buckle — constant, for contrast against the garment

// Darken a color by factor f (0..1) — used for garment shadows/depth.
function shade(color: number, f: number): number {
  const r = Math.round(((color >> 16) & 0xff) * f);
  const g = Math.round(((color >> 8) & 0xff) * f);
  const b = Math.round((color & 0xff) * f);
  return (r << 16) | (g << 8) | b;
}

export function drawOwl(g: Phaser.GameObjects.Graphics, opts: DrawOwlOpts): void {
  const { kind, view, frame, garment } = opts;
  const { body, belly } = PALETTE[kind];
  const garmentDk = shade(garment, 0.6); // shadow/back-layer of the garment
  const cx = opts.w / 2;

  // Vertical layout: head near the top, body overlapping below, legs + feet under it.
  const rH = Math.min(opts.w, opts.h) * 0.3; // head radius
  const headCy = rH + 4;
  const bodyW = opts.w * 0.66;
  const bodyH = opts.h * 0.46;
  const bodyCy = headCy + rH * 0.75;
  const bodyBottom = bodyCy + bodyH / 2;
  const footY = Math.min(opts.h - 2, bodyBottom + 5);

  // A thick "band" (rounded-ish stripe) between two points — used for stole & straps.
  const band = (x1: number, y1: number, x2: number, y2: number, wdt: number, color: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (wdt / 2);
    const ny = (dx / len) * (wdt / 2);
    g.fillStyle(color, 1);
    g.fillTriangle(x1 + nx, y1 + ny, x1 - nx, y1 - ny, x2 + nx, y2 + ny);
    g.fillTriangle(x1 - nx, y1 - ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny);
  };

  const foot = (fx: number, fy: number) => {
    g.lineStyle(2, LEG, 1);
    g.beginPath();
    g.moveTo(fx, bodyBottom - 3);
    g.lineTo(fx, fy);
    g.strokePath();
    // little talon
    g.fillStyle(LEG, 1);
    g.fillTriangle(fx - 3, fy, fx + 3, fy, fx, fy + 3);
  };

  // ---- feet / legs (behind the body) ----
  const lift = 4;
  if (view === "side") {
    // facing right: one foot forward (+x), one back (-x); swap by frame
    const fwd = opts.w * 0.14;
    const fx1 = cx + (frame === 0 ? fwd : -fwd * 0.3);
    const fx2 = cx + (frame === 0 ? fwd * 0.3 : -fwd);
    foot(fx1, footY);
    foot(fx2, footY - 2);
  } else {
    const spread = opts.w * 0.16;
    foot(cx - spread, footY - (frame === 0 ? 0 : lift));
    foot(cx + spread, footY - (frame === 1 ? 0 : lift));
  }

  // ---- owlet side backpack bulge (behind the body) ----
  if (kind === "student" && view === "side") {
    g.fillStyle(garmentDk, 1);
    g.fillEllipse(cx - bodyW * 0.34, bodyCy, bodyW * 0.46, bodyH * 0.86);
    g.fillStyle(garment, 1);
    g.fillEllipse(cx - bodyW * 0.34, bodyCy, bodyW * 0.36, bodyH * 0.68);
  }

  // ---- body + belly ----
  g.fillStyle(body, 1);
  g.fillEllipse(cx, bodyCy, bodyW, bodyH);
  if (view === "front") {
    g.fillStyle(belly, 1);
    g.fillEllipse(cx, bodyCy + bodyH * 0.12, bodyW * 0.54, bodyH * 0.62);
  } else if (view === "side") {
    g.fillStyle(belly, 1);
    g.fillEllipse(cx + bodyW * 0.16, bodyCy + bodyH * 0.14, bodyW * 0.4, bodyH * 0.56);
  }

  // ---- body-level regalia / backpack (drawn before the head so the head + eyes
  // always sit on top and are never covered) ----
  if (kind === "professor") {
    drawStole(g, band, view, cx, bodyW, bodyH, bodyCy, bodyBottom, garment);
  } else {
    drawPack(g, band, view, cx, bodyW, bodyH, bodyCy, bodyBottom, garment, garmentDk);
  }

  // ---- head ---- (ear tufts are drawn later, on top of the cap)
  g.fillStyle(body, 1);
  g.fillCircle(cx, headCy, rH);

  // ---- face ----
  if (view === "front") {
    g.fillStyle(EYE_W, 1);
    g.fillCircle(cx - rH * 0.42, headCy, rH * 0.34);
    g.fillCircle(cx + rH * 0.42, headCy, rH * 0.34);
    g.fillStyle(EYE_P, 1);
    g.fillCircle(cx - rH * 0.42, headCy + 1, rH * 0.16);
    g.fillCircle(cx + rH * 0.42, headCy + 1, rH * 0.16);
    g.fillStyle(BEAK, 1);
    g.fillTriangle(cx - 3, headCy + rH * 0.4, cx + 3, headCy + rH * 0.4, cx, headCy + rH * 0.9);
  } else if (view === "side") {
    g.fillStyle(EYE_W, 1);
    g.fillCircle(cx + rH * 0.32, headCy - 1, rH * 0.32);
    g.fillStyle(EYE_P, 1);
    g.fillCircle(cx + rH * 0.42, headCy - 1, rH * 0.16);
    g.fillStyle(BEAK, 1);
    g.fillTriangle(cx + rH * 0.82, headCy, cx + rH * 0.82, headCy + rH * 0.32, cx + rH * 1.25, headCy + rH * 0.12);
  }
  // back view: no face (we see the back of the head)

  // ---- cap sits on top of the head (professor only) ----
  if (kind === "professor") {
    drawCap(g, band, view, cx, headCy, rH, garment);
  }

  // ---- ear tufts drawn last so they rise ABOVE the cap; a single tuft in profile ----
  drawEars(g, kind, view, body, cx, headCy, rH);
}

function drawEars(
  g: Phaser.GameObjects.Graphics,
  kind: OwlKind,
  view: OwlView,
  body: number,
  cx: number,
  headCy: number,
  rH: number
) {
  g.fillStyle(body, 1);
  if (view === "side") {
    // profile: one tuft, swept up and back (back = left, since side faces right)
    g.fillTriangle(cx + rH * 0.2, headCy - rH * 0.72, cx - rH * 0.25, headCy - rH * 0.72, cx - rH * 0.5, headCy - rH * 1.55);
  } else if (kind === "professor") {
    // owl: two tall tufts, tips splayed further OUT than their bases (wise-owl look)
    g.fillTriangle(cx - rH * 0.15, headCy - rH * 0.7, cx - rH * 0.6, headCy - rH * 0.72, cx - rH * 1.05, headCy - rH * 1.7);
    g.fillTriangle(cx + rH * 0.15, headCy - rH * 0.7, cx + rH * 0.6, headCy - rH * 0.72, cx + rH * 1.05, headCy - rH * 1.7);
  } else {
    // owlet: two tufts angled INWARD (tips lean toward the centre)
    g.fillTriangle(cx - rH * 0.85, headCy - rH * 0.45, cx - rH * 0.05, headCy - rH * 0.35, cx - rH * 0.2, headCy - rH * 1.35);
    g.fillTriangle(cx + rH * 0.85, headCy - rH * 0.45, cx + rH * 0.05, headCy - rH * 0.35, cx + rH * 0.2, headCy - rH * 1.35);
  }
}

type BandFn = (x1: number, y1: number, x2: number, y2: number, wdt: number, color: number) => void;

function drawStole(
  g: Phaser.GameObjects.Graphics,
  band: BandFn,
  view: OwlView,
  cx: number,
  bodyW: number,
  bodyH: number,
  bodyCy: number,
  bodyBottom: number,
  stole: number
) {
  const top = bodyCy - bodyH * 0.34;
  const bot = bodyBottom - 2;
  const draw = (x1: number, y1: number, x2: number, y2: number) => {
    band(x1, y1, x2, y2, 6, GOLD); // trim shows as a gold edge
    band(x1, y1, x2, y2, 4, stole);
  };
  if (view === "front") {
    // V down the chest
    draw(cx - bodyW * 0.3, top, cx - 2, bot);
    draw(cx + bodyW * 0.3, top, cx + 2, bot);
  } else if (view === "back") {
    // two bands down the back
    draw(cx - bodyW * 0.16, top, cx - bodyW * 0.16, bot);
    draw(cx + bodyW * 0.16, top, cx + bodyW * 0.16, bot);
  } else {
    // over the near shoulder
    draw(cx + bodyW * 0.06, top, cx + bodyW * 0.2, bot);
  }
}

function drawCap(
  g: Phaser.GameObjects.Graphics,
  band: BandFn,
  view: OwlView,
  cx: number,
  headCy: number,
  rH: number,
  cap: number
) {
  const capY = headCy - rH - 1;
  g.fillStyle(cap, 1);
  // crown band on the head
  g.fillRect(cx - rH * 0.55, capY, rH * 1.1, 6);
  if (view === "side") {
    // tilted board: back (left) high, front (right) low
    g.fillTriangle(cx - rH * 0.95, capY - 1, cx + rH * 1.15, capY - 4, cx + rH * 1.15, capY);
    g.fillTriangle(cx - rH * 0.95, capY - 1, cx - rH * 0.95, capY + 3, cx + rH * 1.15, capY);
    // tassel trails to the back
    band(cx - rH * 0.9, capY - 1, cx - rH * 1.1, capY + 7, 1.5, GOLD);
    g.fillStyle(GOLD, 1);
    g.fillCircle(cx - rH * 1.1, capY + 8, 2);
  } else {
    // flat board on top
    g.fillRect(cx - rH * 1.15, capY - 3, rH * 2.3, 3);
    g.fillStyle(GOLD, 1);
    g.fillCircle(cx, capY - 1, 1.6); // button
    if (view === "front") {
      band(cx + rH * 0.9, capY - 1, cx + rH * 1.12, capY + 7, 1.5, GOLD);
      g.fillCircle(cx + rH * 1.12, capY + 8, 2);
    } else {
      // back: tassel hangs down the centre
      band(cx, capY - 1, cx, capY + 8, 1.5, GOLD);
      g.fillCircle(cx, capY + 9, 2);
    }
  }
}

function drawPack(
  g: Phaser.GameObjects.Graphics,
  band: BandFn,
  view: OwlView,
  cx: number,
  bodyW: number,
  bodyH: number,
  bodyCy: number,
  bodyBottom: number,
  pack: number,
  packDk: number
) {
  if (view === "back") {
    // full pack on the visible back (no shoulder straps — the pack shape reads on its own)
    const pw = bodyW * 0.72;
    const ph = bodyH * 0.95;
    const px = cx - pw / 2;
    const py = bodyCy - ph * 0.42;
    g.fillStyle(packDk, 1);
    g.fillRoundedRect(px, py, pw, ph, 4);
    g.fillStyle(pack, 1);
    g.fillRoundedRect(px + 2, py + 2, pw - 4, ph - 4, 3);
    // flap + buckle
    g.fillStyle(packDk, 1);
    g.fillRoundedRect(cx - pw * 0.34, bodyCy - ph * 0.08, pw * 0.68, ph * 0.3, 2);
    g.fillStyle(GOLD, 1);
    g.fillRect(cx - 2, bodyCy + ph * 0.06, 4, 4);
  } else if (view === "front") {
    // pack peeking at the sides only (front kept clean, no straps)
    g.fillStyle(pack, 1);
    g.fillRoundedRect(cx - bodyW * 0.52, bodyCy - bodyH * 0.2, 5, bodyH * 0.5, 2);
    g.fillRoundedRect(cx + bodyW * 0.52 - 5, bodyCy - bodyH * 0.2, 5, bodyH * 0.5, 2);
  }
  // side: the pack bulge is drawn behind the body in drawOwl — nothing to add here
}
