import type { UpgradeDef } from "./types";

// Shop catalog. Items reveal as waves progress (unlockWave) to keep early play simple.
export const UPGRADES: UpgradeDef[] = [
  {
    id: "grid",
    name: "Bigger Factory",
    cost: 60,
    unlockWave: 1,
    description: "+15 power supply.",
  },
  {
    id: "battery",
    name: "Battery Bank",
    cost: 80,
    unlockWave: 1,
    description: "Store surplus power; run over supply until it drains.",
  },
  {
    id: "lights",
    name: "Efficient Lights",
    cost: 70,
    unlockWave: 2,
    description: "Buildings cost 25% less power.",
  },
  {
    id: "walkways",
    name: "Faster Walkways",
    cost: 80,
    unlockWave: 2,
    description: "+25% walking speed for everyone.",
  },
  {
    id: "drone",
    name: "Extra Drone",
    cost: 90,
    unlockWave: 2,
    description: "Adds another drone for parallel repairs.",
  },
];
