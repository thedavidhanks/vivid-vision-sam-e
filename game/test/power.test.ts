import { describe, it, expect } from "vitest";
import {
  computeLoad,
  costForSize,
  canPowerOn,
  stepBattery,
  type BatteryState,
} from "../src/systems/power";

describe("computeLoad", () => {
  it("sums building costs", () => {
    expect(computeLoad([10, 20, 10])).toBe(40);
  });
  it("is 0 when nothing is on", () => {
    expect(computeLoad([])).toBe(0);
  });
});

describe("costForSize", () => {
  it("returns the flat tier cost", () => {
    expect(costForSize("small", 1)).toBe(10);
    expect(costForSize("medium", 1)).toBe(20);
    expect(costForSize("large", 1)).toBe(30);
  });
  it("applies the cost multiplier", () => {
    expect(costForSize("medium", 0.75)).toBe(15);
  });
});

describe("canPowerOn", () => {
  it("allows when it fits under supply", () => {
    expect(canPowerOn(40, 10, 50, 0)).toBe(true);
  });
  it("blocks when it would exceed supply with no battery", () => {
    expect(canPowerOn(50, 10, 50, 0)).toBe(false);
  });
  it("allows over supply when a battery has charge", () => {
    expect(canPowerOn(50, 10, 50, 5)).toBe(true);
  });
});

describe("stepBattery", () => {
  const bat = (over: Partial<BatteryState> = {}): BatteryState => ({
    capacity: 40,
    charge: 0,
    ...over,
  });

  it("charges from surplus, scaled by surplus fraction", () => {
    // available 25 of supply 50 -> frac 0.5 -> 8 * 0.5 * 1 = 4
    const r = stepBattery(bat(), 25, 50, 8, 1);
    expect(r.charge).toBeCloseTo(4, 5);
    expect(r.brownout).toBe(false);
  });

  it("clamps charge to capacity", () => {
    const r = stepBattery(bat({ charge: 39 }), 0, 50, 8, 5);
    expect(r.charge).toBe(40);
  });

  it("drains at the deficit rate and browns out when empty", () => {
    // deficit 10, charge 10 -> hits 0 -> brownout
    const r = stepBattery(bat({ charge: 10 }), 60, 50, 8, 1);
    expect(r.charge).toBe(0);
    expect(r.brownout).toBe(true);
  });

  it("drains without brownout while charge remains", () => {
    const r = stepBattery(bat({ charge: 30 }), 60, 50, 8, 1);
    expect(r.charge).toBeCloseTo(20, 5);
    expect(r.brownout).toBe(false);
  });

  it("browns out on overload with no battery", () => {
    const r = stepBattery(bat({ capacity: 0, charge: 0 }), 60, 50, 8, 1);
    expect(r.charge).toBe(0);
    expect(r.brownout).toBe(true);
  });
});
