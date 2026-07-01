import { TUNING } from "../data/tuning";
import type { PowerState } from "../systems/power";

// Single source of truth for run-level scalar state. Entities live in the scene;
// this holds money, power, reputation, wave and purchased upgrades.
export class GameState {
  money = 0;
  reputation = TUNING.reputation.start;
  waveIndex = 0; // 0-based index into WAVES
  power: PowerState = { reserve: 0, capacity: 0, gridRate: 0, solarRate: 0 };
  upgrades = new Set<string>();

  // Derived multipliers from purchased upgrades.
  get walkwayMultiplier(): number {
    return this.upgrades.has("walkways") ? 1.25 : 1;
  }
  get lightDrawMultiplier(): number {
    return this.upgrades.has("lights") ? 0.75 : 1;
  }
  get droneBonus(): number {
    return this.upgrades.has("drone") ? 1 : 0;
  }

  reset() {
    this.money = 0;
    this.reputation = TUNING.reputation.start;
    this.waveIndex = 0;
    this.power = { reserve: 0, capacity: 0, gridRate: 0, solarRate: 0 };
    this.upgrades.clear();
  }
}

// One shared instance for the session.
export const gameState = new GameState();
