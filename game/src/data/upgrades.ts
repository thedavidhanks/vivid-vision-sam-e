import type { UpgradeDef } from "./types";

// Shop catalog. Items reveal one at a time as waves progress (unlockWave), and
// each is priced near a single wave's realistic take-home. Because money carries
// over, a typical wave affords exactly ONE upgrade; only a near-perfect wave
// (happy owls, few rage-quits, no brownouts) plus saved cash lets you grab two.
// Prices assume deliveries pay ≈ base × the satisfaction max (see tuning.ts) and
// climb with the unlock wave to track rising per-wave earnings.
export const UPGRADES: UpgradeDef[] = [
  {
    id: "grid",
    name: "Bigger Factory",
    cost: 160,
    unlockWave: 1,
    description: "+15 power supply.",
  },
  {
    id: "battery",
    name: "Battery Bank",
    cost: 220,
    unlockWave: 1,
    description: "Store surplus power; run over supply until it drains.",
  },
  {
    id: "lights",
    name: "Efficient Lights",
    cost: 320,
    unlockWave: 2,
    description: "Buildings cost 25% less power.",
  },
  {
    id: "walkways",
    name: "Faster Walkways",
    cost: 440,
    unlockWave: 3,
    description: "+25% walking speed for everyone.",
  },
  {
    id: "drone",
    name: "Extra Drone",
    cost: 560,
    unlockWave: 4,
    description: "Adds another drone for parallel repairs.",
  },
];
