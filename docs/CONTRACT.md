# CONTRACT — birmingham-skyline

## Goal

Birmingham's skyline hand-inks itself as a cartoon footer: the page is a blank sheet with a
Start button; pressing it runs one ~13 s shot in which a thin ground line sweeps across the bottom
of the screen and a dense band of nineteen overlapping landmark buildings draws itself in by a
travelling pen, closing under a light-tracked serif **BIRMINGHAM**, then holds. The footer plate is
transparent so the ink blends onto whatever background the page shows.

Subject sentence (brief of 0): *"Watch Birmingham's skyline get drawn, line by inked line, along the
footer of a blank page."*

## Adaptation of the procedural-film pipeline

This ships a page, not a vertical film. Deliberate deviations, all recorded here:

- **Plate**: 1920×560 landscape footer instead of 1080×1920. One continuous shot — a footer must not
  cut — so no shared-geometry tables and no plate alternation.
- **Transparent plate on the page**: `FILM.transparent = true` before mount makes the canvas an alpha
  context, skips core's black under-fill, and the scene skips the paper fill; `shot.post: false` drops
  the grain. The ink blends onto whatever background the host page shows. `tools/snap.cjs` still renders
  on the paper plate for review.
- **No schematic shots, no music, no mp4**: the deliverable is `index.html`. `tools/snap.cjs` is used
  as the eyeball gate in place of critic waves.
- **Look** comes from the two reference drawings the brief supplied (Desktop screenshots
  2026-09-21 8.21.31/8.21.43 PM), currently following the second: one dense overlapping band of
  uniform thin ink lines, cupolas, pediments, Gothic spires, a gabled terrace, a statue column as
  the tallest peak, a thin ground rule, light wide-tracked serif caps underneath.
- **House style kept**: FILM engine, beat grid, hand-inked `inkPath` with boil, determinism rules in
  `docs/art-bible.md`. (The paper plate + grain post are switched off on the page — see above.)

## Law

- Scene code draws only from `(t, info)`; randomness only from seeded `LIB.rng`/`LIB.hash`.
- `FILM.registry` ids must match `FILM.TIMELINE.shots[].id`.
- The page (`index.html` + `src/page.js`) is the player; it must work from `file://` and over http.
