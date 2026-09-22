# Art bible — birmingham-skyline footer

Sections 1–2 replace the film defaults; everything else follows the procedural-film house style
(flat colour, tone from hatching, hand-inked `inkPath`, determinism). The page plate is
transparent (no paper, no grain); only tools render on paper for review.

## 1. Frame

1920 × 676 logical px. Ground rule at **y = 556**, x from 24 to 1896. Caption band y 576–670.
Skyline occupies y 44–556 (buildings fill ~90% of the band, like the reference); nothing readable
in the outer 24 px margins.

### 1.1 Composition

Two depth planes. The BACK plane is tall silhouettes; the FRONT plane is a continuous wall of
detailed architecture that **knocks clean sticker margins out of the backs** (destination-out
silhouette fills). Front masses touch or overlap; the reference has no gaps at the ground line.

## 2. Palette (subject, section 2.2 replacement)

Line-art discipline from the reference: pale hairline ink only, no fills, no colour accents.

| Name | Hex | Use |
|---|---|---|
| paper | #EFE3C9 | tools-review plate only (page plate is transparent) |
| ink | #2A1C13 | ground rule, wordmark |
| inkSoft | #5B4331 | all structural outlines (LINE) |
| inkFaint | #8A735C | panes, grids, braces, pinstripes (PANE) |

### 2.1 Pen weights

| Element | width |
|---|---|
| ground rule | 2.6 (ink) |
| building outline | 1.9–2.2 (inkSoft) |
| panes / small squares | 1.0–1.2 (inkFaint) |
| domes, lunette, arcade arches | 1.3–1.6 |
| statue | 1.6 |
| mast lattice | 0.8–1.3 (inkFaint) |

## 3. Subject reference (drawable elements)

Two depth planes. BACK plane (drawn first, thinner/simpler): BT-style lattice mast (x≈300); the
ONE dense-grid slab (652-788); the hero orb tower — pediment + two corner orbs + banded window
grid (940-1120); the Gothic octagonal spire with corner pinnacles (1224-1282); the pinstripe slab
(1330-1448); the plain monolith right edge (1810-1872).

FRONT plane (drawn later, each KNOCKS its silhouette out of the backs — sticker overlaps):
broad classical office with roof blocks, arched clerestory row, sparse panes, tall arched door
(52-350); stepped Art Deco cupola tower with dome, ball, needle (356-496); gabled tower with arched
dome (500-608); THE STATION centrepiece — twin domed drum towers with arcades, pedimented central
facade with lunette, three arched entrances, wide hatched staircase (608-904); gabled Gothic church
— rose window, corner spirelets, pointed door, side aisle (928-1144); broad slab with horizontal
floor bands + tall three-door base (1158-1372); Art Deco tower with balustrade frieze topped by a
standing statue with raised arm (1462-1618); low closing arcade (1628-1782).

- **Windows** are sparse individual panes (small rects, ~11×16 px, inkSoft 1.2) on mostly blank
  walls — NOT lattices covering every facade. Only ONE dense grid and ONE pinstripe building.
- **Tone from hatching** — the station staircase is the only shaded area.
- **Wordmark** — "BIRMINGHAM" caps, Georgia/serif regular ~60 px, letter-spacing ~30 px, ink at
  0.85 alpha, wipe-in.

### Mistakes to avoid

- Repeating a texture across buildings → each mass gets ONE signature; neighbours differ.
- Buildings merely standing next to each other → fronts must knock out backs where they overlap.
- Equal widths / even rhythm → widths swing 80 px to 300 px.
- Filled shapes → house rule: tone from hatch only (the staircase).
- Rigid geometry → outlines go through `inkPath` wobble; panes stay crisp.
- Caption competing with skyline → it sits alone below the ground rule.
- Windows before the outline exists → pen draws outline first, panes second, crown last.
