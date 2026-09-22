# Birmingham draws itself

A blank page with a **Start** button. Press it and a dense shoulder-to-shoulder band of Birmingham
landmarks hand-inks itself along the footer: a thin ground rule sweeps across, then a travelling
pen draws nineteen overlapping buildings one stroke-pass at a time — cupola and turret-cluster
domes, a colonnaded classical front, Gothic spires (one flying a flag), clock towers, a gabled
terrace, the statue column with its raised-arm figure towering over the row, and the Colmore block
with its two corner orbs — closing under a light-tracked **BIRMINGHAM**.

The footer canvas is a **transparent plate**: the engine's paper background and grain are switched
off (`FILM.transparent`, `post: false`), so the ink sits directly on whatever background your page
shows — no seam.

Made with the [procedural-film](https://github.com/g-h-miles/skills/tree/main/skills/procedural-film)
pipeline — every pixel is computed in plain browser JavaScript from the FILM engine (no images, no
SVG, no CSS animation), on a 100 bpm beat grid.

![the finished footer](media/screenshot.png)

## Run it

Just open `index.html` — no build, no dependencies:

```
open index.html
```

or serve the folder: `python3 -m http.server` and visit the printed URL.

## Layout

```
index.html            the page: Start button + footer canvas
src/core.js           FILM runtime: registry, timeline reader, renderFrame, grain post
src/lib.js            hand-ink primitives (inkPath, hatching, rng, easing)
src/timeline.js       the beat grid: bpm 100, one 13.2 s footer shot
src/scenes/01-skyline.js   all skyline geometry, built once, drawn from (t) only
src/page.js           the footer player (start / replay / reduced-motion)
tools/                the film toolchain: snap.cjs renders frames, pagecheck.cjs tests the page
docs/                 contract, art bible, storyboard
```

## Tooling (optional)

```
cd tools && npm install
node tools/snap.cjs --shot skyline --samples 8 --sheet   # contact sheet into .frames/
node tools/pagecheck.cjs                                 # headless page test
```

MIT — see LICENSE.
