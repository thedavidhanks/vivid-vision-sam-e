import Phaser from "phaser";
import { CAMPUS } from "../data/campus";
import { WAVES } from "../data/waves";
import { TUNING } from "../data/tuning";
import type { PersonKind, Vec } from "../data/types";
import { gameState } from "../state/GameState";
import { EventBus } from "../state/EventBus";
import { EV } from "../state/events";
import { Building } from "../entities/Building";
import { Person } from "../entities/Person";
import { Drone } from "../entities/Drone";
import { Obstruction } from "../entities/Obstruction";
import { DrawController } from "../systems/pathDraw";
import { stepPower } from "../systems/power";
import { payForDelivery } from "../systems/economy";
import { pathHitsCircle } from "../systems/geometry";

const PATH_COLORS = [0x38bdf8, 0xa78bfa, 0x34d399, 0xf472b6, 0xfbbf24, 0xfb7185];

export class GameScene extends Phaser.Scene {
  buildings: Building[] = [];
  buildingById = new Map<string, Building>();
  buildingShort = new Map<string, string>();

  people: Person[] = [];
  drones: Drone[] = [];
  leaks: Obstruction[] = [];

  draw!: DrawController;
  pathGfx!: Phaser.GameObjects.Graphics;
  personColor = new Map<Person, number>();

  // wave runtime
  waveTotal = 0;
  spawnedCount = 0;
  spawnTimer = 0;
  leakTimer = 0;
  brownout = false;
  colorIdx = 0;
  ended = false;
  betweenWaves = false;

  constructor() {
    super("Game");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1b2a1f");
    this.buildings = [];
    this.buildingById.clear();
    this.buildingShort.clear();
    this.people = [];
    this.drones = [];
    this.leaks = [];
    this.personColor.clear();
    this.ended = false;
    this.brownout = false;
    this.colorIdx = 0;

    this.drawGround();
    this.createCampus();

    this.pathGfx = this.add.graphics().setDepth(4);
    this.draw = new DrawController(this);

    this.ensureDrones();
    this.wireInput();

    this.startWave(gameState.waveIndex);
  }

  // ---------- setup ----------

  private drawGround() {
    const g = this.add.graphics().setDepth(0);
    // quad / grass base
    g.fillStyle(0x223324, 1);
    g.fillRect(0, 0, CAMPUS.width, CAMPUS.height);
    // subtle walkway crosshatch so the campus reads as a place
    g.fillStyle(0x2c3f2e, 1);
    for (let x = 0; x < CAMPUS.width; x += 48) g.fillRect(x, 0, 2, CAMPUS.height);
    for (let y = 0; y < CAMPUS.height; y += 48) g.fillRect(0, y, CAMPUS.width, 2);
  }

  private createCampus() {
    for (const def of CAMPUS.buildings) {
      const b = new Building(this, def);
      this.buildings.push(b);
      this.buildingById.set(def.id, b);
      const short = def.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase();
      this.buildingShort.set(def.id, short);
    }
    for (const gate of CAMPUS.gates) {
      this.add.circle(gate.x, gate.y, 16, 0x0ea5e9, 0.25).setDepth(1);
      this.add.circle(gate.x, gate.y, 9, 0x38bdf8, 0.9).setDepth(1);
      this.add
        .text(gate.x, gate.y + 20, "gate", {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#7dd3fc",
        })
        .setOrigin(0.5)
        .setDepth(1);
    }
  }

  private ensureDrones() {
    const desired = 1 + gameState.droneBonus;
    const spots: Vec[] = [
      { x: 360, y: 560 },
      { x: 600, y: 560 },
      { x: 480, y: 560 },
    ];
    while (this.drones.length < desired) {
      const spot = spots[this.drones.length % spots.length];
      this.drones.push(new Drone(this, spot.x, spot.y));
    }
  }

