# Make Campus Control mobile-friendly

## Context

Campus Control is a Phaser 3 game with a fixed **960×600 landscape** design, scaled with
`Phaser.Scale.FIT` + `CENTER_BOTH`. The core interaction (tap a person/drone, drag a path,
release) is already pointer-based, so touch *mostly* works. But several things block or
degrade mobile play:

- **No touch pause/menu access** — pause/Manual is opened only via the `ESC` key
  ([GameScene.ts:253](../game/src/scenes/GameScene.ts#L253)). On a phone there is no way to
  pause, restart, or quit mid-run.
- **Browser gestures hijack drawing** — canvas has no `touch-action: none`; the viewport
  meta allows pinch/double-tap zoom and pull-to-refresh, which interrupt a drag-route.
- **Tiny tap targets** — people/drones are small sprites tapped by their default sprite
  bounds ([Person.ts:38](../game/src/entities/Person.ts#L38),
  [Drone.ts:26](../game/src/entities/Drone.ts#L26)); at FIT scale on a phone they're hard to hit.
- **Not "near full-screen"** — no fullscreen control, and no orientation handling (portrait
  gives heavy letterboxing on a landscape board).
- **No automated mobile test gate** — only Vitest unit tests of pure `systems/` logic exist;
  there is no browser/e2e infrastructure.

Goal: the game is comfortably playable on a phone in near full-screen, landscape-prompted,
and every future change is gated by an automated mobile (touch + mobile-viewport) test in CI.

**First step: create and work on a new branch `mobile-friendly`.**

## Changes

### 1. Viewport + touch CSS — [game/index.html](../game/index.html)
(Edit the source `game/index.html` only; `game/dist/index.html` is generated — do not touch.)
- Viewport meta → `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
- Add to `html, body`: `overscroll-behavior: none; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent;`
- Add `touch-action: none;` to `#game` and `#game canvas`.
- Add a **portrait "rotate device" overlay** DOM element (`#rotate-overlay`) with CSS that
  shows it only `@media (orientation: portrait)` and hides `#game` behind it. This gives an
  immediate visual gate on every scene (menu included) with zero Phaser coupling.

### 2. Pause the sim while portrait — small helper wired in [game/src/main.ts](../game/src/main.ts)
- Add `game/src/systems/orientation.ts` (or inline in `main.ts`): use
  `window.matchMedia("(orientation: portrait)")` to pause `Game` + `HUD` when the device
  rotates to portrait and resume when it returns to landscape. Track a "we paused it" flag so
  it never resumes a game the Shop/Manual overlay had already paused. This keeps patience
  timers from advancing behind the rotate overlay.

### 3. Scale config — [game/src/config.ts](../game/src/config.ts)
- Keep `FIT` + `CENTER_BOTH` (correct for the landscape-prompt approach).
- Add `scale.expandParent: true` and `input: { activePointers: 2 }` (robust single-drag on
  touch even if a second finger lands).

### 4. On-screen Pause + Fullscreen buttons — [game/src/scenes/HUDScene.ts](../game/src/scenes/HUDScene.ts)
HUD is the always-on overlay during gameplay, so buttons belong here.
- **Pause/menu button** (top-right): mirrors the ESC handler —
  `this.scene.pause("Game"); this.scene.launch("Manual");`. Keep the ESC handler for desktop.
  (Manual's existing `close()` already does `resume("Game")`.)
- **Fullscreen toggle button**: `this.scale.toggleFullscreen()` (a tap is a valid user
  gesture for the Fullscreen API) — delivers the "near full-screen" requirement.
- Also add a Fullscreen button to [MenuScene.ts](../game/src/scenes/MenuScene.ts) so players can
  go fullscreen before starting. Reuse the existing `makeButton` text-button pattern.

### 5. Bigger touch hit areas — [game/src/entities/Person.ts](../game/src/entities/Person.ts), [game/src/entities/Drone.ts](../game/src/entities/Drone.ts)
- Give both a padded circular hit area:
  `setInteractive(new Phaser.Geom.Circle(cx, cy, TUNING.touch.hitRadius), Phaser.Geom.Circle.Contains)`
  so small sprites are tappable/draggable on a phone. Buildings are already large.

### 6. Tuning knobs — [game/src/data/tuning.ts](../game/src/data/tuning.ts)
Per repo convention (all magic numbers live in `TUNING`), add:
- `touch: { hitRadius: <px> }` used by Person/Drone hit areas.

### 7. Copy tweak — [game/src/scenes/MenuScene.ts](../game/src/scenes/MenuScene.ts)
- "press any key to boot" → "tap or press any key" (tap already works there).

### 8. Playwright mobile e2e gate (the required test path)
- Add devDep `@playwright/test`; add `game/playwright.config.ts` with a **mobile project**
  (`devices["Pixel 5"]` — `hasTouch: true`, mobile viewport) plus a `webServer` that runs the
  built preview (`npm run build` output via `npm run preview`, or `vite preview`).
- Add `game/e2e/mobile.spec.ts` smoke tests using touch emulation:
  - App boots, `<canvas>` is present, no console errors.
  - Portrait viewport → `#rotate-overlay` visible; landscape → hidden.
  - Tap boots Menu → Game; HUD **Pause** button opens the Manual overlay.
  - A touch drag on the canvas is accepted (path draw doesn't throw / canvas still live).
    (Assert on reachable DOM/canvas state + absence of errors rather than internal sim state.)
- `package.json` scripts: `"test:e2e": "playwright test"`.
- CI: in [.github/workflows/ci.yml](../.github/workflows/ci.yml) add steps after `npm ci`:
  `npx playwright install --with-deps chromium` then `npm run test:e2e` — so **PRs/branches
  fail if mobile breaks**. (Leave the deploy workflow's existing unit+build gate as-is, or
  mirror the e2e step there too.)
- Document the gate in [CLAUDE.md](../CLAUDE.md): a short "Mobile" note stating changes must pass
  `npm run test:e2e` and how to run the mobile checks.

## Verification

1. `cd game && npm install` (pulls Playwright), then `npm test` — existing unit tests still pass.
2. `npm run build` — bundle builds clean.
3. `npm run test:e2e` — mobile Playwright suite passes locally (Chromium mobile emulation).
4. Manual real-device / responsive check: `npm run dev -- --host`, open on a phone (or browser
   device-toolbar). Confirm in **landscape**: near full-screen, fullscreen button works, can
   tap a person and drag a route, Pause button opens Manual, buildings toggle. In **portrait**:
   rotate overlay shows and the sim is paused.
5. Push branch; confirm CI runs unit + build + e2e and is green.
