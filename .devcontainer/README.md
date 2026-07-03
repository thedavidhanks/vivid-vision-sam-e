# Dev Container

Runs the project in a Linux + Node 24 container that mirrors the GitHub Actions CI runner,
with Claude Code (via Google Vertex AI) and the gcloud CLI preinstalled.

## Prerequisites

- Docker Desktop running
- VS Code with the **Dev Containers** extension

## Open it

Command Palette → **Dev Containers: Reopen in Container**. On create, the container installs
game dependencies (`cd game && npm ci`).

`game/node_modules` is mounted from a Docker named volume rather than the host, so npm
work stays on the container's Linux filesystem — fast on WSL, and unaffected by anything
in `game/node_modules/` on the host. Run all `npm` commands from **inside** the container;
a host-side `npm install` writes to a directory the container never sees, and (on Windows)
can leave `.exe` files that would otherwise break the next `npm ci`. If a stale
`game/node_modules/` exists on the host, it's harmless but can be deleted to reclaim disk.

## Everyday use

```bash
cd game
npm run dev     # Vite dev server at http://localhost:5173 (forwarded automatically)
npm test        # vitest
npm run build   # static bundle to game/dist
```

## First-time Claude Code + Vertex AI auth

The container sets `CLAUDE_CODE_USE_VERTEX=1` and `CLOUD_ML_REGION=global`. You provide the
project and credentials once; both persist in named volumes across rebuilds.

```bash
# 1. Authenticate Application Default Credentials (prints a URL to open in your browser).
gcloud auth application-default login --no-launch-browser

# 2. Point gcloud at your project (Claude Code reads the project ID from here).
gcloud config set project YOUR_GCP_PROJECT_ID

# 3. Start Claude Code.
claude
```

The project ID is deliberately not committed (this is a public repo). If you prefer an
explicit value over `gcloud config`, set `ANTHROPIC_VERTEX_PROJECT_ID` in your shell or a
local, uncommitted env file — it takes precedence.
