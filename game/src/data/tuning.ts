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

  // ---- AUDIO ---------------------------------------------------------------
  // All sound is synthesized at runtime via the Web Audio API (no asset files),
  // mirroring the procedurally-generated art. See src/audio/. Volumes are 0..1;
  // master gates everything, sfx/music scale their own sub-mix.
  audio: {
    enabled: true, // master kill-switch; false = AudioManager is a no-op
    masterVolume: 0.5, // overall level (also the "unmuted" level)
    sfxVolume: 0.8, // sound-effect sub-mix level
    musicVolume: 0.3, // fight-song loop sub-mix level (sits under SFX)
    startMuted: false, // begin the run muted
    muteKey: "m", // keyboard shortcut to toggle mute
  },

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
    flapFrameRate: 5, // fps of the 2-frame wing-flap played while stopped/waiting
    // Spawn "needs you" cue: a fresh owl shows a bobbing "!" until routed. The
    // patience clock is delayed by a per-wave grace time (WaveDef.spawnGrace).
    attention: {
      cycleMs: 420, // duration of one full "!" bob (up + back)
      markerOffsetY: 34, // px the "!" sits above the owl's center
      markerBob: 6, // px the "!" bobs up/down
    },
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
    // Screen anchor the power bolt springs from — sits at the relocated HUD
    // power bar (see fx.hud.pwr, left side). GameScene & HUD share screen coords.
    powerSource: { x: 95, y: 38 },
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
      online: "#86efac", // status dot + label when power is healthy
      warn: "#fbbf24", // status dot + label when power runs low
      fault: "#fca5a5", // status dot + label when power is critical / OFFLINE
      dotBlinkMs: 600, // blink cadence of the ● status indicator
      // Status dot reflects available-power fraction: green above warnFrac,
      // yellow above lowFrac, red below (or when browned out / OFFLINE).
      pwrWarnFrac: 0.4, // available/supply above this = green
      pwrLowFrac: 0.2, // above this = yellow; below = red
      // Owl roster: one glyph per expected owl this wave, on the right of the
      // second HUD tier. Right-anchored (grows leftward as the wave is larger)
      // so it never clips the screen edge. Starts as a faded outline; flips to a
      // full owl/owlet on delivery or a frown on rage-quit.
      owlPending: "🦉", // faded placeholder for an owl not yet resolved
      owlPendingAlpha: 0.22,
      owlProfessor: "🦉", // delivered professor
      owlStudent: "🐤", // delivered student
      owlFail: "🙁", // rage-quit / lost
      owlSize: 16, // px font size of each roster glyph
      owlStep: 20, // px between glyphs
      owlRightX: 934, // left edge of the rightmost (last) glyph; roster grows left
      owlY: 32, // baseline row for the roster (second HUD tier)

      // Integrity meter — the HUD's centerpiece (you lose the game at 0%). A big
      // centered bar under a centered label; it shakes + red-flashes on any drop.
      integ: {
        x: 350, // left edge of the centered bar (board center 480 − w/2)
        y: 22, // top of the bar (sits under the centered label)
        w: 260, // bar width
        h: 18, // bar height (taller than power = more prominent)
        labelY: 4, // baseline of the centered "INTEGRITY xx%" label
        centerX: 480, // horizontal center (board width / 2) for the label
        colorGood: 0x86efac, // > 50%
        colorWarn: 0xfbbf24, // > 25%
        colorBad: 0xef4444, // <= 25%
        trackColor: 0x1e293b, // empty-bar background
        shakeMs: 450, // duration of the shake after an integrity drop
        shakeAmp: 5, // px peak jitter (decays over shakeMs)
        flashColor: 0xef4444, // red wash overlaid on the bar while shaking
        flashAlpha: 0.5, // peak alpha of that wash
      },

      // Power meter — a small, static-yellow bar on the LEFT of the second HUD
      // tier (swapped with the owl roster). Labeled with a lightning-bolt icon.
      pwr: {
        icon: "⚡", // bolt glyph shown in place of a "PWR" label
        x: 40, // left edge of the bar (right of the bolt icon)
        y: 34, // top of the bar (second HUD tier, left side)
        w: 110, // bar width
        h: 8, // bar height (smaller than Integrity)
        color: 0xfde047, // static yellow — never changes with load
        trackColor: 0x1e293b, // empty-bar background
        labelX: 14, // bolt-icon x (left-aligned, left of the bar)
        availX: 158, // available-power readout x (right of the bar)
        textY: 32, // baseline for the bolt icon + avail readout
      },
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
