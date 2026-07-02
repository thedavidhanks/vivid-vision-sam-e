import type { CampusDef } from "./types";

// A small, readable slice of a Rice-flavored campus. Doors sit on the walkway
// side of each building. Buildings are pure geometry — each wave decides which
// are active and their size (which sets the flat power cost); see waves.ts.
export const CAMPUS: CampusDef = {
  width: 960,
  height: 600,
  buildings: [
    {
      id: "fondren",
      name: "Fondren Library",
      x: 780, y: 150, w: 150, h: 92,
      door: { x: 780, y: 205 },
    },
    {
      id: "herzstein",
      name: "Herzstein Hall",
      x: 190, y: 150, w: 140, h: 92,
      door: { x: 190, y: 205 },
    },
    {
      id: "chapel",
      name: "Rice Chapel",
      x: 480, y: 315, w: 130, h: 92,
      door: { x: 480, y: 370 },
    },
    {
      id: "duncan",
      name: "Duncan Hall",
      x: 780, y: 470, w: 150, h: 92,
      door: { x: 780, y: 415 },
    },
    {
      id: "brochstein",
      name: "Brochstein Pavilion",
      x: 190, y: 470, w: 140, h: 92,
      door: { x: 190, y: 415 },
    },
  ],
  gates: [
    { id: "west", x: 42, y: 315 },
    { id: "north", x: 480, y: 96 },
    { id: "east", x: 918, y: 315 },
  ],
};
