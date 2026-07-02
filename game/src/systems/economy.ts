import { TUNING } from "../data/tuning";
import type { PersonKind } from "../data/types";

// Pure economy helpers — unit-testable without Phaser.

export function payForDelivery(kind: PersonKind): number {
  return TUNING.economy.pay[kind] ?? 0;
}

// Maps an owl's satisfaction (0..1 remaining-patience fraction at arrival) onto
// a payout multiplier between the tuned min and max. Full satisfaction earns the
// top rate; an owl that nearly rage-quit earns the floor.
export function satisfactionMultiplier(satisfaction: number): number {
  const { minMultiplier, maxMultiplier } = TUNING.economy.satisfaction;
  const s = Math.max(0, Math.min(1, satisfaction));
  return minMultiplier + (maxMultiplier - minMultiplier) * s;
}

// Actual money paid for a delivery: base rate scaled by satisfaction, rounded.
export function payForSatisfiedDelivery(kind: PersonKind, satisfaction: number): number {
  return Math.round(payForDelivery(kind) * satisfactionMultiplier(satisfaction));
}

export function payForRepair(): number {
  return TUNING.economy.repairReward;
}

export function canAfford(money: number, cost: number): boolean {
  return money >= cost;
}
