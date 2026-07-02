import Phaser from "phaser";
import type { BuildingDef, BuildingSize, DoorDef, Vec } from "../data/types";
import { costForSize } from "../systems/power";
import { pointInRect } from "../systems/geometry";
import { TUNING } from "../data/tuning";

// A campus building. Each wave activates a subset of buildings and gives each a
// size (small/medium/large) that sets its flat power cost. Active buildings can
// be toggled ON/OFF (click); ON consumes power and lets the building accept
// visitors. Buildings always start OFF.
const SIZE_SCALE: Record<BuildingSize, number> = { small: 0.8, medium: 1.0, large: 1.2 };
const SIZE_LETTER: Record<BuildingSize, string> = { small: "S", medium: "M", large: "L" };
const BORDER_W = 6; // thick identity border; its color is the building's fixed color
const BORDER_FALLBACK = 0x0b1220; // for any building without a color assigned
const INACTIVE_BORDER = 0x475569; // greyed border for buildings inactive this wave
const INACTIVE_ALPHA = 0.4; // dim inactive buildings so active ones read first

export class Building {
  scene: Phaser.Scene;
  def: BuildingDef;
  size: BuildingSize = "small";
  active = false;
  powered = false;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  doorMarks: Phaser.GameObjects.Rectangle[];
  statusIcon: Phaser.GameObjects.Text;
  private aura: Phaser.GameObjects.Rectangle;
  private auraTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, def: BuildingDef) {
    this.scene = scene;
    this.def = def;

    // Pulsing "consumption" glow behind the building; visible only when powered.
    this.aura = scene.add
      .rectangle(def.x, def.y, def.w, def.h, TUNING.fx.aura.color, TUNING.fx.aura.baseAlpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4)
      .setVisible(false);

    this.rect = scene.add
      .rectangle(def.x, def.y, def.w, def.h, this.baseColor())
      .setStrokeStyle(BORDER_W, def.color ?? BORDER_FALLBACK) // fixed identity color
      .setDepth(5);

    // Rotated labels (edge buildings) read along their long axis, so wrap on the
    // building's height instead of its width.
    const rotated = def.labelAngle === 90 || def.labelAngle === -90;
    this.label = scene.add
      .text(def.x, def.y, def.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: (rotated ? def.h : def.w) - 12 },
      })
      .setOrigin(0.5)
      .setAngle(def.labelAngle ?? 0)
      .setDepth(6);

    this.statusIcon = scene.add
      .text(def.x, def.y + def.h / 2 - 12, "⚡ OFF", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fca5a5",
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.doorMarks = def.doors.map((d) =>
      scene.add
        .rectangle(d.x, d.y, d.w, d.h, 0x64748b, 0.85)
        .setStrokeStyle(2, 0x0b1220)
        .setDepth(6)
    );

    this.setActive(false, "small");
  }

  /**
   * Activate/deactivate for a wave. Inactive buildings stay on the map but are
   * greyed out (grey border, dimmed) and can't be toggled or entered. All start
   * OFF.
   */
  setActive(active: boolean, size: BuildingSize) {
    this.active = active;
    this.size = size;
    this.powered = false; // buildings always start OFF each wave

    // Building box + name stay visible either way; only the interactive bits
    // (status icon, door marks) are hidden while inactive.
    this.rect.setVisible(true);
    this.label.setVisible(true);
    this.statusIcon.setVisible(active);
    for (const m of this.doorMarks) m.setVisible(active);

    if (active) {
      this.applySizeVisual();
      this.rect.setAlpha(1);
      this.label.setAlpha(1);
      this.rect.setStrokeStyle(BORDER_W, this.def.color ?? BORDER_FALLBACK);
      this.rect.setInteractive({ useHandCursor: true });
      this.rect.setData("kind", "building");
      this.rect.setData("ref", this);
    } else {
      this.rect.setDisplaySize(this.def.w, this.def.h);
      this.rect.setAlpha(INACTIVE_ALPHA);
      this.label.setAlpha(INACTIVE_ALPHA);
      this.rect.setStrokeStyle(BORDER_W, INACTIVE_BORDER); // greyed identity cue
      this.rect.disableInteractive();
    }
    this.refresh();
  }

  private applySizeVisual() {
    const f = SIZE_SCALE[this.size];
    this.rect.setDisplaySize(this.def.w * f, this.def.h * f);
    const pad = TUNING.fx.aura.pad[this.size];
    this.aura.setDisplaySize(this.def.w * f + pad * 2, this.def.h * f + pad * 2);
  }

  // Start (or stop) the pulsing consumption glow to match the powered state.
  // Bigger buildings pulse faster to read as "hungrier".
  private updateAura() {
    const on = this.active && this.powered;
    this.aura.setVisible(on);
    if (on && !this.auraTween) {
      this.aura.setAlpha(TUNING.fx.aura.baseAlpha);
      this.auraTween = this.scene.tweens.add({
        targets: this.aura,
        alpha: TUNING.fx.aura.peakAlpha,
        duration: TUNING.fx.aura.pulseMs[this.size],
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (!on && this.auraTween) {
      this.auraTween.stop();
      this.auraTween = undefined;
    }
  }

  private baseColor(): number {
    return this.powered ? 0xca8a04 : 0x334155; // lit amber vs dark slate
  }

  get doors(): DoorDef[] {
    return this.def.doors;
  }

  /** True if point `p` (an owl's position) lies in any entrance box (+ margin). */
  entranceContains(p: Vec, margin = 0): boolean {
    return this.def.doors.some((d) => pointInRect(p, d, margin));
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
    for (const m of this.doorMarks) m.setFillStyle(this.powered ? 0xfde68a : 0x64748b, 0.85);
    this.updateAura();
  }
}
