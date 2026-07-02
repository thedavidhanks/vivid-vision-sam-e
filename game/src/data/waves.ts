import type { WaveDef } from "./types";

// ============================================================================
// PER-LEVEL CONFIGURATION — one entry per wave.
//
// Difficulty escalates via the design knobs: people ↑, denser spawns, more/
// bigger active buildings vs. a flat power supply, obstructions ↑. Global
// defaults live on the dials board (./tuning.ts); a wave lists its own values.
//
//   people          total people to spawn this wave
//   spawnInterval   seconds between spawns (lower = denser)
//   professorRatio  0..1 chance a spawn is a professor (owl)
//   supply          flat factory power available this wave
//   buildings       which campus buildings are active + their size
//                   (size sets the flat cost: small 10 / medium 20 / large 30)
//   leakInterval    seconds between water leaks (0 = none)
// ============================================================================
export const WAVES: WaveDef[] = [
  {
    id: 1,
    people: 6,
    spawnInterval: 3.2,
    professorRatio: 0.4,
    supply: 60,
    // 6 × small = 60 == supply: power everything, no need to conserve.
    buildings: [
      { id: "fondren", size: "small" },
      { id: "herzstein", size: "small" },
      { id: "sewall", size: "small" },
      { id: "lovett", size: "small" },
      { id: "rayzor", size: "small" },
      { id: "anderson", size: "small" },
    ],
    leakInterval: 0, // gentle: no leaks in wave 1
  },
  {
    id: 2,
    people: 9,
    spawnInterval: 2.6,
    professorRatio: 0.45,
    supply: 50,
    // 20 + 5×10 = 70 > 50: must occasionally switch a building off.
    buildings: [
      { id: "fondren", size: "medium" },
      { id: "herzstein", size: "small" },
      { id: "sewall", size: "small" },
      { id: "lovett", size: "small" },
      { id: "rayzor", size: "small" },
      { id: "anderson", size: "small" },
    ],
    leakInterval: 14,
  },
  {
    id: 3,
    people: 12,
    spawnInterval: 2.1,
    professorRatio: 0.5,
    supply: 50,
    // 30 + 20 + 20 + 3×10 = 100 vs 50: heavy juggling; battery rewarded.
    buildings: [
      { id: "fondren", size: "large" },
      { id: "herzstein", size: "medium" },
      { id: "lovett", size: "medium" },
      { id: "sewall", size: "small" },
      { id: "rayzor", size: "small" },
      { id: "anderson", size: "small" },
    ],
    leakInterval: 9,
  },
  {
    id: 4,
    people: 14,
    spawnInterval: 1.9,
    professorRatio: 0.5,
    supply: 55,
    // 30 + 20 + 20 + 3×10 = 100 vs 55: sustained juggling under denser arrivals.
    buildings: [
      { id: "fondren", size: "large" },
      { id: "herzstein", size: "medium" },
      { id: "lovett", size: "medium" },
      { id: "anderson", size: "small" },
      { id: "rayzor", size: "small" },
      { id: "sewall", size: "small" },
    ],
    leakInterval: 8,
  },
  {
    id: 5,
    people: 16,
    spawnInterval: 1.7,
    professorRatio: 0.55,
    supply: 55,
    // 30 + 30 + 20 + 20 + 2×10 = 120 vs 55: two large loads to trade off.
    buildings: [
      { id: "fondren", size: "large" },
      { id: "herzstein", size: "large" },
      { id: "lovett", size: "medium" },
      { id: "anderson", size: "medium" },
      { id: "rayzor", size: "small" },
      { id: "sewall", size: "small" },
    ],
    leakInterval: 7,
  },
  {
    id: 6,
    people: 18,
    spawnInterval: 1.5,
    professorRatio: 0.55,
    supply: 60,
    // 3×30 + 2×20 + 10 = 140 vs 60: constant rotation; lights/battery shine.
    buildings: [
      { id: "fondren", size: "large" },
      { id: "herzstein", size: "large" },
      { id: "lovett", size: "large" },
      { id: "anderson", size: "medium" },
      { id: "rayzor", size: "medium" },
      { id: "sewall", size: "small" },
    ],
    leakInterval: 6,
  },
  {
    id: 7,
    people: 20,
    spawnInterval: 1.4,
    professorRatio: 0.6,
    supply: 60,
    // 4×30 + 2×20 = 160 vs 60: only a third can run at once; frantic leaks.
    buildings: [
      { id: "fondren", size: "large" },
      { id: "herzstein", size: "large" },
      { id: "lovett", size: "large" },
      { id: "anderson", size: "large" },
      { id: "rayzor", size: "medium" },
      { id: "sewall", size: "medium" },
    ],
    leakInterval: 5,
  },
  {
    id: 8,
    people: 24,
    spawnInterval: 1.3,
    professorRatio: 0.6,
    supply: 65,
    // 6×30 = 180 vs 65: everything is large — the finale power crunch.
    buildings: [
      { id: "fondren", size: "large" },
      { id: "herzstein", size: "large" },
      { id: "lovett", size: "large" },
      { id: "anderson", size: "large" },
      { id: "rayzor", size: "large" },
      { id: "sewall", size: "large" },
    ],
    leakInterval: 5,
  },
];
