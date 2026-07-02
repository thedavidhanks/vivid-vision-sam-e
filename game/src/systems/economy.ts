import { TUNING } from "../data/tuning";
import type { PersonKind } from "../data/types";

// Pure economy helpers — unit-testable without Phaser.

export function payForDelivery(kind: PersonKind): number {
  return TUNING.economy.pay[kind] ?? 0;
}

export function payForRepair(): number {
  return TUNING.economy.repairReward;
}

export function canAfford(money: number, cost: number): boolean {
  return money >= cost;
}
