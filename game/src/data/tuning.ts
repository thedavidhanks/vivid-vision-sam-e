// Central balance knobs. All gameplay math reads from here so tuning is data, not code.
export const TUNING = {
  board: { width: 960, height: 600 },

  person: {
    baseSpeed: 95, // px/sec (raised by the "faster walkways" upgrade)
    patience: 18, // seconds of patience while stuck/waiting
    radius: 15,
  },

  drone: {
    speed: 175, // px/sec
    fixTime: 3, // seconds hovering over a leak to repair it
    radius: 14,
  },

  power: {
    // net = gridRate + solarRate - (sum of ON building drawRates)
    // reserve clamps to [0, capacity]; hitting 0 under demand = brownout.
    brownoutRepDrain: 10, // reputation/sec lost while browned out
  },

  economy: {
    pay: { professor: 30, student: 18 } as Record<string, number>,
    deliveryRepRefund: 2,
  },

  reputation: {
    start: 100,
    perRageQuit: 20,
  },

  leak: {
    radius: 36,
  },

  draw: {
    minPointDist: 9, // px between captured polyline points
    commitSnapDist: 55, // how close to a target the release must be
  },
};
