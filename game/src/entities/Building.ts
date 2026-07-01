import Phaser from "phaser";
import type { BuildingDef, Vec } from "../data/types";

// A campus building. requiresPower buildings can be toggled ON/OFF (click);
// ON draws kWh and lets the building accept visitors.
export class Building {
  scene: Phaser.Scene;
  def: BuildingDef;
  powered = false;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  doorMark: Phaser.GameObjects.Arc;
  statusIcon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, def: BuildingDef) {
    this.scene = scene;
    this.def = def;

    this.rect = scene.add
      .rectangle(def.x, def.y, def.w, def.h, this.baseColor())
      .setStrokeStyle(2, 0x0b1220)
      .setDepth(5);

    if (def.requiresPower) {
      this.rect.setInteractive({ useHandCursor: true });
      this.rect.setData("kind", "building");
      this.rect.setData("ref", this);
    }

    this.label = scene.add
      .text(def.x, def.y - 4, def.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: def.w - 12 },
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.statusIcon = scene.add
      .text(def.x, def.y + def.h / 2 - 12, def.requiresPower ? "⚡ OFF" : "open", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: def.requiresPower ? "#fca5a5" : "#a7f3d0",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.doorMark = scene.add
      .circle(def.door.x, def.door.y, 6, 0x64748b)
      .setDepth(6);

    this.refresh();
  }

  private baseColor(): number {
    if (!this.def.requiresPower) return 0x3f6212; // always-open = green-ish
    return this.powered ? 0xca8a04 : 0x334155; // lit amber vs dark slate
  }

  get door(): Vec {
    return this.def.door;
  }

  /** A person may enter if the building doesn't need power, or it's powered on. */
  accepts(brownout: boolean): boolean {
    if (!this.def.requiresPower) return true;
    return this.powered && !brownout;
  }

  toggle() {
    if (!this.def.requiresPower) return;
    this.powered = !this.powered;
    this.refresh();
  }

  forceOff() {
    if (this.powered) {
      this.powered = false;
      this.refresh();
    }
  }

  /** kWh/sec this building currently draws (0 when off). */
  drawRate(lightMultiplier: number): number {
    return this.powered ? this.def.drawRate * lightMultiplier : 0;
  }

  refresh() {
    this.rect.setFillStyle(this.baseColor());
    if (this.def.requiresPower) {
      this.statusIcon.setText(this.powered ? "⚡ ON" : "⚡ OFF");
      this.statusIcon.setColor(this.powered ? "#fde68a" : "#fca5a5");
      this.doorMark.setFillStyle(this.powered ? 0xfde68a : 0x64748b);
    } else {
      this.doorMark.setFillStyle(0x86efac);
    }
  }
}
