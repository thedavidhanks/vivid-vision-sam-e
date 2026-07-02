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
];
