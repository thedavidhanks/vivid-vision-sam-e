import type { Vec, WalkwayDef } from "../data/types";
import { pointNearPolyline } from "./geometry";

// Pure, Phaser-free: decide the speed multiplier for a person at position `pos`.
// Returns `bonus` if the position sits on any speedBonus walkway (within its
// width/2 of the centerline), otherwise 1. Non-bonus walkways are ignored.
export function walkwaySpeedFactor(pos: Vec, walkways: WalkwayDef[], bonus: number): number {
  for (const w of walkways) {
    if (!w.speedBonus) continue;
    if (pointNearPolyline(pos, w.points, w.width / 2)) return bonus;
  }
  return 1;
}
