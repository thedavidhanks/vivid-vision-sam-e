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
import { computeLoad, stepBattery, canPowerOn, costForSize } from "../systems/power";
import { payForSatisfiedDelivery, payForRepair } from "../systems/economy";
import { walkwaySpeedFactor } from "../systems/walkways";

const PATH_COLORS = [0x38bdf8, 0xa78bfa, 0x34d399, 0xf472b6, 0xfbbf24, 0xfb7185];

export class GameScene extends Phaser.Scene {
  buildings: Building[] = [];
  buildingById = new Map<string, Building>();
  activeBuildingIds: string[] = [];
  currentLoad = 0;

  // Hidden spawn points: the campus spawn markers plus every building door.
  // `buildingId` is set for door spawns so we can avoid spawning a person at
  // the door of their own destination.
  spawnPoints: { x: number; y: number; buildingId: string | null }[] = [];
  // The subset of spawnPoints live this wave (see WaveDef.activeSpawns). People
  // only appear at these; set in startWave.
  activeSpawnPoints: { x: number; y: number; buildingId: string | null }[] = [];

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
    this.people = [];
    this.drones = [];
    this.leaks = [];
    this.personColor.clear();
    this.ended = false;
    this.brownout = false;
    this.colorIdx = 0;

    this.drawGround();
    this.drawGreenspace();
    this.drawWalkways();
    this.drawDock();
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

