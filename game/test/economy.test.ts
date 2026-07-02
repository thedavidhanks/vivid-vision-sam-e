import { describe, it, expect } from "vitest";
import {
  payForDelivery,
  canAfford,
  satisfactionMultiplier,
  payForSatisfiedDelivery,
} from "../src/systems/economy";
import { TUNING } from "../src/data/tuning";

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

describe("satisfaction payout", () => {
  const { minMultiplier, maxMultiplier } = TUNING.economy.satisfaction;

  it("full satisfaction pays the max multiplier", () => {
    expect(satisfactionMultiplier(1)).toBe(maxMultiplier);
  });

  it("zero satisfaction pays the min multiplier", () => {
    expect(satisfactionMultiplier(0)).toBe(minMultiplier);
  });

  it("interpolates linearly between min and max", () => {
    expect(satisfactionMultiplier(0.5)).toBeCloseTo((minMultiplier + maxMultiplier) / 2);
  });

  it("clamps out-of-range satisfaction", () => {
    expect(satisfactionMultiplier(-1)).toBe(minMultiplier);
    expect(satisfactionMultiplier(2)).toBe(maxMultiplier);
  });

  it("a happier owl always earns at least as much as a grumpier one", () => {
    const grumpy = payForSatisfiedDelivery("professor", 0.2);
    const happy = payForSatisfiedDelivery("professor", 0.9);
    expect(happy).toBeGreaterThan(grumpy);
  });

  it("scales the base rate and rounds to a whole dollar", () => {
    expect(payForSatisfiedDelivery("professor", 1)).toBe(Math.round(30 * maxMultiplier));
    expect(payForSatisfiedDelivery("student", 0)).toBe(Math.round(18 * minMultiplier));
  });
});
