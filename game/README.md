# Campus Control

An ATC-style Rice campus logistics mini-game. Route professors (owls with grad caps) and
students (owlets with backpacks) to their buildings by **free-drawing** walking paths,
while managing a finite **kWh power budget**. Powered buildings accept people but drain the
reserve; water leaks block paths and must be repaired by **player-directed drones**. It's
wave-based with a between-wave shop. Fail is by **reputation** (too many people rage-quit),
not collision.

Built from the `sky-net` vivid-vision doc. Stack: **Phaser 3 + TypeScript + Vite**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (power + economy math)
npm run build    # outputs static site to dist/
npm run preview  # serve the production build locally
```

## Controls

- **Route a person:** click and drag from an owl/owlet to their destination building; release.
- **Power a building:** click it (amber = on, slate = off). Only some buildings need power.
- **Fix a leak:** click a drone and drag it onto the water leak.

## Deploy (cheap / free)

The build is a fully static bundle (`base: "./"`), so it runs from any static host or a
plain folder — no server, no backend.

- **Cloudflare Pages / GitHub Pages / Netlify** — free tier, drag-drop or `git push` the
  `dist/` folder. Recommended.
- **Local:** `npm run build` then serve `dist/` with `npx serve dist`.
- **AWS S3 + CloudFront** — works, pennies/month, more setup than the free options above.
