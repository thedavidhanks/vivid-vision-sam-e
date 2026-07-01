import { describe, it, expect } from "vitest";
import { payForDelivery, canAfford } from "../src/systems/economy";

describe("economy", () => {
  it("pays more for professors than students", () => {
    expect(payForDelivery("professor")).toBeGreaterThan(payForDelivery("student"));
  });

  it("professor / student payouts are positive", () => {
    expect(payForDelivery("professor")).toBe(30);
    expect(payForDelivery("student")).toBe(18);
  });

  it("canAfford is inclusive of exact cost", () => {
    expect(canAfford(60, 60)).toBe(true);
    expect(canAfford(59, 60)).toBe(false);
    expect(canAfford(100, 60)).toBe(true);
  });
});
