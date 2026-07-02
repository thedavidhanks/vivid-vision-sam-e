export type PersonKind = "professor" | "student";

export type BuildingSize = "small" | "medium" | "large";

export interface Vec {
  x: number;
  y: number;
}

// A building entrance: a doorway box (center + size) an owl must reach. Buildings
// may have more than one. Arrival is a point-in-box test (see entranceContains).
export interface DoorDef {
  x: number; // center
  y: number;
  w: number;
  h: number;
}

// Buildings are pure geometry; a wave decides which are active and their size
// (which sets their flat power cost). See WaveBuildingDef.
export interface BuildingDef {
  id: string;
  name: string;
  x: number; // center
  y: number;
  w: number;
  h: number;
  doors: DoorDef[]; // arrival targets — one or more entrance boxes
  labelAngle?: number; // degrees to rotate the name label (e.g. ±90 for edge buildings)
  color?: number; // fixed identity color — shown as the building's border and on the
  // garments of owls routed here (wayfinding cue). Never changes.
}

// A hidden spawn point where people can appear. Building doors also act as
// spawn points (see GameScene). Spawns are NOT drawn on the map.
export interface SpawnDef {
  id: string;
  x: number;
  y: number;
}

// A paved walkway across the quad, drawn as a thick polyline. Purely visual
// unless `speedBonus` is set, in which case people traveling on it (within
// width/2 of the centerline) move faster. See walkwaySpeedFactor.
export interface WalkwayDef {
  id: string;
  label?: string;
  points: Vec[]; // ordered centerline
  width: number; // paved width in px
  speedBonus?: boolean; // true = grants a walking-speed bonus while on it
}

export interface CampusDef {
  width: number;
  height: number;
  buildings: BuildingDef[];
  spawns: SpawnDef[]; // hidden spawn points (people also spawn at building doors)
  walkways: WalkwayDef[];
  dock: Vec; // drone docking station: where drones start and auto-return when idle
}

// Which buildings are active this wave, and the size that sets each one's cost.
export interface WaveBuildingDef {
  id: string; // must match a BuildingDef.id in CAMPUS
  size: BuildingSize;
}

export interface WaveDef {
  id: number;
  people: number; // total to spawn this wave
  spawnInterval: number; // seconds between spawns
  professorRatio: number; // 0..1 chance a spawn is a professor
  supply: number; // flat factory supply this wave
  buildings: WaveBuildingDef[]; // active buildings + sizes for this wave
  leakInterval: number; // seconds between leaks (0 = no leaks)
}

export interface UpgradeDef {
  id: string;
  name: string;
  cost: number;
  unlockWave: number;
  description: string;
}
