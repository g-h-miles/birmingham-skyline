# Art bible — birmingham-skyline footer

Sections 1–2 replace the film defaults; everything else follows the procedural-film house style
(flat colour, tone from hatching, hand-inked `inkPath`, boiling grain at 12 fps, determinism).

## 1. Frame

1920 × 560 logical px. Ground rule at **y = 432**, x from 24 to 1896. Caption band y 460–556.
Skyline occupies y 40–432; nothing readable in the outer 24 px margins.

### 1.1 Composition

Left→right skyline reading like the references: a dense row of landmark silhouettes sharing the one
ground rule, small round trees between them, doodle sky above, the wordmark centred below.
The two tallest accents (BT mast ≈ y 70, Chamberlain statue ≈ y 45) sit at the left third and the
right edge, echoing reference 2.

## 2. Palette (subject, section 2.2 replacement)

Line-art discipline from the references: ink on paper, no fills, no colour accents on buildings.

| Name | Hex | Use |
|---|---|---|
| paper | #EFE3C9 | plate (house) |
| ink | #2A1C13 | ground rule, foreground outlines, wordmark |
| inkSoft | #5B4331 | windows, detail strokes |
| inkFaint | #8A735C | back-row towers only |

### 2.1 Pen weights

| Element | width |
|---|---|
| ground rule | 6 |
| landmark outline | 3.4 |
| back-row tower | 1.8 (inkFaint) |
| windows / lattice | 1.6 (inkSoft) |
| trees, clouds, doodles, cars | 2–2.4 |
| statue, mast | 2.2 |

## 3. Subject reference (drawable elements)

- **Rotunda** — squat cylinder, domed cap, one mast, grid of tiny square windows. NOT a round tower with round windows (that's the Gas Street gasholder silhouette, used in the back row).
- **Back-to-backs** — low terrace, two gable chimneys with pots, doors as ticks. NOT a high-rise.
- **BT Tower** — slim shaft, one flare deck near the top, thin mast with two cross ticks. NOT a spire.
- **Colmore hero block** (reference 1 centre) — broad flat-topped tower, triangular pediment between two corner orbs at the top, dense window lattice.
- **St Philip's Cathedral** — low block, central squat tower with ogee dome + ball, urn dots at corners, arched door. NOT a gothic spire.
- **New Street Station** — wide low façade with arcade arches, one big curved train-shed arc rising behind, clock dot. NOT a clock tower.
- **St Martin in the Bullring** — stepped square steeple, short spire, ball finial, one tall pointed window.
- **Library of Birmingham** — flat box of stacked offset ring shelves (3 cantilever lines overhanging), small circle windows in the bands. NOT a dome.
- **Chamberlain Memorial** — very slim fluted column on stepped base, small stick-figure statue with one raised arm at the top (reference 2 right edge). The statue is ~28 px tall, never a blob.
- **The Cube** — small tilted cube (hexagon + three inner edges) on a thin shaft.
- **Back row** — generic lattice towers in inkFaint peeking in the gaps, plus one gasholder (cylinder + dome arcs + cross-brash X ticks).
- **Trees** — trunk tick + single wobbled circle canopy, r 14–20. NOT leaf detail.
- **Clouds** — 2–4 scalloped arcs on a flat base line + one offset dash beneath (reference 1).
- **Doodles** — `+` crosses, small `o` circles, two-arc birds `‿‿`.
- **Cars** — tiny cartoon: cabin box on body line, two wheel circles, drawn fully, driving.
- **Wordmark** — "Birmingham", Georgia/serif bold ~96 px, letter-spacing ~12 px, ink. Revealed by a left→right wipe, not typed letter-by-letter.

### Mistakes to avoid

- Filled buildings → house rule: tone from hatch/lattice only.
- Rigid geometry → every line goes through `inkPath` wobble.
- Landmarks overlapping so their outlines tangle → keep ≥ 18 px gaps between neighbours.
- All buildings same height → heights must swing: 120, 340, 330, 190, 250, 300, 170, 360, 250-ish.
- Caption competing with skyline → it sits alone in the band below the ground rule.
- Windows before the outline exists → the pen draws each building outline first, lattice second.
