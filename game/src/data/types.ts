export type PersonKind = "professor" | "student";

export type BuildingSize = "small" | "medium" | "large";

export interface Vec {
  x: number;
  y: number;
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
  door: Vec; // arrival target
}

export interface GateDef {
  id: string;
  x: number;
  y: number;
}

export interface CampusDef {
  width: number;
  height: number;
  buildings: BuildingDef[];
  gates: GateDef[];
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
