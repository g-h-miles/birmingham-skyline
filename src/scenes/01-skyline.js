// 01 skyline : Birmingham draws itself as a footer — reference-2 composition.
// A dense, shoulder-to-shoulder band of fine ink lines: landmarks overlap and share the skyline,
// domes, pediments, Gothic spires and a statue column, one thin ground rule, one light-tracked
// wordmark. Geometry is built once at load (seeded); draw() reads only (ctx, t).
// On the page the plate is transparent (FILM.transparent) so the ink sits on the page's own
// background; tools/snap renders with the paper plate for review.
(function () {
  'use strict';

  const ID = 'skyline';
  const LIB = FILM.lib;
  const PAL = LIB.pal;
  const TAU = Math.PI * 2;

  const W = 1920;
  const H = 560;
  const GY = 432; // the ground rule

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const seg = (t, a, b) => sstep(a, b, t);
  let SID = 1;
  const sd = (k) => (LIB.hash(ID, k, SID++) & 0x7fffffff) || 7;

  // ---------------------------------------------------------------------------
  // geometry helpers -> dense polylines
  // ---------------------------------------------------------------------------

  const STEP = 9;

  function ln(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / STEP));
    const p = [];
    for (let i = 0; i <= n; i++) p.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
    return p;
  }
  function arc(cx, cy, r, a0, a1) {
    const n = Math.max(3, Math.ceil((r * Math.abs(a1 - a0)) / STEP));
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return p;
  }
  function circle(cx, cy, r) {
    return arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5);
  }
  function poly(corners) {
    const p = [];
    for (let i = 0; i < corners.length - 1; i++) {
      const q = ln(corners[i][0], corners[i][1], corners[i + 1][0], corners[i + 1][1]);
      if (i > 0) q.shift();
      p.push.apply(p, q);
    }
    return p;
  }
  // a Gothic pointed arch, open at the bottom: apex at (cx, topY), springing at topY+hw
  function pointed(cx, topY, botY, hw) {
    return poly([[cx - hw, botY], [cx - hw, topY + hw], [cx, topY], [cx + hw, topY + hw], [cx + hw, botY]]);
  }
  // a dome sitting on a line at y: semicircle + finial
  function dome(cx, y, r, ball) {
    const s = [{ pts: arc(cx, y, r, Math.PI, TAU) }];
    if (ball) s.push({ pts: circle(cx, y - r - (ball + 2), ball), w: 1.8 });
    return s;
  }
  // row of arches along the ground
  function arches(centers, r) {
    return centers.map((x) => ({ pts: arc(x, GY, r, Math.PI, TAU), w: 1.8 }));
  }
  // short vertical ticks standing on a line (balustrades, roof combing)
  function ticks(x0, x1, y, h, n, o) {
    const S = [];
    for (let i = 0; i <= n; i++) S.push({ pts: ln(x0 + ((x1 - x0) * i) / n, y, x0 + ((x1 - x0) * i) / n, y - h), ...o });
    return S;
  }
  // window lattice: floor lines then column lines across [x0..x1] x [y0..y1]
  function lattice(x0, y0, x1, y1, rows, cols, rseed) {
    const r = LIB.rng(sd(rseed));
    const S = [];
    for (let i = 1; i <= rows; i++) {
      const y = y0 + ((y1 - y0) * i) / (rows + 1);
      S.push({ pts: ln(x0, y, x1, y), w: 1.4, c: PAL.inkSoft });
    }
    for (let j = 1; j <= cols; j++) {
      const x = x0 + ((x1 - x0) * j) / (cols + 1);
      if (r() < 0.12) continue; // a few columns skipped: hand-doodled charm
      S.push({ pts: ln(x, y0, x, y1), w: 1.4, c: PAL.inkSoft });
    }
    return S;
  }

  // ---------------------------------------------------------------------------
  // strokes and pen passes
  // ---------------------------------------------------------------------------

  function pass(strokes, o) {
    o = o || {};
    const list = [];
    for (const s of strokes) {
      if (!s || s.pts.length < 2) continue;
      const cum = new Float64Array(s.pts.length);
      for (let i = 1; i < s.pts.length; i++)
        cum[i] = cum[i - 1] + Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
      list.push({
        pts: s.pts,
        cum,
        len: cum[cum.length - 1],
        w: s.w != null ? s.w : o.w || 2.4,
        c: s.c || o.c || PAL.ink,
        seed: s.seed != null ? s.seed : sd(o.tag || 'p') + list.length,
      });
    }
    let total = 0;
    for (const s of list) total += s.len;
    return { strokes: list, total };
  }

  function trimStroke(st, f) {
    if (f >= 1) return st.pts;
    const target = st.cum[st.cum.length - 1] * f;
    const out = [];
    for (let i = 0; i < st.pts.length; i++) {
      if (st.cum[i] <= target) out.push(st.pts[i]);
      else {
        const a = st.pts[i - 1],
          b = st.pts[i];
        const u = (target - st.cum[i - 1]) / (st.cum[i] - st.cum[i - 1] || 1);
        out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
        break;
      }
    }
    return out.length >= 2 ? out : null;
  }

  function drawPass(ctx, P, u) {
    if (!(u > 0)) return;
    let budget = clamp01(u) * P.total;
    for (const st of P.strokes) {
      if (budget <= 0) break;
      const f = clamp01(budget / st.len);
      const pts = trimStroke(st, f);
      budget -= st.len;
      if (!pts) continue;
      LIB.inkPath(ctx, pts, {
        width: st.w,
        color: st.c,
        seed: st.seed,
        smooth: true,
        wobble: st.w >= 2 ? 1.5 : 1.1,
        tremble: 0.35,
        taper: [8, f >= 1 ? 18 : 1],
      });
    }
  }

  // ---------------------------------------------------------------------------
  // the plate: geometry built once
  // ---------------------------------------------------------------------------

  const OW = 2.4; // hero outline width — thin, uniform, like the reference

  // ---- ground rule: one thin line, not a slab
  const GROUND = pass([{ pts: ln(24, GY, 1896, GY), w: 2.4 }], { tag: 'grd' });

  // ---- faint back fill: a few slim ghosts peeking between the band's tops
  function ghost(x0, x1, top, tag) {
    return pass(
      [{ pts: ln(x0, GY, x0, top) }, { pts: ln(x1, GY, x1, top) }, { pts: ln(x0, top, x1, top) }].concat(
        [0.35, 0.6].map((f) => ({ pts: ln(x0, top + (GY - top) * f, x1, top + (GY - top) * f) }))
      ),
      { w: 1.4, c: PAL.inkFaint, tag }
    );
  }
  const ghosts = [
    { P: ghost(424, 452, 196, 'gA'), t0: 1.15 },
    { P: ghost(700, 728, 208, 'gB'), t0: 1.6 },
    { P: ghost(1102, 1128, 202, 'gC'), t0: 2.0 },
  ];

  // ---- the band: nineteen overlapping buildings, shoulder to shoulder, L->R
  const S = []; // {P, t0} built below in order

  // 1. gridded corner block with roof hut
  const b1 = pass(
    [
      { pts: ln(24, GY, 24, 232), w: OW },
      { pts: ln(148, GY, 148, 232), w: OW },
      { pts: ln(24, 232, 148, 232), w: OW },
      { pts: poly([[62, 232], [62, 210], [110, 210], [110, 232]]) },
      { pts: ln(86, 210, 86, 192), w: 1.8 },
      ...lattice(32, 244, 140, 418, 7, 6, 'b1'),
      { pts: arc(86, GY, 14, Math.PI, TAU), w: 1.8 },
    ],
    { tag: 'b1' }
  );

  // 2. cupola tower: drum, shallow dome, finial
  const b2 = pass(
    [
      { pts: ln(132, GY, 132, 205), w: OW },
      { pts: ln(224, GY, 224, 205), w: OW },
      { pts: ln(128, 205, 228, 205), w: OW },
      ...dome(178, 205, 26, 3.5),
      { pts: ln(164, 190, 164, 203), w: 1.4, c: PAL.inkSoft },
      { pts: ln(192, 190, 192, 203), w: 1.4, c: PAL.inkSoft },
      { pts: ln(136, 246, 220, 246), w: 1.6 },
      ...lattice(140, 254, 216, 418, 5, 4, 'b2'),
    ],
    { tag: 'b2' }
  );

  // 3. striped slab with stepped cap
  const b3 = pass(
    [
      { pts: ln(210, GY, 210, 150), w: OW },
      { pts: ln(302, GY, 302, 150), w: OW },
      { pts: ln(210, 150, 302, 150), w: OW },
      { pts: poly([[236, 150], [236, 132], [276, 132], [276, 150]]) },
      ...lattice(218, 164, 294, 418, 2, 5, 'b3'),
      { pts: ln(210, 300, 302, 300), w: 1.4, c: PAL.inkSoft },
    ],
    { tag: 'b3' }
  );

  // 4. Gothic spire with a small flag
  const b4 = pass(
    [
      { pts: ln(290, GY, 290, 240), w: OW },
      { pts: ln(352, GY, 352, 240), w: OW },
      { pts: ln(286, 240, 356, 240), w: OW },
      { pts: ln(290, 240, 321, 132), w: OW },
      { pts: ln(352, 240, 321, 132), w: OW },
      { pts: circle(321, 124, 3.2), w: 1.8 },
      { pts: ln(321, 121, 321, 96), w: 1.6 },
      { pts: poly([[321, 96], [342, 103], [321, 111]]), w: 1.6 },
      { pts: pointed(321, 268, 392, 15), w: 1.8 },
      { pts: ln(290, 320, 352, 320), w: 1.4, c: PAL.inkSoft },
      { pts: pointed(321, 402, GY, 11), w: 1.8 },
    ],
    { tag: 'b4' }
  );

  // 5. pediment tower with corner urns
  const b5 = pass(
    [
      { pts: ln(344, GY, 344, 176), w: OW },
      { pts: ln(458, GY, 458, 176), w: OW },
      { pts: ln(344, 176, 458, 176), w: OW },
      { pts: ln(340, 176, 401, 140), w: OW },
      { pts: ln(462, 176, 401, 140), w: OW },
      { pts: circle(348, 168, 4), w: 1.8 },
      { pts: circle(454, 168, 4), w: 1.8 },
      ...lattice(352, 192, 450, 418, 6, 5, 'b5'),
    ],
    { tag: 'b5' }
  );

  // 6. turret cluster: twin small domes flanking a taller central dome
  const b6 = pass(
    [
      { pts: ln(442, GY, 442, 214), w: OW },
      { pts: ln(548, GY, 548, 214), w: OW },
      { pts: ln(442, 214, 476, 214), w: OW },
      { pts: ln(514, 214, 548, 214), w: OW },
      { pts: arc(456, 214, 13, Math.PI, TAU), w: OW },
      { pts: arc(534, 214, 13, Math.PI, TAU), w: OW },
      { pts: ln(478, 214, 478, 196), w: OW },
      { pts: ln(512, 214, 512, 196), w: OW },
      { pts: ln(474, 196, 516, 196), w: OW },
      ...dome(495, 196, 17, 3),
      { pts: ln(486, 196, 486, 210), w: 1.4, c: PAL.inkSoft },
      { pts: ln(495, 196, 495, 210), w: 1.4, c: PAL.inkSoft },
      { pts: ln(504, 196, 504, 210), w: 1.4, c: PAL.inkSoft },
      { pts: ln(442, 250, 548, 250), w: 1.4, c: PAL.inkSoft },
      { pts: ln(442, 296, 548, 296), w: 1.4, c: PAL.inkSoft },
      ...arches([466, 495, 524], 12),
    ],
    { tag: 'b6' }
  );

  // 7. classical front: pediment over a colonnade, steps to the ground
  const b7 = pass(
    [
      { pts: ln(532, GY, 532, 296), w: OW },
      { pts: ln(704, GY, 704, 296), w: OW },
      { pts: ln(528, 296, 708, 296), w: OW },
      { pts: ln(528, 296, 618, 258), w: OW },
      { pts: ln(708, 296, 618, 258), w: OW },
      { pts: circle(618, 280, 4), w: 1.6 },
      ...[548, 572, 596, 644, 668, 692].map((x) => ({ pts: ln(x, 300, x, 418), w: 1.8 })),
      { pts: ln(536, 418, 700, 418), w: 1.8 },
      { pts: ln(530, 425, 706, 425), w: 1.8 },
      { pts: pointed(620, 356, 418, 14), w: 1.8 },
    ],
    { tag: 'b7' }
  );

  // 8. slim dome bandstand
  const b8 = pass(
    [
      { pts: ln(688, GY, 688, 238), w: OW },
      { pts: ln(752, GY, 752, 238), w: OW },
      { pts: ln(684, 238, 756, 238), w: OW },
      ...dome(720, 238, 16, 3),
      { pts: ln(688, 284, 752, 284), w: 1.4, c: PAL.inkSoft },
      { pts: ln(688, 340, 752, 340), w: 1.4, c: PAL.inkSoft },
      ...lattice(696, 292, 744, 416, 2, 2, 'b8'),
    ],
    { tag: 'b8' }
  );

  // 9. tall Gothic tower: narrow stage, spire, rose window, twin lights
  const b9 = pass(
    [
      { pts: ln(746, GY, 746, 190), w: OW },
      { pts: ln(836, GY, 836, 190), w: OW },
      { pts: ln(746, 190, 836, 190), w: OW },
      { pts: ln(764, 190, 764, 150), w: OW },
      { pts: ln(818, 190, 818, 150), w: OW },
      { pts: ln(764, 150, 818, 150), w: OW },
      { pts: ln(764, 150, 791, 92), w: OW },
      { pts: ln(818, 150, 791, 92), w: OW },
      { pts: circle(791, 85, 3.2), w: 1.8 },
      { pts: circle(791, 212, 8), w: 1.6 },
      { pts: pointed(772, 262, 340, 9), w: 1.8 },
      { pts: pointed(810, 262, 340, 9), w: 1.8 },
      { pts: ln(746, 366, 836, 366), w: 1.4, c: PAL.inkSoft },
      { pts: pointed(791, 392, GY, 13), w: 1.8 },
    ],
    { tag: 'b9' }
  );

  // 10. banded office block with roof balustrade
  const b10 = pass(
    [
      { pts: ln(828, GY, 828, 246), w: OW },
      { pts: ln(948, GY, 948, 246), w: OW },
      { pts: ln(828, 246, 948, 246), w: OW },
      ...ticks(838, 938, 246, 12, 7, { w: 1.4 }),
      ...lattice(836, 262, 940, 418, 4, 4, 'b10'),
    ],
    { tag: 'b10' }
  );

  // 11. stepped steeple with clock and belfry lights
  const b11 = pass(
    [
      { pts: ln(934, GY, 934, 360), w: OW },
      { pts: ln(934, 360, 944, 344), w: 1.8 },
      { pts: ln(944, GY, 944, 180), w: OW },
      { pts: ln(1020, GY, 1020, 180), w: OW },
      { pts: ln(944, 180, 1020, 180), w: OW },
      { pts: ln(956, 180, 956, 140), w: OW },
      { pts: ln(1008, 180, 1008, 140), w: OW },
      { pts: ln(956, 140, 1008, 140), w: OW },
      { pts: ln(956, 140, 982, 102), w: OW },
      { pts: ln(1008, 140, 982, 102), w: OW },
      { pts: circle(982, 95, 3.2), w: 1.8 },
      { pts: circle(982, 224, 9), w: 1.6 },
      { pts: ln(982, 224, 982, 217), w: 1.4 },
      { pts: pointed(969, 268, 322, 8), w: 1.6 },
      { pts: pointed(995, 268, 322, 8), w: 1.6 },
    ],
    { tag: 'b11' }
  );

  // 12. dense lattice slab with mast and orb
  const b12 = pass(
    [
      { pts: ln(1016, GY, 1016, 158), w: OW },
      { pts: ln(1132, GY, 1132, 158), w: OW },
      { pts: ln(1016, 158, 1132, 158), w: OW },
      { pts: poly([[1046, 158], [1046, 140], [1102, 140], [1102, 158]]) },
      { pts: ln(1074, 140, 1074, 110), w: 1.6 },
      { pts: circle(1074, 105, 3), w: 1.6 },
      ...lattice(1024, 170, 1124, 418, 8, 6, 'b12'),
    ],
    { tag: 'b12' }
  );

  // 13. domed civic building: central drum and great dome over low wings
  const b13 = pass(
    [
      { pts: ln(1118, GY, 1118, 300), w: OW },
      { pts: ln(1252, GY, 1252, 300), w: OW },
      { pts: ln(1118, 300, 1156, 300), w: OW },
      { pts: ln(1214, 300, 1252, 300), w: OW },
      { pts: ln(1156, 300, 1156, 262), w: OW },
      { pts: ln(1214, 300, 1214, 262), w: OW },
      { pts: ln(1152, 262, 1218, 262), w: OW },
      { pts: arc(1185, 262, 29, Math.PI, TAU), w: OW },
      { pts: poly([[1180, 230], [1180, 216], [1190, 216], [1190, 230]]), w: 1.6 },
      { pts: circle(1185, 210, 3), w: 1.6 },
      { pts: ln(1166, 266, 1166, 298), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1185, 266, 1185, 298), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1204, 266, 1204, 298), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1118, 348, 1156, 348), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1214, 348, 1252, 348), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1118, 390, 1156, 390), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1214, 390, 1252, 390), w: 1.4, c: PAL.inkSoft },
      { pts: arc(1136, GY, 12, Math.PI, TAU), w: 1.8 },
      { pts: arc(1234, GY, 12, Math.PI, TAU), w: 1.8 },
      { pts: pointed(1185, 352, GY, 16), w: 1.8 },
    ],
    { tag: 'b13' }
  );

  // 14. terrace of gabled houses with chimneys (the band drops to street height)
  const b14 = pass(
    [
      { pts: ln(1238, GY, 1238, 356), w: OW },
      { pts: ln(1372, GY, 1372, 356), w: OW },
      { pts: poly([[1238, 356], [1271, 330], [1304, 356], [1337, 330], [1372, 356]]) },
      { pts: poly([[1266, 331], [1266, 313], [1277, 313], [1277, 331]]), w: 1.8 },
      { pts: poly([[1332, 331], [1332, 313], [1343, 313], [1343, 331]]), w: 1.8 },
      { pts: ln(1270, 313, 1270, 306), w: 1.4 },
      { pts: ln(1336, 313, 1336, 306), w: 1.4 },
      { pts: poly([[1256, GY], [1256, 396], [1270, 396], [1270, GY]]), w: 1.8 },
      { pts: poly([[1294, GY], [1294, 396], [1308, 396], [1308, GY]]), w: 1.8 },
      { pts: poly([[1334, GY], [1334, 396], [1348, 396], [1348, GY]]), w: 1.8 },
      { pts: ln(1258, 372, 1268, 372), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1296, 372, 1306, 372), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1336, 372, 1346, 372), w: 1.4, c: PAL.inkSoft },
    ],
    { tag: 'b14' }
  );

  // 15. belfry tower with cone roof
  const b15 = pass(
    [
      { pts: ln(1358, GY, 1358, 208), w: OW },
      { pts: ln(1446, GY, 1446, 208), w: OW },
      { pts: ln(1354, 208, 1450, 208), w: OW },
      { pts: ln(1358, 208, 1402, 152), w: OW },
      { pts: ln(1446, 208, 1402, 152), w: OW },
      { pts: circle(1402, 145, 3.2), w: 1.8 },
      { pts: pointed(1384, 240, 302, 8), w: 1.6 },
      { pts: pointed(1420, 240, 302, 8), w: 1.6 },
      { pts: ln(1358, 342, 1446, 342), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1358, 388, 1446, 388), w: 1.4, c: PAL.inkSoft },
      { pts: pointed(1402, 398, GY, 12), w: 1.8 },
    ],
    { tag: 'b15' }
  );

  // 16. statue column: plinth, slim shaft, capital, figure with raised arm — the tallest peak (reference 2)
  const b16 = pass(
    [
      { pts: ln(1450, GY, 1450, 360), w: OW },
      { pts: ln(1502, GY, 1502, 360), w: OW },
      { pts: ln(1446, 360, 1506, 360), w: OW },
      { pts: ln(1446, 352, 1506, 352), w: 1.8 },
      { pts: ln(1466, 352, 1466, 152), w: 1.8 },
      { pts: ln(1486, 352, 1486, 152), w: 1.8 },
      { pts: ln(1476, 346, 1476, 158), w: 1.1, c: PAL.inkFaint },
      { pts: ln(1460, 152, 1492, 152), w: 1.8 },
      { pts: ln(1460, 142, 1492, 142), w: 1.8 },
      { pts: circle(1476, 117, 5), w: 1.8 },
      { pts: ln(1476, 122, 1476, 134), w: 1.8 },
      { pts: ln(1476, 124, 1463, 106), w: 1.8 },
      { pts: ln(1476, 126, 1485, 132), w: 1.8 },
      { pts: ln(1476, 134, 1471, 142), w: 1.6 },
      { pts: ln(1476, 134, 1481, 142), w: 1.6 },
    ],
    { tag: 'b16' }
  );

  // 17. the Colmore block: pediment and two corner orbs over a dense lattice
  const b17 = pass(
    [
      { pts: ln(1506, GY, 1506, 190), w: OW },
      { pts: ln(1662, GY, 1662, 190), w: OW },
      { pts: ln(1506, 190, 1662, 190), w: OW },
      { pts: ln(1506, 190, 1584, 156), w: OW },
      { pts: ln(1662, 190, 1584, 156), w: OW },
      { pts: circle(1512, 180, 7), w: 2 },
      { pts: circle(1656, 180, 7), w: 2 },
      ...lattice(1514, 204, 1654, 418, 7, 7, 'b17'),
      { pts: arc(1584, GY, 18, Math.PI, TAU), w: 1.8 },
    ],
    { tag: 'b17' }
  );

  // 18. crown slab: stepped top, combing, dense lattice
  const b18 = pass(
    [
      { pts: ln(1646, GY, 1646, 160), w: OW },
      { pts: ln(1758, GY, 1758, 160), w: OW },
      { pts: ln(1646, 160, 1758, 160), w: OW },
      { pts: ln(1666, 160, 1666, 142), w: OW },
      { pts: ln(1738, 160, 1738, 142), w: OW },
      { pts: ln(1666, 142, 1738, 142), w: OW },
      ...ticks(1670, 1734, 142, 8, 5, { w: 1.4 }),
      ...lattice(1654, 172, 1750, 418, 8, 5, 'b18'),
    ],
    { tag: 'b18' }
  );

  // 19. closing arcade with a pyramidal corner tower
  const b19 = pass(
    [
      { pts: ln(1742, GY, 1742, 322), w: OW },
      { pts: ln(1742, 322, 1830, 322), w: OW },
      { pts: ln(1830, GY, 1830, 258), w: OW },
      { pts: ln(1896, GY, 1896, 258), w: OW },
      { pts: ln(1830, 258, 1896, 258), w: OW },
      { pts: ln(1830, 258, 1863, 224), w: OW },
      { pts: ln(1896, 258, 1863, 224), w: OW },
      { pts: circle(1863, 217, 3.2), w: 1.8 },
      { pts: ln(1750, 322, 1750, 312), w: 1.4 },
      { pts: ln(1770, 322, 1770, 312), w: 1.4 },
      { pts: ln(1790, 322, 1790, 312), w: 1.4 },
      { pts: ln(1810, 322, 1810, 312), w: 1.4 },
      { pts: ln(1742, 352, 1830, 352), w: 1.4, c: PAL.inkSoft },
      ...arches([1760, 1788, 1816], 13),
      { pts: pointed(1863, 286, 318, 9), w: 1.6 },
      { pts: ln(1838, GY, 1838, 380), w: 1.4, c: PAL.inkSoft },
      { pts: ln(1888, GY, 1888, 380), w: 1.4, c: PAL.inkSoft },
    ],
    { tag: 'b19' }
  );

  const band = [b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19];
  const bStart = 1.4,
    bStepT = 0.46,
    bDur = 1.35;
  const buildings = band.map((P, i) => ({ P, t0: bStart + i * bStepT, dur: bDur }));

  // ---------------------------------------------------------------------------
  // wordmark: light serif caps, wide tracking (reference 2)
  // ---------------------------------------------------------------------------

  const WORD = 'BIRMINGHAM';
  const FONT = '400 60px Georgia, "Times New Roman", serif';

  function drawWordmark(ctx, t) {
    const u = seg(t, 10.9, 12.2);
    if (u <= 0) return;
    ctx.save();
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '30px';
    const tw = ctx.measureText(WORD).width;
    const x0 = W / 2 - tw / 2 - 12;
    ctx.beginPath();
    ctx.rect(x0, 444, (tw + 24) * u, H - 444);
    ctx.clip();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = PAL.ink;
    ctx.fillText(WORD, W / 2, 524);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // the scene
  // ---------------------------------------------------------------------------

  FILM.scene({
    id: ID,
    draw(ctx, t) {
      if (!FILM.transparent) {
        ctx.fillStyle = PAL.paper;
        ctx.fillRect(0, 0, FILM.W, FILM.H);
      }

      for (const g of ghosts) drawPass(ctx, g.P, seg(t, g.t0, g.t0 + 1.1));
      drawPass(ctx, GROUND, seg(t, 0, 1.15));
      for (const m of buildings) drawPass(ctx, m.P, seg(t, m.t0, m.t0 + m.dur));
      drawWordmark(ctx, t);
    },
  });
})();
