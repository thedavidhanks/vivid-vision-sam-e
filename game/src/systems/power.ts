// Pure power-simulation math — no Phaser, fully unit-testable.

import { TUNING } from "../data/tuning";
import type { BuildingSize } from "../data/types";

export interface BatteryState {
  capacity: number; // stored-energy cap; 0 when no battery upgrade owned
  charge: number; // current stored energy, 0..capacity
}

export interface BatteryStep {
  charge: number;
  brownout: boolean;
}

/** Sum of the flat costs of all ON buildings. */
export function computeLoad(costs: number[]): number {
  let sum = 0;
  for (const c of costs) sum += c;
  return sum;
}

/** Flat power cost for a size tier, after any cost multiplier (e.g. lights). */
export function costForSize(size: BuildingSize, mult: number): number {
  return TUNING.power.cost[size] * mult;
}

/**
 * May the player turn ON a building of `cost` right now?
 * True when it still fits under supply, OR a battery has charge to cover it.
 */
export function canPowerOn(
  load: number,
  cost: number,
  supply: number,
  batteryCharge: number
): boolean {
  if (load + cost <= supply) return true;
  return batteryCharge > 0;
}

/**
 * Advance the battery one timestep against the current instantaneous load.
 *   available = supply - load
 *   available >= 0 -> surplus charges the battery (scaled by surplus fraction)
 *   available <  0 -> battery drains at rate = deficit (load - supply);
 *                     browns out when it empties while still overloaded.
 * With no battery (capacity 0) the drain path still flags brownout, but callers
 * block over-supply toggles so load never exceeds supply in the base model.
 */
export function stepBattery(
  battery: BatteryState,
  load: number,
  supply: number,
  chargeRate: number,
  dt: number
): BatteryStep {
  const available = supply - load;
  let charge = battery.charge;
  let brownout = false;

  if (available >= 0) {
    const surplusFrac = supply > 0 ? Math.min(1, available / supply) : 0;
    charge = Math.min(battery.capacity, charge + chargeRate * surplusFrac * dt);
  } else {
    const deficit = -available; // load - supply
    charge = charge - deficit * dt;
    if (charge <= 0) {
      charge = 0;
      brownout = true;
    }
  }
  return { charge, brownout };
}
