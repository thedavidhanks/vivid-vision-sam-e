// ============================================================================
// TUNING DIALS — the game's central balance knobs.
//
// Everything the game "feels like" is a number in this file. Tweak here,
// playtest, then generate production files. All gameplay math reads from
// TUNING so balancing stays data, not code. Per-level pacing lives in
// ./waves.ts; this file holds the global defaults.
// ============================================================================
export const TUNING = {
  board: { width: 960, height: 600 },

  // ---- DEFAULT SPEEDS (px/sec) ---------------------------------------------
  speed: {
    owl: 95, // professors (owl + grad cap)
    owlet: 110, // students (owlet + backpack) — a touch quicker by default
    drone: 175, // repair-drone flight speed
  },

  // ---- WATER LEAKS ---------------------------------------------------------
  water: {
    reductionTime: 3, // seconds a drone must hover to fully repair (reduce) a leak
    radius: 36, // leak footprint that blocks any path crossing it
  },

  // ---- POWER ---------------------------------------------------------------
  // A "factory" supplies a flat amount of power each wave; each ON building
  // consumes a flat cost by size. Load must stay within supply (turning a
  // building ON is blocked otherwise) unless a battery is owned to cover it.
  power: {
    supply: 50, // base factory supply (flat); a wave sets its own (see waves.ts)
    cost: { small: 10, medium: 20, large: 30 }, // flat cost per ON building
    brownoutRepDrain: 10, // reputation/sec lost while browned out

    // Battery upgrade: stores surplus power and lets you run over supply until
    // it drains (capacity 0 = not owned).
    battery: {
      capacity: 40, // stored-energy cap once the battery upgrade is owned
      chargeRate: 8, // max units/sec gained (scaled by surplus fraction)
    },

    gridSupplyBonus: 15, // "grid" upgrade: +supply
    lightCostMultiplier: 0.75, // "lights" upgrade: building costs ×0.75
  },

  // ---- REPUTATION ----------------------------------------------------------
  reputation: {
    start: 100, // starting reputation
    studentLeavePenalty: 20, // rep lost each time a person rage-quits (leaves)
  },

  // ---- PEOPLE --------------------------------------------------------------
  person: {
    patience: 18, // seconds of patience while stuck/waiting before leaving
    radius: 15,
  },

  // ---- ECONOMY -------------------------------------------------------------
  economy: {
    pay: { professor: 30, student: 18 } as Record<string, number>,
    deliveryRepRefund: 2, // rep regained per successful delivery
    repairReward: 5, // money earned each time a drone fully clears a leak
  },

  // ---- DRAWING (input feel) ------------------------------------------------
  draw: {
    minPointDist: 9, // px between captured polyline points
    commitSnapDist: 55, // how close to a target the release must land
  },
};
