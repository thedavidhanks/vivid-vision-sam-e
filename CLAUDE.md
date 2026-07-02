# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo holds design documents at the root (`vivid-vision_*.md` — "vivid-vision" narrative design docs) and the actual game under [game/](game/). **All build/test commands run from `game/`, not the repo root.**

## Commands

```bash
cd game
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm test           # vitest run (one-shot)
npm run test:watch # vitest watch mode
npm run build      # static bundle to game/dist/
npm run preview    # serve the production build
```

Run a single test file: `npm test -- power` (matches `test/power.test.ts`). Run one case: `npm test -- -t "clamps to capacity"`.

## Stack

Phaser 3 + TypeScript + Vite. `base: "./"` in [vite.config.ts](game/vite.config.ts) keeps the bundle path-relative so `dist/` runs from any static host or local folder with no backend.

## The game

Campus Control — an ATC-style Rice-campus logistics game. The player free-draws walking paths to route arriving people (professors/students) from gates to buildings, toggles building power against a finite kWh reserve, and directs drones to repair water leaks that block paths. It is wave-based with a between-wave shop. **You lose by reputation hitting 0** (people rage-quit or brownouts drain rep), not by collision.

## Architecture

**Scene flow** (registered in [config.ts](game/src/config.ts)): `Boot → Preload → Menu → Game`. `Game` runs `HUD` as a parallel overlay scene, `Shop` as a paused-over overlay between waves, and hands off to `End` on win/lose.

**State ownership is deliberately split:**
- [state/GameState.ts](game/src/state/GameState.ts) — a single shared `gameState` instance holds run-level scalars only (money, reputation, waveIndex, power, purchased upgrades). Upgrade effects are exposed as derived getters (`walkwayMultiplier`, `lightDrawMultiplier`, `droneBonus`).
- [scenes/GameScene.ts](game/src/scenes/GameScene.ts) — owns all live entities (people, drones, leaks, buildings) and the per-frame simulation. This is the heart of the game; the main `update()` loop drives power → people → drones → spawns → wave-end checks.
- [state/EventBus.ts](game/src/state/EventBus.ts) — an app-wide `Phaser.Events.EventEmitter`. GameScene **emits** typed events (names in [state/events.ts](game/src/state/events.ts)); HUD/other scenes subscribe. This keeps gameplay and UI decoupled.

**HUD reads, doesn't listen, for continuous values.** [scenes/HUDScene.ts](game/src/scenes/HUDScene.ts) polls `gameState` plus a set of read-only getters on GameScene (`activePeople`, `waveNumber`, `isBrownout`, etc.) each frame, rather than threading events for values that change every tick. Events are reserved for discrete moments (delivery, rage-quit, wave cleared).

**Pure, Phaser-free systems are unit-tested in isolation:**
- [systems/power.ts](game/src/systems/power.ts) — `stepPower()` advances the kWh reserve; brownout = reserve dry AND demand > supply. Covered by [test/power.test.ts](game/test/power.test.ts).
- [systems/economy.ts](game/src/systems/economy.ts) — delivery payouts and affordability. Covered by [test/economy.test.ts](game/test/economy.test.ts).
- [systems/geometry.ts](game/src/systems/geometry.ts) — `pathHitsCircle` for leak-vs-path collision.
- [systems/pathDraw.ts](game/src/systems/pathDraw.ts) — `DrawController` captures the free-draw polyline and renders a live preview; GameScene owns commit + validation.

**All balance lives in data, not code.** [data/tuning.ts](game/src/data/tuning.ts) holds every scalar knob (speeds, patience, payouts, brownout drain, draw thresholds). Per-wave difficulty is [data/waves.ts](game/src/data/waves.ts); shop items and their `unlockWave` gating are [data/upgrades.ts](game/src/data/upgrades.ts); the map (buildings, doors, gates, per-building `drawRate`/`requiresPower`) is [data/campus.ts](game/src/data/campus.ts). Shared interfaces are in [data/types.ts](game/src/data/types.ts). **Prefer changing these files over hardcoding values in scenes/entities.**

## Conventions

- Gameplay reads all magic numbers from `TUNING` — when adding a mechanic, add its knob to [data/tuning.ts](game/src/data/tuning.ts) rather than inlining constants.
- Keep new game logic that can be pure (math, geometry, economy) in `systems/` with no Phaser import, so it stays unit-testable; keep rendering/input in scenes and entities.
- Upgrades are strings in `gameState.upgrades`; their effect is a derived getter on `GameState` or a branch in `startWave` (see the `"grid"` handling) — follow that pattern for new upgrades.
