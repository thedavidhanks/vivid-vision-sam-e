import { describe, it, expect } from "vitest";
import { stepPower, type PowerState } from "../src/systems/power";

const base = (over: Partial<PowerState> = {}): PowerState => ({
  reserve: 50,
  capacity: 60,
  gridRate: 6,
  solarRate: 0,
  ...over,
});

describe("stepPower", () => {
  it("drains when draw exceeds supply", () => {
    const r = stepPower(base(), 10, 1); // net -4/s
    expect(r.reserve).toBeCloseTo(46, 5);
    expect(r.brownout).toBe(false);
  });

  it("charges when supply exceeds draw", () => {
    const r = stepPower(base({ reserve: 40 }), 2, 1); // net +4/s
    expect(r.reserve).toBeCloseTo(44, 5);
  });

  it("clamps to capacity", () => {
    const r = stepPower(base({ reserve: 59 }), 0, 5); // would overshoot
    expect(r.reserve).toBe(60);
  });

  it("clamps to zero and flags brownout under demand", () => {
    const r = stepPower(base({ reserve: 1 }), 20, 1); // net -14/s, floors at 0
    expect(r.reserve).toBe(0);
    expect(r.brownout).toBe(true);
  });

  it("no brownout at zero when demand is within supply", () => {
    const r = stepPower(base({ reserve: 0 }), 3, 1); // draw 3 < grid 6
    expect(r.brownout).toBe(false);
    expect(r.reserve).toBeCloseTo(3, 5);
  });

  it("solar adds to supply", () => {
    const r = stepPower(base({ reserve: 30, solarRate: 5 }), 6, 1); // net +5/s
    expect(r.reserve).toBeCloseTo(35, 5);
  });
});
