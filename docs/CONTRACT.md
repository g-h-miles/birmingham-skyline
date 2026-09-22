# CONTRACT — birmingham-skyline

## Goal

Birmingham's skyline hand-inks itself as a cartoon footer: the page is a blank sheet of paper with a
Start button; pressing it runs one ~13 s shot in which a ground line sweeps across the bottom of the
screen and the city's landmarks draw themselves on in a travelling pen, finish with clouds, birds, two
cars and a bold serif "Birmingham", then hold.

Subject sentence (brief of 0): *"Watch Birmingham's skyline get drawn, line by inked line, along the
footer of a blank page."*

## Adaptation of the procedural-film pipeline

This ships a page, not a vertical film. Deliberate deviations, all recorded here:

- **Plate**: 1920×560 landscape footer instead of 1080×1920. One continuous shot — a footer must not
  cut — so no shared-geometry tables and no plate alternation.
- **No schematic shots, no music, no mp4**: the deliverable is `index.html`. `tools/snap.cjs` is used
  as the eyeball gate in place of critic waves.
- **Look** comes from the two reference drawings the brief supplied (Desktop screenshots
  2026-09-21 8.21.31/8.21.43 PM): thin ink line-art skyline on pale ground, one heavy ground rule,
  small round trees, scalloped clouds with trailing dashes, `+` and `o` doodles, big serif wordmark.
- **House style kept**: FILM engine, beat grid, hand-inked `inkPath` with boil, paper plate + grain,
  determinism rules in `docs/art-bible.md`.

## Law

- Scene code draws only from `(t, info)`; randomness only from seeded `LIB.rng`/`LIB.hash`.
- `FILM.registry` ids must match `FILM.TIMELINE.shots[].id`.
- The page (`index.html` + `src/page.js`) is the player; it must work from `file://` and over http.
