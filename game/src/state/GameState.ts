import { TUNING } from "../data/tuning";
import type { BatteryState } from "../systems/power";

// Single source of truth for run-level scalar state. Entities live in the scene;
// this holds money, power, reputation, wave and purchased upgrades.
export class GameState {
  money = 0;
  reputation = TUNING.reputation.start;
  waveIndex = 0; // 0-based index into WAVES
  supply = TUNING.power.supply; // flat factory supply; set per wave
  battery: BatteryState = { capacity: 0, charge: 0 }; // set per wave from upgrades
  upgrades = new Set<string>();

  // Derived multipliers from purchased upgrades.
  get walkwayMultiplier(): number {
    return this.upgrades.has("walkways") ? 1.25 : 1;
  }
  get costMultiplier(): number {
    return this.upgrades.has("lights") ? TUNING.power.lightCostMultiplier : 1;
  }
  get droneBonus(): number {
    return this.upgrades.has("drone") ? 1 : 0;
  }
  get batteryCapacity(): number {
    return this.upgrades.has("battery") ? TUNING.power.battery.capacity : 0;
  }

  reset() {
    this.money = 0;
    this.reputation = TUNING.reputation.start;
    this.waveIndex = 0;
    this.supply = TUNING.power.supply;
    this.battery = { capacity: 0, charge: 0 };
    this.upgrades.clear();
  }
}

// One shared instance for the session.
export const gameState = new GameState();
