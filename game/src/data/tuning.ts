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
    owl: 80, // professors (owl + grad cap) — slower, more deliberate pace
    owlet: 110, // students (owlet + backpack) — noticeably quicker than professors
    drone: 175, // repair-drone flight speed
  },

  // ---- WALKWAYS ------------------------------------------------------------
  // Paved quad paths. A person whose position is on a speedBonus walkway moves
  // faster by this multiplier (stacks with the "walkway" upgrade). 1 = no bonus.
  walkway: {
    speedBonus: 1.25,
  },

  // ---- WATER LEAKS ---------------------------------------------------------
  water: {
    reductionTime: 3, // seconds a drone must hover to fully repair (reduce) a leak
    radius: 36, // leak footprint (visual + slowdown zone)
    waterHazardWalkingFactor: 0.5, // owls walk at this fraction of their adjusted speed while inside a leak
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
    walkFrameRate: 7, // fps of the 2-frame walk cycle while moving
  },

  // ---- ECONOMY -------------------------------------------------------------
  economy: {
    // Base delivery rate per person kind. The amount actually paid scales with
    // how SATISFIED the owl is on arrival (its remaining-patience fraction),
    // via satisfaction.min..max below. A happy owl that walked straight in
    // (satisfaction 1) pays base × max; one that sat stuck at a door (low
    // patience) pays base × min. Costs in upgrades.ts assume near-max play.
    pay: { professor: 30, student: 18 } as Record<string, number>,
    satisfaction: {
      minMultiplier: 0.5, // payout at 0 satisfaction (barely-in-time arrival)
      maxMultiplier: 1.5, // payout at full satisfaction (walked right in)
    },
    deliveryRepRefund: 2, // rep regained per successful delivery
    repairReward: 5, // money earned each time a drone fully clears a leak
  },

  // ---- DRAWING (input feel) ------------------------------------------------
  draw: {
    minPointDist: 9, // px between captured polyline points
    commitSnapDist: 55, // how close to a target the release must land
  },

  // ---- FX (feedback for spending power) ------------------------------------
  // Purely visual; sells "powering a building draws from the shared factory."
  fx: {
    // Screen anchor the power bolt springs from — sits under the centered HUD
    // power bar (bar at x=400,y=8,w=180). GameScene & HUD share screen coords.
    powerSource: { x: 490, y: 26 },
    // Lightning bolt fired when a building is powered ON.
    zap: {
      color: 0x7dd3fc, // electric blue
      alpha: 0.8, // peak opacity of the bolt
      durationMs: 600, // total lifespan across all flickers
      flickers: 4, // how many times the bolt strobes on/off
      segments: 6, // number of jagged kinks along the bolt
      jitter: 14, // px max perpendicular offset per kink
      width: 2.5, // stroke width
    },
    // Pulsing "consumption" glow behind a powered building. Bigger/costlier
    // buildings glow larger and pulse faster (hungrier).
    aura: {
      color: 0xfbbf24, // amber
      baseAlpha: 0.12,
      peakAlpha: 0.38,
      pad: { small: 8, medium: 12, large: 18 }, // px added around building
      pulseMs: { small: 900, medium: 750, large: 550 }, // faster = hungrier
    },
    hudFlashMs: 220, // duration of the power-bar flash on a toggle
    // SAM-e's console HUD chrome — phosphor-green accents + status colors.
    hud: {
      accent: 0x86efac, // phosphor green used for framing/dividers
      online: "#86efac", // status dot + label when healthy
      fault: "#fca5a5", // status dot + label during a brownout
      dotBlinkMs: 600, // blink cadence of the ● status indicator
      // Owl roster: one glyph per expected owl this wave. Starts as a faded
      // outline; flips to a full owl/owlet on delivery or a frown on rage-quit.
      owlPending: "🦉", // faded placeholder for an owl not yet resolved
      owlPendingAlpha: 0.22,
      owlProfessor: "🦉", // delivered professor
      owlStudent: "🐤", // delivered student
      owlFail: "🙁", // rage-quit / lost
      owlSize: 16, // px font size of each roster glyph
      owlStep: 20, // px between glyphs
      owlStartX: 14, // left edge of the roster row
      owlY: 32, // baseline row for the roster (second HUD tier)
    },
    // Subtle CRT screen effect drawn over the whole board (in the HUD scene).
    // Sells "you're looking at SAM-e's monitor." Keep alphas low = readable.
    crt: {
      scanlineSpacing: 3, // px between horizontal scan lines
      scanlineColor: 0x000000,
      scanlineAlpha: 0.16, // opacity of each dark scan line
      flickerColor: 0x86efac, // faint green wash that wobbles over the screen
      flickerBaseAlpha: 0.03,
      flickerAmplitude: 0.02, // +/- swing added to base via a sine over time
      flickerSpeed: 0.012, // radians per ms of the flicker sine
      vignetteColor: 0x000000,
      vignetteAlpha: 0.35, // darkness at the very screen edges
      vignetteSize: 90, // px depth of the edge darkening
    },
  },
};
