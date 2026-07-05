import type { CampusDef } from "./types";

// A small, readable slice of a Rice-flavored campus. Doorway boxes sit on the
// walkway side of each building; an owl must be steered into one to arrive.
// Buildings are pure geometry — each wave decides which are active and their
// size (which sets the flat power cost); see waves.ts.
const DOOR_W = 48;
const DOOR_H = 20;

// Original first-demo campus. Preserved for reference; no longer played — the
// active map (below) mirrors Rice's Academic Quad.
export const CAMPUS_ORIGINAL: CampusDef = {
  width: 960,
  height: 600,
  buildings: [
    {
      id: "fondren",
      name: "Fondren Library",
      x: 780, y: 150, w: 150, h: 92,
      doors: [{ x: 780, y: 205, w: DOOR_W, h: DOOR_H }],
    },
    {
      id: "herzstein",
      name: "Herzstein Hall",
      x: 190, y: 150, w: 140, h: 92,
      doors: [{ x: 190, y: 205, w: DOOR_W, h: DOOR_H }],
    },
    {
      id: "chapel",
      name: "Rice Chapel",
      x: 480, y: 315, w: 130, h: 92,
      // Two entrances: south face and west face.
      doors: [
        { x: 480, y: 370, w: DOOR_W, h: DOOR_H },
        { x: 405, y: 315, w: DOOR_H, h: DOOR_W },
      ],
    },
    {
      id: "duncan",
      name: "Duncan Hall",
      x: 780, y: 470, w: 150, h: 92,
      doors: [{ x: 780, y: 415, w: DOOR_W, h: DOOR_H }],
    },
    {
      id: "brochstein",
      name: "Brochstein Pavilion",
      x: 190, y: 470, w: 140, h: 92,
      doors: [{ x: 190, y: 415, w: DOOR_W, h: DOOR_H }],
    },
  ],
  spawns: [
    { id: "west", x: 42, y: 315 },
    { id: "north", x: 480, y: 96 },
    { id: "east", x: 918, y: 315 },
  ],
  walkways: [],
  dock: { x: 60, y: 540 },
};

// Rice's Academic Quad. Buildings ring an open central quad: Anderson &
// Herzstein along the north edge, Rayzor & Sewall along the south, Fondren
// lining the west and Lovett the east. Doors face inward. Blue paths in the
// source become paved walkways that grant a walking-speed bonus.
//
// Traced 1:1 from resources/Rice-Quad_v3.svg (draw.io, 960×600). draw.io stores
// a shape's top-left corner + size; the game uses the CENTER, so each rect below
// is (topLeft + size/2). Doors 40×20 (vertical faces 20×40).
//
// The HUD is a bar across the top HUD_H px of the canvas. To keep it from
// overlapping the map, the whole campus is compressed into the band below it:
// every SVG-space y is mapped through ty() and every vertical size scaled by SY.
const HUD_H = 48;
const SY = (600 - HUD_H) / 600;
const ty = (y: number) => HUD_H + y * SY; // SVG-space y → play-area y

