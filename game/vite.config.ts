import { defineConfig } from "vite";

// base: "./" makes the built bundle path-relative so it can be dropped on ANY
// static host (GitHub Pages, Cloudflare Pages, an S3 bucket, or a local folder)
// without knowing the deploy URL up front.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2020",
  },
  // host: true binds 0.0.0.0 so the dev server is reachable through the dev
  // container's forwarded port (see .devcontainer/devcontainer.json).
  server: {
    host: true,
    port: 5173,
  },
});
