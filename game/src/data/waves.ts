import type { WaveDef } from "./types";

// Difficulty escalates via the four knobs from the design:
// people ↑, power ↓, (more required buildings come from campus), obstructions ↑.
export const WAVES: WaveDef[] = [
  {
    id: 1,
    people: 6,
    spawnInterval: 3.2,
    professorRatio: 0.4,
    gridRate: 7,
    capacity: 60,
    startReserve: 55,
    leakInterval: 0, // gentle: no leaks in wave 1
  },
  {
    id: 2,
    people: 9,
    spawnInterval: 2.6,
    professorRatio: 0.45,
    gridRate: 7,
    capacity: 60,
    startReserve: 48,
    leakInterval: 14,
  },
  {
    id: 3,
    people: 12,
    spawnInterval: 2.1,
    professorRatio: 0.5,
    gridRate: 6,
    capacity: 55,
    startReserve: 40,
    leakInterval: 9,
  },
];
