# Campus Control

An ATC-style Rice-campus logistics game. Free-draw walking paths to route arriving people
(professors/students) from gates to buildings, toggle building power against a finite kWh
reserve, and direct drones to repair water leaks that block paths. Wave-based, with a
between-wave shop. **You lose when reputation hits 0** — not by collision.

Built with **Phaser 3 + TypeScript + Vite**.

🎮 **Play:** https://thedavidhanks.github.io/vivid-vision-sam-e/

## Repository layout

- Root — design documents (`vivid-vision_*.md`) and `resources/` art assets.
- [`game/`](game/) — the game itself. **All build/test commands run from `game/`.**

## Quick start

```bash
cd game
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm test           # vitest run (one-shot)
npm run test:watch # vitest watch mode
npm run build      # static bundle to game/dist/
npm run preview    # serve the production build
```

Requires **Node 24** (pinned in [`.nvmrc`](.nvmrc)). Run a single test file with
`npm test -- power`; a single case with `npm test -- -t "clamps to capacity"`.

## Dev container (recommended)

A [dev container](.devcontainer/devcontainer.json) reproduces the CI environment
(Linux + Node 24) and ships with the gcloud CLI and Claude Code preinstalled.

**Prerequisites:** Docker Desktop running, and VS Code with the **Dev Containers** extension.

Open the Command Palette → **Dev Containers: Reopen in Container**. The first build installs
dependencies automatically (`cd game && npm ci`); the Vite port (5173) is forwarded for you.

### One-time Claude Code + Vertex AI auth

The container presets `CLAUDE_CODE_USE_VERTEX=1` and `CLOUD_ML_REGION=global`. You provide
your Google Cloud credentials and project once — both persist in named volumes across
container rebuilds.

```bash
# 1. Authenticate Application Default Credentials (prints a URL to open in your browser).
gcloud auth application-default login --no-launch-browser

# 2. Point gcloud at your project (Claude Code reads the project ID from here).
gcloud config set project YOUR_GCP_PROJECT_ID

# 3. Start Claude Code.
claude
```

The project ID is intentionally **not** committed (this is a public repo). If you prefer an
explicit value over `gcloud config`, set `ANTHROPIC_VERTEX_PROJECT_ID` in your shell or a
local, uncommitted env file — it takes precedence.

## Architecture

See [CLAUDE.md](CLAUDE.md) for a full tour. In brief:

- **Scenes** (`game/src/scenes/`) — `Boot → Preload → Menu → Game`, with `HUD` as a parallel
  overlay and `Shop` between waves. `GameScene` owns all live entities and the per-frame
  simulation.
- **State** (`game/src/state/`) — a shared `gameState` holds run-level scalars; an app-wide
  `EventBus` decouples gameplay from UI.
- **Pure systems** (`game/src/systems/`) — power, economy, geometry, and path-drawing logic
  with no Phaser import, unit-tested in isolation (`game/test/`).
- **Balance data** (`game/src/data/`) — every tunable knob (tuning, waves, upgrades, campus
  map) lives in data, not code.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds `game/` and publishes to GitHub Pages. Pull requests and feature branches run
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) (tests + build) before merge. Both use
the Node version pinned in [`.nvmrc`](.nvmrc).
