import Phaser from "phaser";
import { TUNING } from "../data/tuning";
import { gameState } from "../state/GameState";

// Start screen framed as SAM-e (Strategic Automation & Management engine) — the
// campus AI the player embodies — booting up. The boot log reveals one line at a
// time, then an in-character briefing types out character-by-character, and
// finally a blinking prompt waits for the player to "boot" the game. Click/key
// mid-animation skips to the full text; the next input after it completes starts
// a fresh run. (Full controls live in the pause menu / ManualScene.)
export class MenuScene extends Phaser.Scene {
  // Status log, revealed one line per tick.
  private static readonly BOOT_LOG = [
    "> booting Campus Control ........ [OK]",
    "> power grid link ............... [OK]",
    "> owl telemetry ................. [OK]",
    "> water-leak sensors ........... [OK]",
  ];

  // In-character briefing, typed out character-by-character.
  private static readonly BRIEFING = [
    "Hello SAM-e, professors and students are arriving soon.",
    "Direct them to where they need to go as quickly as possible.",
    "Make sure the lights are on, but keep an eye on the available power.",
  ].join("\n");

  private isBooting = true;
  private logTimer?: Phaser.Time.TimerEvent;
  private typeTimer?: Phaser.Time.TimerEvent;
  private cursorTimer?: Phaser.Time.TimerEvent;
  private logText!: Phaser.GameObjects.Text;
  private briefText!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;

  constructor() {
    super("Menu");
  }

  create() {
    // Reset per-instance state — Phaser reuses the scene object across restarts.
    this.isBooting = true;
    this.logTimer = undefined;
    this.typeTimer = undefined;
    this.cursorTimer = undefined;

    const { height } = TUNING.board;
    this.cameras.main.setBackgroundColor("#0f172a");

    const left = 90;

    // Header — SAM-e persona.
    this.add.text(left, 60, "SAM-e", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#fde68a",
      fontStyle: "bold",
    });
    this.add.text(left + 4, 120, "// Strategic Automation & Management engine", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#64748b",
    });

    // Boot log (green terminal) and briefing (slate), both revealed over time.
    this.logText = this.add.text(left, 190, "", {
      fontFamily: "monospace",
      fontSize: "17px",
      color: "#86efac",
      lineSpacing: 8,
    });
    this.briefText = this.add.text(left, 330, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#86efac",
      lineSpacing: 10,
    });

    // Final start prompt with a blinking cursor — hidden until animation ends.
    this.prompt = this.add
      .text(left, height - 80, "▶  press any key to boot _", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#34d399",
        fontStyle: "bold",
      })
      .setVisible(false);

    this.startBootLog();

    this.input.on("pointerdown", this.handleInput, this);
    this.input.keyboard?.on("keydown", this.handleInput, this);

    // Kill timers/listeners so they can't fire after leaving the scene.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.logTimer?.remove();
      this.typeTimer?.remove();
      this.cursorTimer?.remove();
    });
  }

  // Reveal the status log one line per tick, then start typing the briefing.
  private startBootLog() {
    const lines = MenuScene.BOOT_LOG;
    let i = 0;
    this.logTimer = this.time.addEvent({
      delay: 160,
      repeat: lines.length - 1,
      callback: () => {
        i += 1;
        this.logText.setText(lines.slice(0, i).join("\n"));
        if (i >= lines.length) this.startBriefing();
      },
    });
  }

  // Type the briefing out one character at a time.
  private startBriefing() {
    const full = MenuScene.BRIEFING;
    let i = 0;
    this.typeTimer = this.time.addEvent({
      delay: 28,
      repeat: full.length - 1,
      callback: () => {
        i += 1;
        this.briefText.setText(full.slice(0, i));
        if (i >= full.length) this.finishBoot();
      },
    });
  }

  // Reveal everything at once and enter the "ready to start" state.
  private finishBoot() {
    if (!this.isBooting) return;
    this.logTimer?.remove();
    this.typeTimer?.remove();
    this.logText.setText(MenuScene.BOOT_LOG.join("\n"));
    this.briefText.setText(MenuScene.BRIEFING);
    this.prompt.setVisible(true);
    this.isBooting = false;

    // Blink the cursor at the end of the prompt.
    let on = true;
    this.cursorTimer = this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        on = !on;
        this.prompt.setText(`▶  press any key to boot ${on ? "_" : " "}`);
      },
    });
  }

  // First input skips the animation; the next one starts the game.
  private handleInput() {
    if (this.isBooting) {
      this.finishBoot();
      return;
    }
    this.cursorTimer?.remove();
    gameState.reset();
    this.scene.start("Game");
    this.scene.launch("HUD");
  }
}
