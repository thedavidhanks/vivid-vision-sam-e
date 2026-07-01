import type { UpgradeDef } from "./types";

// Shop catalog. Items reveal as waves progress (unlockWave) to keep early play simple.
export const UPGRADES: UpgradeDef[] = [
  {
    id: "grid",
    name: "More kWh from Grid",
    cost: 60,
    unlockWave: 1,
    description: "+2 kWh/sec supply and +15 reserve capacity.",
  },
  {
    id: "lights",
    name: "Better Lights",
    cost: 70,
    unlockWave: 2,
    description: "Powered buildings draw 25% less kWh.",
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
