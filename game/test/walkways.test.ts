import { describe, expect, it } from "vitest";
import { walkwaySpeedFactor } from "../src/systems/walkways";
import type { WalkwayDef } from "../src/data/types";

const BONUS = 1.25;

describe("walkwaySpeedFactor", () => {
  const bonusWalk: WalkwayDef = {
    id: "spine",
    width: 20, // halfWidth = 10
    speedBonus: true,
    points: [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ],
  };
  const plainWalk: WalkwayDef = {
    id: "plain",
    width: 20,
    // no speedBonus
    points: [
      { x: 0, y: 200 },
      { x: 100, y: 200 },
    ],
  };

  it("returns the bonus while on a speedBonus walkway", () => {
    expect(walkwaySpeedFactor({ x: 50, y: 55 }, [bonusWalk], BONUS)).toBe(BONUS);
  });

  it("returns 1 when off every walkway", () => {
    expect(walkwaySpeedFactor({ x: 50, y: 90 }, [bonusWalk], BONUS)).toBe(1);
  });

  it("ignores non-bonus walkways", () => {
    expect(walkwaySpeedFactor({ x: 50, y: 200 }, [plainWalk], BONUS)).toBe(1);
  });

  it("returns 1 when there are no walkways", () => {
    expect(walkwaySpeedFactor({ x: 50, y: 50 }, [], BONUS)).toBe(1);
  });
});
