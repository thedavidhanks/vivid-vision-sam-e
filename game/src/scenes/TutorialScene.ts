import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { CAMPUS } from "../data/campus";
import { EventBus } from "../state/EventBus";
import { EV } from "../state/events";

// Modal onboarding overlay. GameScene launches this at the start of levels 1-3
// and pauses itself; the "START" button resumes the game and stops the overlay
// (mirrors the ShopScene / ManualScene paused-overlay pattern). Each step shows a
// looping animated diagram built from the game's baked owl/building art.

export type TutorialStep = "route" | "power" | "drone";

// Buildings used as the diagram's "matching color" prop / power target.
const ROUTE_BUILDING = CAMPUS.buildings.find((b) => b.id === "herzstein")!; // blue
const POWER_BUILDING = CAMPUS.buildings.find((b) => b.id === "anderson")!; // red

const OFF_FILL = 0x334155;
const ON_FILL = 0xca8a04;

export class TutorialScene extends Phaser.Scene {
  private step: TutorialStep = "route";

  constructor() {
    super("Tutorial");
  }

  init(data: { step?: TutorialStep }) {
    this.step = data.step ?? "route";
  }

  create() {
    const { width, height } = TUNING.board;

    // Dimmed backdrop over the paused game.
    this.add.rectangle(0, 0, width, height, 0x0b1220, 0.9).setOrigin(0, 0);

    const title =
      this.step === "route"
        ? "GET PEOPLE TO THEIR BUILDING"
        : this.step === "power"
          ? "POWER YOUR BUILDINGS"
          : "SEND DRONES TO FIX LEAKS";
    this.add
      .text(width / 2, 78, title, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "38px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const cy = 225;
    if (this.step === "route") this.buildRouteDiagram(width / 2, cy);
    else if (this.step === "power") this.buildPowerDiagram(width / 2, cy);
    else this.buildDroneDiagram(width / 2, cy);

    const body =
      this.step === "route"
        ? [
            "People arrive at the gates needing to reach a building.",
            "",
            "Click a person and DRAG a path to the building with the",
            "SAME COLOR, then release to send them on their way.",
          ]
        : this.step === "power"
          ? [
              "The campus is going green and conserving energy!",
              "Buildings now start with the lights OFF.",
              "",
              "Click a building to turn its power ON ( ⚡ ) so people",
              "can get inside — switch idle ones off to save energy.",
              "",
              "(No water leaks yet.)",
            ]
          : [
              "Uh oh — water leaks have sprung up on campus!",
              "A leak slows any owl that crosses it.",
              "",
              "Click a DRONE and drag it to the leak to repair it.",
              "It flies over the crowd and clears the path",
              "so your people can get through again.",
            ];
    this.add
      .text(width / 2, 320, body.join("\n"), {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#cbd5e1",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0); // top-anchored so variable-length copy grows downward

    this.makeButton(width / 2, height - 70, "▶  START", "#34d399", () => this.close());
  }

  // ---------- diagrams ----------

  private buildRouteDiagram(cx: number, cy: number) {
    const startX = cx - 210;
    const bx = cx + 190;

    // Target building: slate fill with a thick border in its identity color, so
    // "same color" is literal (garment tint == building color).
    this.drawBuildingProp(bx, cy, ROUTE_BUILDING.name, ROUTE_BUILDING.color!, OFF_FILL);

    // Dashed path from the person to the building door.
    const path = this.add.graphics();
    path.fillStyle(0x64748b, 0.9);
    for (let x = startX + 30; x < bx - 70; x += 22) path.fillCircle(x, cy, 3);

    // Owl + mouse cursor travel together (the "drag" gesture).
    const mover = this.add.container(startX, cy);
    const owl = this.add.image(0, 0, `professor_${ROUTE_BUILDING.id}_side_0`).setOrigin(0.5);
    const cursor = this.makeCursor(20, -26);
    mover.add([owl, cursor]);

    const endX = bx - 70;
    const run = () => {
      mover.x = startX;
      owl.setAlpha(1);
      this.tweens.chain({
        tweens: [
          { targets: mover, x: endX, duration: 1600, ease: "Sine.InOut" },
          { targets: owl, alpha: 0, duration: 260, delay: 120 },
        ],
        onComplete: () => this.time.delayedCall(500, run),
      });
    };
    run();
  }

  private buildPowerDiagram(cx: number, cy: number) {
    const bx = cx + 40;

    const { rect, label } = this.drawBuildingProp(
      bx,
      cy,
      POWER_BUILDING.name,
      POWER_BUILDING.color!,
      OFF_FILL,
      "⚡ OFF",
    );

    // Owl waiting just below the building's door.
    const doorY = cy + 55;
    const owl = this.add
      .image(bx, doorY + 42, `student_${POWER_BUILDING.id}_back_0`)
      .setOrigin(0.5);

    const cursor = this.makeCursor(0, 0);
    const parkX = cx - 200;
    const parkY = cy + 40;

    const run = () => {
      // reset to the "off" state
      rect.setFillStyle(OFF_FILL, 1);
      label.setText("⚡ OFF").setColor("#94a3b8");
      owl.setPosition(bx, doorY + 42).setAlpha(1);
      cursor.setPosition(parkX, parkY).setScale(1);

      this.tweens.chain({
        tweens: [
          // cursor moves onto the building
          { targets: cursor, x: bx, y: cy, duration: 700, ease: "Sine.InOut" },
          // "click" pulse — power the building ON at the dip
          {
            targets: cursor,
            scale: 0.7,
            duration: 130,
            yoyo: true,
            onYoyo: () => {
              rect.setFillStyle(ON_FILL, 1);
              label.setText("⚡ ON").setColor("#fde68a");
            },
          },
          // owl walks up into the now-powered door and disappears inside
          { targets: owl, y: cy, alpha: 0, duration: 700, delay: 200, ease: "Sine.In" },
        ],
        onComplete: () => this.time.delayedCall(700, run),
      });
    };
    run();
  }

  private buildDroneDiagram(cx: number, cy: number) {
    const startX = cx - 210;
    const leakX = cx + 150;

    // A person-path (dashed) that the leak sits astride and blocks.
    const path = this.add.graphics();
    path.fillStyle(0x64748b, 0.9);
    for (let x = startX; x <= cx + 250; x += 22) path.fillCircle(x, cy, 3);

    // Water leak — same look as the in-game Obstruction, with a gentle pulse.
    const r = 30;
    const leak = this.add.container(leakX, cy);
    const lg = this.add.graphics();
    lg.fillStyle(0x2b6cb0, 0.35);
    lg.fillCircle(0, 0, r);
    lg.lineStyle(2, 0x63b3ed, 0.9);
    lg.strokeCircle(0, 0, r * 0.85);
    lg.fillStyle(0xbfe3ff, 0.95);
    lg.fillCircle(0, -3, 4);
    leak.add(lg);
    // Pulse the inner graphics so it never fights the repair (leak-container) tween.
    this.tweens.add({
      targets: lg,
      scale: 1.12,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    // Drone + mouse cursor travel together (the "drag" gesture).
    const mover = this.add.container(startX, cy);
    const drone = this.add.image(0, 0, "drone").setOrigin(0.5);
    const cursor = this.makeCursor(18, -24);
    mover.add([drone, cursor]);

    const run = () => {
      mover.x = startX;
      leak.setAlpha(1).setScale(1);
      this.tweens.chain({
        tweens: [
          // fly the drone over to the leak
          { targets: mover, x: leakX, duration: 1500, ease: "Sine.InOut" },
          // repair: the leak fades away (drone "fixes" it on arrival)
          { targets: leak, alpha: 0, scale: 0.6, duration: 400, delay: 250 },
        ],
        onComplete: () => this.time.delayedCall(600, run),
      });
    };
    run();
  }

  // A small building card: slate fill, thick identity-colored border, name label
  // below, and an optional power-status label centered inside.
  private drawBuildingProp(
    x: number,
    y: number,
    name: string,
    color: number,
    fill: number,
    powerLabel?: string,
  ): { rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
    const rect = this.add.rectangle(x, y, 130, 92, fill, 1).setStrokeStyle(6, color);
    this.add
      .text(x, y + 62, name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#e2e8f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const label = this.add
      .text(x, y, powerLabel ?? "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#94a3b8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    return { rect, label };
  }

  // A simple arrow-style mouse cursor drawn with graphics.
  private makeCursor(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics({ x, y });
    g.fillStyle(0xf8fafc, 1);
    g.lineStyle(1.5, 0x0f172a, 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, 20);
    g.lineTo(5, 15);
    g.lineTo(9, 23);
    g.lineTo(12, 21);
    g.lineTo(8, 13);
    g.lineTo(15, 13);
    g.closePath();
    g.fillPath();
    g.strokePath();
    return g;
  }

  // ---------- ui ----------

  private makeButton(x: number, y: number, label: string, bg: string, onClick: () => void) {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: "#0f172a",
        backgroundColor: bg,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setPadding(24, 12, 24, 12)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerdown", onClick);
    return btn;
  }

  private close() {
    // The player is starting the wave now — ring the class bell.
    EventBus.emit(EV.classInSession);
    this.scene.resume("Game");
    this.scene.stop();
  }
}
