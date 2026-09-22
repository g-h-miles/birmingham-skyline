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

Two depth planes. BACK plane (drawn first): the ONE dense-grid slab (560-700); the hero orb tower
— pediment, two corner balls, twin pane columns and a tall central ogee light (880-1130); the
canopied Gothic spire (1180-1260); the broad slab of dense HORIZONTAL floor lines stepping down
right (1280-1500); the two VERTICAL-BANDED towers — A with square caps, three banded lights and a
five-vertical base entrance (1516-1608), B lower with one light and pane runs (1620-1684); the slim
lattice mast (≈420); THE VULCAN (1686-1746); the plain monolith (1752-1782).

FRONT plane (each KNOCKS its silhouette out of the backs — sticker overlaps): broad classical
office with parapet blocks, arched clerestory row, dense pane wall, ground arcade and double portal
(40-405); domed monument with small crowning figure, pilaster bands and twin-height stepped shaft
(418-576); baroque-crowned gable tower (586-688); THE ROMANESQUE CHURCH centrepiece — twin DOMED
drum towers with two arcade tiers, pedimented facade with great lunette, three arched entrances,
wide hatched staircase (680-1070); the GOTHIC church — two steep crocketed gables, needle
spirelets with balls, canopied perpendicular TRACERY light, triple pointed portal, sloped aisle
with paired lancets (1108-1368); the low annex with dash cornice and door (1604-1698).

### THE VULCAN — the strip's hero, measured from the picture

A solid ~110 px figure standing on a denticulated cornice atop a slim shaft tower: striding legs,
drapery flap over the hips, broad brawny torso, head with beard hint, RIGHT ARM RAISED OVERHEAD
holding a small tilted TABLET, left arm bent with a hammer at the hip. He is the tallest element at
this end and reads first. Never demote him to a stick figure on a block, and never bury him — the
picture gives him clear sky.

- **Windows** are sparse individual panes (small rects ~7×9 px, inkFaint 1.0) on mostly blank
  walls — NOT lattices covering every facade. Only ONE dense grid, ONE horizontal-line slab, ONE
  pair of banded towers; no texture repeats across neighbours.
- **Tone from hatching** — the church staircase is the only shaded area.
- **Wordmark** — "BIRMINGHAM" caps, Georgia/serif regular ~60 px, letter-spacing ~30 px, ink at
  0.9 alpha, wipe-in.

### Mistakes to avoid

- Inventing domes where the picture has flat, stepped, line-banded or plain tops — the right
  cluster is Banded / Vertical / Statuesque / Plain, four distinct textures.
- A rose window on the Gothic church — the picture shows a pointed perpendicular tracery light.
- Repeating a texture across buildings → each mass gets ONE signature; neighbours differ.
- Buildings merely standing next to each other → fronts must knock out backs where they overlap.
- Equal widths / even rhythm → widths swing 60 px to 400 px; the picture's buildings overlap
  heavily with clean margins between them.
- Filled shapes → house rule: tone from hatch only (the staircase).
- Rigid geometry → outlines go through `inkPath` wobble; panes stay crisp.
- Caption competing with skyline → it sits alone below the ground rule.
- Windows before the outline exists → pen draws outline first, panes second, crown last.