export const CAMPUS: CampusDef = {
  width: 960,
  height: 600,
  buildings: [
    {
      id: "anderson",
      name: "Anderson Hall",
      // North edge, west half. SVG rect (120,0,310,60).
      x: 275, y: ty(30), w: 310, h: 60 * SY,
      color: 0xe23b3b, // red
      doors: [{ x: 400, y: ty(60), w: 40, h: 20 * SY }], // south face onto the quad
    },
    {
      id: "herzstein",
      name: "Herzstein Hall",
      // North edge, east half. SVG rect (570,0,310,60).
      x: 725, y: ty(30), w: 310, h: 60 * SY,
      color: 0x2f6df6, // blue
      doors: [{ x: 600, y: ty(60), w: 40, h: 20 * SY }], // south face
    },
    {
      id: "fondren",
      name: "Fondren Library",
      // West edge, full height. SVG rect (0,80,50,480). Label reads up toward
      // the quad (top of text points right, toward center).
      x: 25, y: ty(320), w: 50, h: 480 * SY,
      labelAngle: 90,
      color: 0x1fbf4f, // green
      doors: [{ x: 50, y: ty(300), w: 20, h: 40 * SY }], // east face onto the quad
    },
    {
      id: "lovett",
      name: "Lovett Hall",
      // East edge, full height. SVG rect (910,80,50,480). Label top points left,
      // toward center. Three west-face doors: center, plus one each to accept the
      // Herzstein (north) and Sewall (south) approach paths.
      x: 935, y: ty(320), w: 50, h: 480 * SY,
      labelAngle: -90,
      color: 0x9b4dff, // purple
      doors: [
        { x: 910, y: ty(300), w: 20, h: 40 * SY }, // center
        { x: 910, y: ty(100), w: 20, h: 40 * SY }, // north — Herzstein path
        { x: 910, y: ty(510), w: 20, h: 40 * SY }, // south — Sewall path
      ],
    },
    {
      id: "rayzor",
      name: "Rayzor Hall",
      // South edge, west half. SVG rect (190,540,240,60).
      x: 310, y: ty(570), w: 240, h: 60 * SY,
      color: 0xff8c1a, // orange
      doors: [{ x: 400, y: ty(540), w: 40, h: 20 * SY }], // north face
    },
    {
      id: "sewall",
      name: "Sewall Hall",
      // South edge, east half. SVG rect (570,540,270,60).
      x: 705, y: ty(570), w: 270, h: 60 * SY,
      color: 0x14c4c4, // teal
      doors: [{ x: 600, y: ty(540), w: 40, h: 20 * SY }], // north face
    },
  ],
  // Hidden spawn markers from the SVG (green "Spawn" shapes). People also spawn
  // at building doors — see GameScene. None of these are drawn.
  spawns: [
    // North spawns sit below the HUD bar (y=0..53). A professor owl sprite is
    // 48×60 with a centered origin, so its center must be ≥ ~83 to keep the top
    // of the sprite clear of the HUD; ty(42) ≈ 87 leaves a small margin. Without
    // this, owls entering at the top edge appear half-hidden behind the HUD and
    // are hard to spot.
    { id: "n-left", x: 80, y: ty(42) },
    { id: "n-mid-left", x: 460, y: ty(42) },
    { id: "n-mid-right", x: 540, y: ty(42) },
    { id: "s-left", x: 80, y: ty(590) },
    { id: "s-mid-left", x: 460, y: ty(590) },
    { id: "s-mid-right", x: 540, y: ty(590) },
    { id: "s-right", x: 880, y: ty(589) },
  ],
  // Blue "path" edges from the SVG; all grant a walking-speed bonus. The two
  // north/south walks span the full play-area height (ty(0)=HUD_H .. ty(600)=600).
  walkways: [
    {
      id: "quad-spine",
      label: "Fondren–Lovett Walk",
      width: 24,
      speedBonus: true,
      points: [{ x: 50, y: ty(300) }, { x: 910, y: ty(300) }],
    },
    {
      id: "quad-left",
      label: "West Cross Walk",
      width: 24,
      speedBonus: true,
      points: [{ x: 460, y: ty(0) }, { x: 460, y: ty(600) }],
    },
    {
      id: "quad-right",
      label: "East Cross Walk",
      width: 24,
      speedBonus: true,
      points: [{ x: 540, y: ty(0) }, { x: 540, y: ty(600) }],
    },
    {
      id: "herzstein-approach",
      label: "Herzstein → Lovett",
      width: 22,
      speedBonus: true,
      points: [{ x: 600, y: ty(70) }, { x: 600, y: ty(100) }, { x: 910, y: ty(100) }],
    },
    {
      id: "sewall-approach",
      label: "Sewall → Lovett",
      width: 22,
      speedBonus: true,
      points: [{ x: 910, y: ty(510) }, { x: 600, y: ty(510) }, { x: 600, y: ty(540) }],
    },
  ],
  // Drone docking station in the SW pocket between Fondren (west edge) and Rayzor
  // (south edge). Drones start here and auto-return once their repair is done.
  dock: { x: 110, y: ty(575) },
};
