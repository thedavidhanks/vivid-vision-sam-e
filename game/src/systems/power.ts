// Pure power-simulation math — no Phaser, fully unit-testable.

export interface PowerState {
  reserve: number;
  capacity: number;
  gridRate: number; // kWh/sec from the grid
  solarRate: number; // kWh/sec from solar (0 until purchased)
}

export interface PowerStep {
  reserve: number;
  brownout: boolean;
}

/**
 * Advance the reserve by one timestep.
 * @param power   current power state
 * @param drawRate total kWh/sec drawn by all ON buildings
 * @param dt      seconds elapsed
 */
export function stepPower(power: PowerState, drawRate: number, dt: number): PowerStep {
  const net = power.gridRate + power.solarRate - drawRate;
  let reserve = power.reserve + net * dt;
  reserve = Math.max(0, Math.min(power.capacity, reserve));
  // Browned out when we've run the reserve dry AND demand still outstrips supply.
  const brownout = reserve <= 0 && drawRate > power.gridRate + power.solarRate;
  return { reserve, brownout };
}
