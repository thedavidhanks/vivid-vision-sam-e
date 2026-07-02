import Phaser from "phaser";
import type { Vec } from "../data/types";
import type { Obstruction } from "./Obstruction";

export type DroneState = "idle" | "enroute" | "fixing" | "returning";

// Player-directed repair drone. Click it, draw a path to a leak; it flies over
// pedestrians (no collision) and repairs on arrival.
export class Drone {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  home: Vec;

  state: DroneState = "idle";
  path: Vec[] = [];
  seg = 0;
  target: Obstruction | null = null;
  fixElapsed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.home = { x, y };
    this.sprite = scene.add
      .sprite(x, y, "drone")
      .setDepth(30)
      .setInteractive({ useHandCursor: true });
    this.sprite.setData("kind", "drone");
    this.sprite.setData("ref", this);
  }

  assign(path: Vec[], target: Obstruction) {
    this.path = path;
    this.seg = 0;
    this.target = target;
    this.fixElapsed = 0;
    this.state = "enroute";
  }

  // Fly straight back to the docking station. Called once a repair finishes so
  // drones rest at the dock rather than idling at the leak they just fixed.
  returnHome() {
    this.path = [this.pos, this.home];
    this.seg = 0;
    this.target = null;
    this.fixElapsed = 0;
    this.state = "returning";
  }

  get pos(): Vec {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPos(x: number, y: number) {
    this.sprite.setPosition(x, y);
  }

  isBusy(): boolean {
    return this.state !== "idle";
  }
}
