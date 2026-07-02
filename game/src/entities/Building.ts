import Phaser from "phaser";
import type { BuildingDef, BuildingSize, Vec } from "../data/types";
import { costForSize } from "../systems/power";

// A campus building. Each wave activates a subset of buildings and gives each a
// size (small/medium/large) that sets its flat power cost. Active buildings can
// be toggled ON/OFF (click); ON consumes power and lets the building accept
// visitors. Buildings always start OFF.
const SIZE_SCALE: Record<BuildingSize, number> = { small: 0.8, medium: 1.0, large: 1.2 };
const SIZE_LETTER: Record<BuildingSize, string> = { small: "S", medium: "M", large: "L" };

export class Building {
  scene: Phaser.Scene;
  def: BuildingDef;
  size: BuildingSize = "small";
  active = false;
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
      .text(def.x, def.y + def.h / 2 - 12, "⚡ OFF", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fca5a5",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.doorMark = scene.add.circle(def.door.x, def.door.y, 6, 0x64748b).setDepth(6);

    this.setActive(false, "small");
  }

  /** Activate/deactivate for a wave. Inactive buildings hide and start OFF. */
  setActive(active: boolean, size: BuildingSize) {
    this.active = active;
    this.size = size;
    this.powered = false; // buildings always start OFF each wave

    this.rect.setVisible(active);
    this.label.setVisible(active);
    this.statusIcon.setVisible(active);
    this.doorMark.setVisible(active);

    if (active) {
      this.applySizeVisual();
      this.rect.setInteractive({ useHandCursor: true });
      this.rect.setData("kind", "building");
      this.rect.setData("ref", this);
    } else {
      this.rect.disableInteractive();
    }
    this.refresh();
  }

  private applySizeVisual() {
    const f = SIZE_SCALE[this.size];
    this.rect.setDisplaySize(this.def.w * f, this.def.h * f);
  }

  private baseColor(): number {
    return this.powered ? 0xca8a04 : 0x334155; // lit amber vs dark slate
  }

  get door(): Vec {
    return this.def.door;
  }

  /** Flat power cost this building currently draws (0 when off/inactive). */
  cost(costMultiplier: number): number {
    return this.active && this.powered ? costForSize(this.size, costMultiplier) : 0;
  }

  /** A person may enter if the building is active, powered, and not browned out. */
  accepts(brownout: boolean): boolean {
    return this.active && this.powered && !brownout;
  }

  // GameScene enforces canPowerOn() before calling this to power ON.
  toggle() {
    if (!this.active) return;
    this.powered = !this.powered;
    this.refresh();
  }

  forceOff() {
    if (this.powered) {
      this.powered = false;
      this.refresh();
    }
  }

  refresh() {
    this.rect.setFillStyle(this.baseColor());
    const letter = SIZE_LETTER[this.size];
    this.statusIcon.setText(this.powered ? `⚡ ON (${letter})` : `⚡ OFF (${letter})`);
    this.statusIcon.setColor(this.powered ? "#fde68a" : "#fca5a5");
    this.doorMark.setFillStyle(this.powered ? 0xfde68a : 0x64748b);
  }
}
