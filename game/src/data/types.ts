export type PersonKind = "professor" | "student";

export interface Vec {
  x: number;
  y: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  x: number; // center
  y: number;
  w: number;
  h: number;
  door: Vec; // arrival target
  drawRate: number; // kWh/sec consumed while powered ON
  requiresPower: boolean; // must be ON to accept a person
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

export interface WaveDef {
  id: number;
  people: number; // total to spawn this wave
  spawnInterval: number; // seconds between spawns
  professorRatio: number; // 0..1 chance a spawn is a professor
  gridRate: number; // kWh/sec supplied
  capacity: number; // reserve cap
  startReserve: number; // reserve at wave start
  leakInterval: number; // seconds between leaks (0 = no leaks)
}

export interface UpgradeDef {
  id: string;
  name: string;
  cost: number;
  unlockWave: number;
  description: string;
}
