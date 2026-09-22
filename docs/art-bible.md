# Art bible — birmingham-skyline footer

Sections 1–2 replace the film defaults; everything else follows the procedural-film house style
(flat colour, tone from hatching, hand-inked `inkPath`, determinism). The page plate is
transparent (no paper, no grain); only tools render on paper for review.

## 1. Frame

1920 × 560 logical px. Ground rule at **y = 432**, x from 24 to 1896. Caption band y 444–556.
Skyline occupies y 90–432; nothing readable in the outer 24 px margins.

### 1.1 Composition

One continuous, dense band: buildings shoulder-to-shoulder with 10–30 px overlaps so the skyline
reads as a single contour (reference 2, Desktop screenshot 2026-09-21 8.21.43 PM). Heights swing
low→high twice across the band; the statue column (x≈1476) is the tallest peak. The sky is clean —
trees, clouds, cars and doodles from reference 1 were tried and removed in favour of the
reference-2 look.

## 2. Palette (subject, section 2.2 replacement)

Line-art discipline from the references: ink only, no fills, no colour accents on buildings.

| Name | Hex | Use |
|---|---|---|
| paper | #EFE3C9 | tools-review plate only |
| ink | #2A1C13 | ground rule, building outlines, wordmark |
| inkSoft | #5B4331 | windows, lattice, detail strokes |
| inkFaint | #8A735C | ghost slabs behind the band, fluting |

### 2.1 Pen weights

| Element | width |
|---|---|
| ground rule | 2.4 |
| building outline | 2.4 (uniform — the band shares one voice) |
| windows / lattice | 1.4 (inkSoft) |
| domes, urns, finials, statues | 1.6–2 |
| ghost slabs | 1.4 (inkFaint) |

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