  // Manicured lawn between the buildings, plus trees and flower beds — cosmetic
  // only. Drawn above the grass base (depth 0) and below the walkways (depth 2);
  // trees sit at depth 3 so their canopies read above the lawn.
  private drawGreenspace() {
    const lawn = this.add.graphics().setDepth(1);
    // Four lawn panels filling the quad quadrants between the cross walks.
    lawn.fillStyle(0x2f4a32, 1);
    const panels: [number, number, number, number][] = [
      [60, 108, 390, 210], // top-left
      [60, 330, 390, 212], // bottom-left
      [550, 108, 350, 210], // top-right
      [550, 330, 350, 212], // bottom-right
    ];
    for (const [x, y, w, h] of panels) lawn.fillRoundedRect(x, y, w, h, 14);

    // Flower beds: small clusters of colored dots.
    const beds: [number, number][] = [
      [255, 320], [705, 320], [255, 210], [705, 430],
    ];
    const petals = [0xf9a8d4, 0xfcd34d, 0xc4b5fd, 0xfca5a5];
    for (const [bx, by] of beds) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        lawn
          .fillStyle(petals[i % petals.length], 0.95)
          .fillCircle(bx + Math.cos(a) * 10, by + Math.sin(a) * 10, 3);
      }
      lawn.fillStyle(0xfde68a, 1).fillCircle(bx, by, 3);
    }

    // Trees: a shaded canopy over a small trunk, scattered in the open lawn.
    const trees: [number, number][] = [
      [150, 175], [330, 260], [140, 470], [340, 400], [120, 300],
      [650, 220], [860, 200], [700, 470], [860, 430], [780, 300],
    ];
    const t = this.add.graphics().setDepth(3);
    for (const [tx, ty] of trees) {
      t.fillStyle(0x5b3a29, 1).fillRect(tx - 3, ty, 6, 12); // trunk
      t.fillStyle(0x2f6b34, 1).fillCircle(tx, ty - 4, 18); // canopy
      t.fillStyle(0x3f8b45, 1).fillCircle(tx - 6, ty - 8, 11); // highlight
    }
  }

  // Paved quad walkways with a running-bond brick texture. Drawn above the grass
  // (depth 0) but below buildings (depth 5) and people (depth 20).
  private drawWalkways() {
    const g = this.add.graphics().setDepth(2);
    const MORTAR = 0x6f5643;
    const BRICK = 0xb5825f;
    const COURSE = 16; // brick length along the path
    for (const w of CAMPUS.walkways) {
      if (w.points.length < 2) continue;
      const hw = w.width / 2;
      // slab (mortar border) then the brick face on top
      this.strokePolyline(g, w.points, w.width, MORTAR);
      this.strokePolyline(g, w.points, w.width - 4, BRICK);
      // mortar joints: center course line + staggered perpendicular rungs
      this.strokePolyline(g, w.points, 1.5, MORTAR, 0.9);
      g.lineStyle(1.5, MORTAR, 0.9);
      for (let i = 0; i < w.points.length - 1; i++) {
        const a = w.points[i];
        const b = w.points[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) continue;
        const ux = dx / len;
        const uy = dy / len; // along
        const nx = -uy;
        const ny = ux; // normal
        for (let d = 0; d < len; d += COURSE) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          g.lineBetween(cx, cy, cx + nx * hw, cy + ny * hw); // upper-course joint
        }
        for (let d = COURSE / 2; d < len; d += COURSE) {
          const cx = a.x + ux * d;
          const cy = a.y + uy * d;
          g.lineBetween(cx, cy, cx - nx * hw, cy - ny * hw); // lower-course joint (staggered)
        }
      }
    }
  }

  private strokePolyline(
    g: Phaser.GameObjects.Graphics,
    pts: Vec[],
    width: number,
    color: number,
    alpha = 1
  ) {
    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();
  }

  private createCampus() {
    for (const def of CAMPUS.buildings) {
      const b = new Building(this, def);
      this.buildings.push(b);
      this.buildingById.set(def.id, b);
    }
    // Spawn points are the campus spawn markers plus every building door. They
    // are intentionally not drawn (people simply appear at them).
    this.spawnPoints = [
      ...CAMPUS.spawns.map((s) => ({ x: s.x, y: s.y, buildingId: null as string | null })),
      ...CAMPUS.buildings.flatMap((b) =>
        b.doors.map((d) => ({ x: d.x, y: d.y, buildingId: b.id }))
      ),
    ];
  }

  private ensureDrones() {
    const desired = 1 + gameState.droneBonus;
    // All drones home to the dock; fan them out slightly so they don't stack
    // exactly on the pad when idle. Offsets are purely cosmetic.
    const offsets: Vec[] = [
      { x: 0, y: 0 },
      { x: 22, y: -6 },
      { x: -22, y: -6 },
      { x: 0, y: -22 },
    ];
    while (this.drones.length < desired) {
      const o = offsets[this.drones.length % offsets.length];
      this.drones.push(new Drone(this, CAMPUS.dock.x + o.x, CAMPUS.dock.y + o.y));
    }
  }

  // Landing pad for the repair drones in the SW corner. Purely visual — drones
  // start here and auto-return once a repair is done.
  private drawDock() {
    const { x, y } = CAMPUS.dock;
    const g = this.add.graphics().setDepth(3);
    // pad base + contrasting ring
    g.fillStyle(0x1f2933, 0.9);
    g.fillCircle(x, y, 34);
    g.lineStyle(3, 0x38bdf8, 0.9);
    g.strokeCircle(x, y, 34);
    g.lineStyle(2, 0x38bdf8, 0.5);
    g.strokeCircle(x, y, 22);
    // corner ticks to read as a landing pad
    g.lineStyle(2, 0x38bdf8, 0.8);
    for (const a of [45, 135, 225, 315]) {
      const r = (a * Math.PI) / 180;
      g.lineBetween(x + Math.cos(r) * 24, y + Math.sin(r) * 24, x + Math.cos(r) * 34, y + Math.sin(r) * 34);
    }
    this.add
      .text(x, y + 44, "DRONE DOCK", { fontSize: "11px", color: "#7dd3fc", fontStyle: "bold" })
      .setOrigin(0.5)
      .setDepth(3);
  }

  private wireInput() {
    // Escape pauses the game and pops up the manual overlay.
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.ended || this.betweenWaves || this.scene.isActive("Manual")) return;
      this.scene.launch("Manual");
      this.scene.pause();
    });

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (_p: Phaser.Input.Pointer, obj: any) => {
      if (this.ended || this.betweenWaves) return;
      const kind = obj.getData?.("kind");
      if (kind === "building") {
        const b = obj.getData("ref") as Building;
        if (!b.powered) {
          // Block powering ON when it would overload supply (and no battery covers it).
          const mult = gameState.costMultiplier;
          const load = computeLoad(this.buildings.map((x) => x.cost(mult)));
          const cost = costForSize(b.size, mult);
          if (!canPowerOn(load, cost, gameState.supply, gameState.battery.charge)) {
            this.showNoPowerCue(b);
            return;
          }
        }
        b.toggle();
        if (b.powered) this.zapEffect({ x: b.def.x, y: b.def.y });
        EventBus.emit(EV.powerToggled, { powered: b.powered });
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

    // factory supply for this wave (+ grid upgrade); battery starts empty.
    const hasGrid = gameState.upgrades.has("grid");
    gameState.supply = wave.supply + (hasGrid ? TUNING.power.gridSupplyBonus : 0);
    gameState.battery = { capacity: gameState.batteryCapacity, charge: 0 };

    // activate this wave's first `activeBuildings` (with sizes); the rest sit on
    // the map greyed-out. All start OFF.
    const active = wave.buildings.slice(0, wave.activeBuildings);
    const sizeById = new Map(active.map((wb) => [wb.id, wb.size]));
    for (const b of this.buildings) {
      const size = sizeById.get(b.def.id);
      b.setActive(size !== undefined, size ?? "small");
    }
    this.activeBuildingIds = active.map((wb) => wb.id);
    this.currentLoad = 0;

    // limit this wave to its configured number of spawn locations (markers first,
    // then doors — see createCampus order; clamped to what's available).
    this.activeSpawnPoints = this.spawnPoints.slice(0, wave.activeSpawns);

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
    const spawn = Phaser.Utils.Array.GetRandom(this.activeSpawnPoints);
    // Don't route a person to the building whose door they spawned at.
    let choices = this.activeBuildingIds;
    if (spawn.buildingId) {
      const filtered = choices.filter((id) => id !== spawn.buildingId);
      if (filtered.length > 0) choices = filtered;
    }
    const destId = Phaser.Utils.Array.GetRandom(choices);
    const dest = this.buildingById.get(destId)!.def;
    const kind: PersonKind = Math.random() < wave.professorRatio ? "professor" : "student";
    const person = new Person(this, spawn.x, spawn.y, kind, dest.id);
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
    // The player must steer the owl to a building entrance themselves — the path
    // is used exactly as drawn (no auto-routing to the door). If it doesn't end
    // in an entrance box, the owl walks to the end and then waits (see advance).
    // Paths may cross water; owls simply slow down while inside a leak (see updatePeople).
    person.setPath(pts);
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
    const mult = gameState.costMultiplier;
    const load = computeLoad(this.buildings.map((b) => b.cost(mult)));
    this.currentLoad = load;
    const { supply, battery } = gameState;

    const step = stepBattery(battery, load, supply, TUNING.power.battery.chargeRate, dt);
    battery.charge = step.charge;
    this.brownout = step.brownout;

    if (step.brownout) {
      gameState.reputation -= TUNING.power.brownoutRepDrain * dt;
      // battery emptied while overloaded: shed largest-first until load fits.
      this.shedToFit(load, supply);
      this.cameras.main.setBackgroundColor("#2a1b1b");
    } else {
      this.cameras.main.setBackgroundColor("#1b2a1f");
    }
    if (gameState.reputation <= 0) this.endGame(false);
  }

  // Turn off ON buildings, largest cost first, until load is back within supply.
  private shedToFit(load: number, supply: number) {
    const mult = gameState.costMultiplier;
    const on = this.buildings
      .filter((b) => b.powered)
      .sort((a, b) => costForSize(b.size, mult) - costForSize(a.size, mult));
    let cur = load;
    for (const b of on) {
      if (cur <= supply) break;
      cur -= b.cost(mult);
      b.forceOff();
    }
  }

  private updatePeople(dt: number) {
    for (const person of [...this.people]) {
      if (person.state === "walking") {
        // Owls (professors) and owlets (students) have separate base speeds.
        const base = person.kind === "professor" ? TUNING.speed.owl : TUNING.speed.owlet;
        // Positional bonus: faster while physically on a speedBonus walkway.
        const onWalkway = walkwaySpeedFactor(person.pos, CAMPUS.walkways, TUNING.walkway.speedBonus);
        const speed = base * gameState.walkwayMultiplier * onWalkway;
        // Water is a soft hazard: owls wade through leaks at a reduced fraction of their adjusted speed.
        const inWater = this.leaks.some((l) => l.contains(person.pos));
        const hazard = inWater ? TUNING.water.waterHazardWalkingFactor : 1;
        this.advance(person, speed * hazard * dt);
      } else if (person.state === "waiting" || person.state === "atDoor") {
        person.idle(); // stand still (facing last direction) while stuck/waiting
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
      // Reached the end of the drawn path. Did the player steer the owl into one
      // of its destination's entrance boxes (within a small snap margin)?
      const b = this.buildingById.get(person.destId)!;
      if (b.entranceContains(person.pos, TUNING.draw.commitSnapDist)) {
        if (b.accepts(this.brownout)) this.deliver(person);
        else person.state = "atDoor"; // right door, but no power — wait for it
      } else {
        person.state = "waiting"; // missed the entrance — wait, draining patience
      }
    }
  }

  private updateDrones(dt: number) {
    const dist = TUNING.speed.drone * dt;
    for (const drone of this.drones) {
      if (drone.state === "enroute" || drone.state === "returning") {
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
          // Reached the path end: a returning drone parks (idle) at the dock; an
          // enroute drone starts fixing if it snapped to a leak, else idles.
          drone.state = drone.state === "returning" ? "idle" : drone.target ? "fixing" : "idle";
        }
      } else if (drone.state === "fixing") {
        drone.fixElapsed += dt;
        drone.sprite.setAngle(drone.sprite.angle + 12); // spin while working
        if (drone.fixElapsed >= TUNING.water.reductionTime) {
          this.clearLeak(drone.target!);
          drone.sprite.setAngle(0);
          drone.returnHome(); // fly back to the dock instead of idling at the leak
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
    // Payout scales with how satisfied the owl is on arrival (remaining patience).
    const sat = person.satisfaction;
    const pay = payForSatisfiedDelivery(person.kind, sat);
    gameState.money += pay;
    gameState.reputation = Math.min(
      TUNING.reputation.start,
      gameState.reputation + TUNING.economy.deliveryRepRefund
    );
    EventBus.emit(EV.personDelivered, person.kind);
    // Colour the payout by satisfaction so happy (green) vs. grumpy (red) reads at a glance.
    const color = sat > 0.66 ? "#34d399" : sat > 0.33 ? "#fbbf24" : "#f87171";
    this.floatText(person.sprite.x, person.sprite.y, `+$${pay}`, color);
    this.popEffect(person.sprite.x, person.sprite.y, 0x34d399);
    this.removePerson(person);
  }

  private rageQuit(person: Person) {
    person.state = "done";
    gameState.reputation -= TUNING.reputation.studentLeavePenalty;
    EventBus.emit(EV.personRageQuit);
    this.floatText(person.sprite.x, person.sprite.y, "😠", "#f87171");
    this.popEffect(person.sprite.x, person.sprite.y, 0xf87171);
    this.removePerson(person);
    if (gameState.reputation <= 0) this.endGame(false);
  }

  private clearLeak(leak: Obstruction) {
    this.leaks = this.leaks.filter((l) => l !== leak);
    gameState.money += payForRepair();
    this.floatText(leak.x, leak.y, `+$${payForRepair()}`, "#63b3ed");
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

  // Lightning bolt from the HUD power meter to a building just powered ON —
  // sells that the click just pulled from the shared factory supply. Strobes a
  // few times with a fresh jagged path each flash so it's easy to catch.
  private zapEffect(to: Vec) {
    const { powerSource, zap } = TUNING.fx;
    const from = powerSource;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len; // unit normal, for perpendicular jag
    const ny = dx / len;

    const g = this.add.graphics().setDepth(42).setAlpha(zap.alpha);
    // Redraw the bolt with a new random jag — called on each flicker so the arc
    // dances rather than sitting still.
    const strike = () => {
      g.clear();
      g.lineStyle(zap.width, zap.color, 1);
      g.beginPath();
      g.moveTo(from.x, from.y);
      for (let i = 1; i < zap.segments; i++) {
        const t = i / zap.segments;
        const off = (Math.random() * 2 - 1) * zap.jitter;
        g.lineTo(from.x + dx * t + nx * off, from.y + dy * t + ny * off);
      }
      g.lineTo(to.x, to.y);
      g.strokePath();
    };
    strike();

    // Each flicker = one full alpha down-and-up cycle; redraw on the way back up.
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: zap.durationMs / (zap.flickers * 2),
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: zap.flickers - 1,
      onYoyo: strike,
      onComplete: () => g.destroy(),
    });
  }

  // Brief feedback when a building can't be powered on (over supply, no battery).
  private showNoPowerCue(b: Building) {
    const prev = b.rect.strokeColor;
    b.rect.setStrokeStyle(3, 0xef4444);
    this.time.delayedCall(400, () => b.rect.setStrokeStyle(2, prev));
    this.floatText(b.def.x, b.def.y - b.def.h / 2, "⚡✕ no power", "#f87171");
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
  get powerLoad() {
    return this.currentLoad;
  }
  get powerSupply() {
    return gameState.supply;
  }
  get batteryCharge() {
    return gameState.battery.charge;
  }
  get batteryCapacity() {
    return gameState.battery.capacity;
  }
}