  private wireInput() {
    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (_p: Phaser.Input.Pointer, obj: any) => {
      if (this.ended || this.betweenWaves) return;
      const kind = obj.getData?.("kind");
      if (kind === "building") {
        (obj.getData("ref") as Building).toggle();
      } else if (kind === "person") {
        const person = obj.getData("ref") as Person;
        if (person.state === "waiting" || person.state === "walking" || person.state === "atDoor") {
          const color = this.personColor.get(person) ?? PATH_COLORS[0];
          this.draw.begin({ kind: "person", ref: person, start: person.pos }, color);
        }
      } else if (kind === "drone") {
        const drone = obj.getData("ref") as Drone;
        this.draw.begin({ kind: "drone", ref: drone, start: drone.pos }, 0x22d3ee);
      }
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (this.draw.active) this.draw.addPoint({ x: p.worldX, y: p.worldY });
    });

    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (!this.draw.active) return;
      const source = this.draw.source!;
      const pts = this.draw.end();
      if (!pts) return;
      if (source.kind === "person") this.commitPersonPath(source.ref as Person, pts);
      else this.commitDronePath(source.ref as Drone, pts, { x: p.worldX, y: p.worldY });
    });
  }

  // ---------- waves ----------

  private startWave(index: number) {
    const wave = WAVES[index];
    gameState.waveIndex = index;

    // apply grid upgrade
    const hasGrid = gameState.upgrades.has("grid");
    gameState.power = {
      capacity: wave.capacity + (hasGrid ? 15 : 0),
      gridRate: wave.gridRate + (hasGrid ? 2 : 0),
      solarRate: 0,
      reserve: Math.min(wave.startReserve, wave.capacity + (hasGrid ? 15 : 0)),
    };

    this.waveTotal = wave.people;
    this.spawnedCount = 0;
    this.spawnTimer = 0.6;
    this.leakTimer = wave.leakInterval > 0 ? wave.leakInterval : Infinity;
    this.betweenWaves = false;

    EventBus.emit(EV.waveChanged, index + 1);
    this.flashBanner(`WAVE ${index + 1}`);
  }

  private spawnPerson() {
    const wave = WAVES[gameState.waveIndex];
    const gate = Phaser.Utils.Array.GetRandom(CAMPUS.gates);
    const dest = Phaser.Utils.Array.GetRandom(CAMPUS.buildings);
    const kind: PersonKind = Math.random() < wave.professorRatio ? "professor" : "student";
    const short = this.buildingShort.get(dest.id) ?? "?";
    const person = new Person(this, gate.x, gate.y, kind, dest.id, short);
    this.people.push(person);
    this.personColor.set(person, PATH_COLORS[this.colorIdx++ % PATH_COLORS.length]);
    this.spawnedCount++;
  }

  private spawnLeak() {
    // put a leak somewhere on the walkable interior, away from buildings/edges
    for (let tries = 0; tries < 20; tries++) {
      const x = Phaser.Math.Between(120, CAMPUS.width - 120);
      const y = Phaser.Math.Between(150, CAMPUS.height - 150);
      const tooClose = CAMPUS.buildings.some(
        (b) => Math.abs(x - b.x) < b.w / 2 + 40 && Math.abs(y - b.y) < b.h / 2 + 40
      );
      if (!tooClose) {
        this.leaks.push(new Obstruction(this, x, y));
        return;
      }
    }
  }

  // ---------- commit paths ----------

  private commitPersonPath(person: Person, pts: Vec[]) {
    const dest = this.buildingById.get(person.destId)!;
    const full = [...pts, { x: dest.door.x, y: dest.door.y }];
    // reject if the route skims any active leak
    const blocked = this.leaks.some((l) => pathHitsCircle(full, l.pos, l.radius));
    if (blocked) {
      this.draw.flashInvalid(full);
      return;
    }
    person.setPath(full);
  }

  private commitDronePath(drone: Drone, pts: Vec[], release: Vec) {
    // target = nearest leak to the release point, within snap distance
    let best: Obstruction | null = null;
    let bestD = TUNING.draw.commitSnapDist;
    for (const l of this.leaks) {
      if (l.claimed) continue;
      const d = Phaser.Math.Distance.Between(release.x, release.y, l.x, l.y);
      if (d <= bestD + l.radius) {
        bestD = d;
        best = l;
      }
    }
    if (!best) return; // released nowhere useful — drone stays put
    best.claimed = true;
    drone.assign([...pts, { x: best.x, y: best.y }], best);
  }

  // ---------- main loop ----------

  update(_time: number, delta: number) {
    if (this.ended || this.betweenWaves) return;
    const dt = delta / 1000;

    this.updatePower(dt);
    this.updatePeople(dt);
    this.updateDrones(dt);
    for (const l of this.leaks) l.update(dt);

    this.updateSpawns(dt);
    this.renderPaths();
    this.checkWaveEnd();
  }

  private updatePower(dt: number) {
    const draw = this.buildings.reduce(
      (sum, b) => sum + b.drawRate(gameState.lightDrawMultiplier),
      0
    );
    const res = stepPower(gameState.power, draw, dt);
    gameState.power.reserve = res.reserve;
    this.brownout = res.brownout;
    if (res.brownout) {
      gameState.reputation -= TUNING.power.brownoutRepDrain * dt;
      // rolling blackout: shut everything down; player must re-power deliberately
      for (const b of this.buildings) b.forceOff();
      this.cameras.main.setBackgroundColor("#2a1b1b");
    } else {
      this.cameras.main.setBackgroundColor("#1b2a1f");
    }
    if (gameState.reputation <= 0) this.endGame(false);
  }

  private updatePeople(dt: number) {
    const speed = TUNING.person.baseSpeed * gameState.walkwayMultiplier;
    for (const person of [...this.people]) {
      if (person.state === "walking") {
        this.advance(person, speed * dt);
      } else if (person.state === "waiting" || person.state === "atDoor") {
        person.patience -= dt;
        if (person.state === "atDoor") {
          const b = this.buildingById.get(person.destId)!;
          if (b.accepts(this.brownout)) this.deliver(person);
        }
        if (person.patience <= 0) this.rageQuit(person);
      }
      person.drawRing();
    }
  }

  // Move a person along its polyline by `dist` px this frame.
  private advance(person: Person, dist: number) {
    let remaining = dist;
    while (remaining > 0 && person.seg < person.path.length - 1) {
      const a = person.pos;
      const b = person.path[person.seg + 1];
      const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      if (d <= remaining) {
        person.setPos(b.x, b.y);
        remaining -= d;
        person.seg++;
      } else {
        const t = remaining / d;
        person.setPos(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        remaining = 0;
      }
    }
    if (person.seg >= person.path.length - 1) {
      // reached the door
      const b = this.buildingById.get(person.destId)!;
      if (b.accepts(this.brownout)) this.deliver(person);
      else person.state = "atDoor";
    }
  }

  private updateDrones(dt: number) {
    const dist = TUNING.drone.speed * dt;
    for (const drone of this.drones) {
      if (drone.state === "enroute") {
        let remaining = dist;
        while (remaining > 0 && drone.seg < drone.path.length - 1) {
          const a = drone.pos;
          const b = drone.path[drone.seg + 1];
          const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
          if (d <= remaining) {
            drone.setPos(b.x, b.y);
            remaining -= d;
            drone.seg++;
          } else {
            const t = remaining / d;
            drone.setPos(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
            remaining = 0;
          }
        }
        if (drone.seg >= drone.path.length - 1) {
          drone.state = drone.target ? "fixing" : "idle";
        }
      } else if (drone.state === "fixing") {
        drone.fixElapsed += dt;
        drone.sprite.setAngle(drone.sprite.angle + 12); // spin while working
        if (drone.fixElapsed >= TUNING.drone.fixTime) {
          this.clearLeak(drone.target!);
          drone.target = null;
          drone.state = "idle";
          drone.fixElapsed = 0;
          drone.sprite.setAngle(0);
        }
      }
    }
  }

  private updateSpawns(dt: number) {
    if (this.spawnedCount < this.waveTotal) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnPerson();
        this.spawnTimer = WAVES[gameState.waveIndex].spawnInterval;
      }
    }
    this.leakTimer -= dt;
    if (this.leakTimer <= 0) {
      this.spawnLeak();
      this.leakTimer = WAVES[gameState.waveIndex].leakInterval;
    }
  }

  private renderPaths() {
    this.pathGfx.clear();
    for (const person of this.people) {
      if (person.state !== "walking" || person.path.length < 2) continue;
      const color = this.personColor.get(person) ?? 0x38bdf8;
      this.pathGfx.lineStyle(2, color, 0.35);
      this.pathGfx.beginPath();
      this.pathGfx.moveTo(person.sprite.x, person.sprite.y);
      for (let i = person.seg + 1; i < person.path.length; i++) {
        this.pathGfx.lineTo(person.path[i].x, person.path[i].y);
      }
      this.pathGfx.strokePath();
    }
  }

  // ---------- outcomes ----------

  private deliver(person: Person) {
    person.state = "done";
    gameState.money += payForDelivery(person.kind);
    gameState.reputation = Math.min(
      TUNING.reputation.start,
      gameState.reputation + TUNING.economy.deliveryRepRefund
    );
    EventBus.emit(EV.personDelivered, person.kind);
    this.floatText(person.sprite.x, person.sprite.y, `+$${payForDelivery(person.kind)}`, "#34d399");
    this.popEffect(person.sprite.x, person.sprite.y, 0x34d399);
    this.removePerson(person);
  }

  private rageQuit(person: Person) {
    person.state = "done";
    gameState.reputation -= TUNING.reputation.perRageQuit;
    EventBus.emit(EV.personRageQuit);
    this.floatText(person.sprite.x, person.sprite.y, "😠", "#f87171");
    this.popEffect(person.sprite.x, person.sprite.y, 0xf87171);
    this.removePerson(person);
    if (gameState.reputation <= 0) this.endGame(false);
  }

  private clearLeak(leak: Obstruction) {
    this.leaks = this.leaks.filter((l) => l !== leak);
    this.popEffect(leak.x, leak.y, 0x63b3ed);
    leak.destroy();
  }

  private removePerson(person: Person) {
    this.people = this.people.filter((p) => p !== person);
    this.personColor.delete(person);
    person.destroy();
  }

  private checkWaveEnd() {
    if (this.spawnedCount >= this.waveTotal && this.people.length === 0) {
      this.betweenWaves = true;
      const next = gameState.waveIndex + 1;
      EventBus.emit(EV.waveCleared, gameState.waveIndex + 1);
      if (next >= WAVES.length) {
        this.endGame(true);
      } else {
        // clear any leftover leaks before the shop
        for (const l of this.leaks) l.destroy();
        this.leaks = [];
        this.scene.launch("Shop", { nextWave: next });
        this.scene.pause();
      }
    }
  }

  // Called by ShopScene when the player is done shopping.
  beginNextWave(index: number) {
    this.ensureDrones();
    this.scene.resume();
    this.startWave(index);
  }

  private endGame(won: boolean) {
    if (this.ended) return;
    this.ended = true;
    EventBus.emit(won ? EV.gameWon : EV.gameOver);
    this.scene.stop("HUD");
    this.scene.start("End", { won, money: gameState.money, wave: gameState.waveIndex + 1 });
  }

  // ---------- fx ----------

  private floatText(x: number, y: number, text: string, color: string) {
    const t = this.add
      .text(x, y - 20, text, { fontFamily: "monospace", fontSize: "16px", color })
      .setOrigin(0.5)
      .setDepth(40);
    this.tweens.add({
      targets: t,
      y: y - 55,
      alpha: 0,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }

  private popEffect(x: number, y: number, color: number) {
    const c = this.add.circle(x, y, 6, color, 0.7).setDepth(39);
    this.tweens.add({
      targets: c,
      scale: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => c.destroy(),
    });
  }

  private flashBanner(text: string) {
    const b = this.add
      .text(CAMPUS.width / 2, CAMPUS.height / 2, text, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "64px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.tweens.add({
      targets: b,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 600,
      onComplete: () => b.destroy(),
    });
  }

  // ---------- HUD read helpers ----------
  get activePeople() {
    return this.people.length;
  }
  get waveNumber() {
    return gameState.waveIndex + 1;
  }
  get waveCount() {
    return WAVES.length;
  }
  get remainingToSpawn() {
    return this.waveTotal - this.spawnedCount;
  }
  get isBrownout() {
    return this.brownout;
  }
}
