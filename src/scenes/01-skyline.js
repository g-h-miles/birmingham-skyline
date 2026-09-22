// 01 skyline : Birmingham draws itself as a footer — faithful to the reference.
// A reference composition, not a repeated band: two depth planes (silhouette backs, detailed
// fronts), ~14 landmarks with wildly different widths and ONE signature texture each, sparse
// individual windows on mostly blank walls, front buildings knocking clean margins out of the
// backs (sticker overlaps), a hatched station staircase as the centrepiece, and a statue crowning
// a tower at the right. Built once at load (seeded); draw() reads only (ctx, t).
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
  // Gothic pointed arch, open at the bottom
  function pointed(cx, topY, botY, hw) {
    return poly([[cx - hw, botY], [cx - hw, topY + hw], [cx, topY], [cx + hw, topY + hw], [cx + hw, botY]]);
  }
  // one small window rectangle (the reference's sparse individual panes)
  function win(cx, cy, w2, h2) {
    return poly([[cx - w2, cy - h2], [cx + w2, cy - h2], [cx + w2, cy + h2], [cx - w2, cy + h2], [cx - w2, cy - h2]]);
  }
  // sparse window field: cols x rows of individual panes, top->bottom then left->right per row
  function winField(x0, y0, x1, y1, cols, rows, tag) {
    const r = LIB.rng(sd(tag));
    const S = [];
    const cw = 5.5, ch = 8;
    for (let i = 0; i < rows; i++) {
      const y = y0 + ((y1 - y0) * i) / Math.max(1, rows - 1);
      for (let j = 0; j < cols; j++) {
        if (r() < 0.06) continue; // the odd pane left out: hand-doodled charm
        const x = x0 + ((x1 - x0) * j) / Math.max(1, cols - 1);
        S.push({ pts: win(x, y, cw, ch), w: 1.2, c: PAL.inkSoft });
      }
    }
    return S;
  }
  // a row of small arches (arcade / clerestory)
  function archRow(centers, y, r0) {
    return centers.map((x) => ({ pts: arc(x, y, r0, Math.PI, TAU), w: 1.6 }));
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
        w: s.w != null ? s.w : o.w || 2.2,
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
        smooth: st.w >= 2, // panes keep crisp corners; outlines wobble
        wobble: st.w >= 2 ? 1.5 : 0.5,
        tremble: 0.35,
        taper: [8, f >= 1 ? 16 : 1],
      });
    }
  }

  // Sticker overlap: a front building knocks a clean margin out of everything drawn behind it.
  function knock(ctx, sil) {
    ctx.save();
    if (FILM.transparent) ctx.globalCompositeOperation = 'destination-out';
    else ctx.fillStyle = PAL.paper;
    ctx.beginPath();
    ctx.moveTo(sil[0][0], sil[0][1]);
    for (let i = 1; i < sil.length; i++) ctx.lineTo(sil[i][0], sil[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // BACK plane — silhouettes and tall textures, drawn first, faintly detailed
  // ---------------------------------------------------------------------------

  // BT-style lattice mast
  const bkMast = pass(
    [
      { pts: ln(292, GY, 303, 118) },
      { pts: ln(314, GY, 304, 118) },
      { pts: ln(303, 118, 304, 86) },
      { pts: ln(298, 150, 309, 150), w: 1.2 },
      ...[180, 230, 285, 340, 395].map((y) => ({ pts: ln(293 + (GY - y) * 0.006, y, 313 - (GY - y) * 0.006, y), w: 1.2 })),
    ],
    { w: 1.6, c: PAL.inkSoft, tag: 'mast' }
  );

  // the ONE dense-grid slab (behind, left of centre)
  const bkDense = pass(
    [
      { pts: ln(652, GY, 652, 128) },
      { pts: ln(788, GY, 788, 128) },
      { pts: ln(652, 128, 788, 128) },
    ],
    { w: 2, tag: 'dense' }
  );
  {
    const S = [];
    for (let y = 146; y < GY - 16; y += 15) S.push({ pts: ln(660, y, 780, y), w: 1.0, c: PAL.inkSoft });
    for (let x = 664; x < 782; x += 15) S.push({ pts: ln(x, 136, x, GY - 18), w: 1.0, c: PAL.inkSoft });
    bkDense.strokes.push(...pass(S, { tag: 'dense2' }).strokes);
    let tot = 0;
    for (const s of bkDense.strokes) tot += s.len;
    bkDense.total = tot;
  }

  // hero tower behind the station: pediment + two corner orbs, banded tall windows
  const bkOrb = (() => {
    const S = [
      { pts: ln(940, GY, 940, 108) },
      { pts: ln(1120, GY, 1120, 108) },
      { pts: ln(940, 108, 1120, 108) },
      { pts: ln(940, 108, 1030, 66) },
      { pts: ln(1120, 108, 1030, 66) },
      { pts: circle(953, 96, 10), w: 2 },
      { pts: circle(1107, 96, 10), w: 2 },
    ];
    // three vertical window bands, each a run of stacked panes
    for (const bx of [975, 1030, 1085]) S.push({ pts: ln(bx, 130, bx, GY - 14), w: 1.1, c: PAL.inkSoft });
    for (let y = 140; y < GY - 20; y += 26) {
      S.push({ pts: ln(955, y, 1105, y), w: 1.1, c: PAL.inkSoft });
    }
    return pass(S, { w: 2.2, tag: 'orb' });
  })();

  // Gothic octagonal spire behind the station's right shoulder
  const bkSpire = pass(
    [
      { pts: ln(1230, GY, 1230, 216) },
      { pts: ln(1276, GY, 1276, 216) },
      { pts: ln(1226, 216, 1280, 216) },
      { pts: ln(1230, 216, 1253, 96) },
      { pts: ln(1276, 216, 1253, 96) },
      { pts: circle(1253, 88, 3.2), w: 1.6 },
      { pts: ln(1224, 216, 1224, 196), w: 1.4 },
      { pts: ln(1282, 216, 1282, 196), w: 1.4 },
      { pts: circle(1224, 192, 2.4), w: 1.4 },
      { pts: circle(1282, 192, 2.4), w: 1.4 },
      { pts: pointed(1253, 250, 330, 9), w: 1.6 },
      { pts: ln(1230, 360, 1276, 360), w: 1.2, c: PAL.inkSoft },
    ],
    { w: 2, tag: 'spire' }
  );

  // the pinstripe slab (right, behind)
  const bkPin = (() => {
    const S = [
      { pts: ln(1330, GY, 1330, 150) },
      { pts: ln(1448, GY, 1448, 150) },
      { pts: ln(1330, 150, 1448, 150) },
    ];
    for (let y = 160; y < GY - 10; y += 11) S.push({ pts: ln(1336, y, 1442, y), w: 1.0, c: PAL.inkSoft });
    return pass(S, { w: 2, tag: 'pin' });
  })();

  // plain monolith at the right edge
  const bkMono = pass(
    [
      { pts: ln(1810, GY, 1810, 208) },
      { pts: ln(1872, GY, 1872, 208) },
      { pts: ln(1810, 208, 1872, 208) },
      { pts: ln(1841, 214, 1841, GY - 10), w: 1.1, c: PAL.inkSoft },
    ],
    { w: 2, tag: 'mono' }
  );

  // ---------------------------------------------------------------------------
  // FRONT plane — detailed landmarks that knock out the backs
  // ---------------------------------------------------------------------------

  // F1 broad classical office, arched clerestory, sparse panes, corner roof blocks
  const f1 = pass(
    [
      { pts: ln(64, GY, 64, 206) },
      { pts: ln(338, GY, 338, 206) },
      { pts: ln(60, 206, 342, 206) },
      { pts: poly([[76, 206], [76, 190], [118, 190], [118, 206]]), w: 1.8 },
      { pts: poly([[286, 206], [286, 190], [326, 190], [326, 206]]), w: 1.8 },
      { pts: ln(64, 236, 338, 236), w: 1.4 },
      ...archRow([92, 128, 164, 200, 236, 272, 308], 236, 12),
      ...winField(96, 280, 306, 404, 6, 5, 'f1'),
      { pts: pointed(201, 372, GY, 17), w: 2 },
      { pts: ln(184, 392, 218, 392), w: 1.2, c: PAL.inkSoft },
    ],
    { tag: 'f1' }
  );
  const f1sil = [[52, GY + 6], [52, 200], [70, 184], [124, 184], [124, 200], [280, 200], [280, 184], [332, 184], [332, 200], [350, 200], [350, GY + 6]];

  // F2 stepped Art Deco tower with cupola dome, ball and needle
  const f2 = pass(
    [
      { pts: ln(368, GY, 368, 252) },
      { pts: ln(484, GY, 484, 252) },
      { pts: ln(362, 252, 490, 252) },
      { pts: ln(386, 252, 386, 208) },
      { pts: ln(466, 252, 466, 208) },
      { pts: ln(382, 208, 470, 208) },
      { pts: ln(398, 208, 398, 180) },
      { pts: ln(454, 208, 454, 180) },
      { pts: ln(394, 180, 458, 180) },
      { pts: arc(426, 180, 32, Math.PI, TAU) },
      { pts: circle(426, 141, 4), w: 1.8 },
      { pts: ln(426, 137, 426, 116), w: 1.4 },
      { pts: circle(426, 112, 2.6), w: 1.4 },
      { pts: ln(406, 180, 406, 162), w: 1.1, c: PAL.inkSoft },
      { pts: ln(426, 178, 426, 162), w: 1.1, c: PAL.inkSoft },
      { pts: ln(446, 180, 446, 162), w: 1.1, c: PAL.inkSoft },
      ...winField(392, 282, 460, 400, 3, 5, 'f2'),
      { pts: pointed(426, 396, GY, 14), w: 1.8 },
    ],
    { tag: 'f2' }
  );
  const f2sil = [[356, GY + 6], [356, 246], [380, 246], [380, 202], [392, 202], [392, 182], [426, 146], [460, 182], [460, 202], [472, 202], [472, 246], [496, 246], [496, GY + 6]];

  // F7 gabled tower with arched dormer (between F2 and the station)
  const f7 = pass(
    [
      { pts: ln(512, GY, 512, 258) },
      { pts: ln(596, GY, 596, 258) },
      { pts: ln(506, 258, 554, 196) },
      { pts: ln(602, 258, 554, 196) },
      { pts: arc(554, 252, 15, Math.PI, TAU), w: 1.6 },
      { pts: ln(512, 268, 596, 268), w: 1.2, c: PAL.inkSoft },
      ...winField(532, 296, 576, 402, 2, 5, 'f7'),
      { pts: arc(554, GY, 14, Math.PI, TAU), w: 1.8 },
    ],
    { tag: 'f7' }
  );
  const f7sil = [[500, GY + 6], [500, 262], [554, 188], [608, 262], [608, GY + 6]];

  // F3 the station centrepiece: twin dome towers, pedimented facade, hatched staircase
  const f3 = pass(
    [
      // left dome tower
      { pts: ln(620, GY, 620, 292) },
      { pts: ln(694, 330, 694, 292) },
      { pts: ln(614, 292, 700, 292) },
      { pts: arc(657, 292, 40, Math.PI, TAU) },
      { pts: circle(657, 246, 3.4), w: 1.6 },
      { pts: arc(641, 320, 9, Math.PI, TAU), w: 1.4 },
      { pts: arc(657, 320, 9, Math.PI, TAU), w: 1.4 },
      { pts: arc(673, 320, 9, Math.PI, TAU), w: 1.4 },
      // right dome tower (mirrored)
      { pts: ln(886, GY, 886, 292) },
      { pts: ln(800, 330, 800, 292) },
      { pts: ln(812, 292, 898, 292) },
      { pts: arc(855, 292, 40, Math.PI, TAU) },
      { pts: circle(855, 246, 3.4), w: 1.6 },
      { pts: arc(839, 320, 9, Math.PI, TAU), w: 1.4 },
      { pts: arc(855, 320, 9, Math.PI, TAU), w: 1.4 },
      { pts: arc(871, 320, 9, Math.PI, TAU), w: 1.4 },
      // central facade + pediment + lunette
      { pts: ln(700, 330, 812, 330) },
      { pts: ln(696, 330, 756, 296) },
      { pts: ln(816, 330, 756, 296) },
      { pts: arc(756, 330, 17, Math.PI, TAU), w: 1.6 },
      { pts: ln(748, 322, 744, 314), w: 1.1, c: PAL.inkSoft },
      { pts: ln(756, 313, 756, 322), w: 1.1, c: PAL.inkSoft },
      { pts: ln(764, 314, 768, 322), w: 1.1, c: PAL.inkSoft },
      // three arched entrances on the terrace line
      { pts: arc(716, 396, 13, Math.PI, TAU), w: 1.8 },
      { pts: arc(756, 396, 15, Math.PI, TAU), w: 1.8 },
      { pts: arc(796, 396, 13, Math.PI, TAU), w: 1.8 },
      { pts: ln(716, 396, 716, 384), w: 1.2 },
      { pts: ln(796, 396, 796, 384), w: 1.2 },
      // staircase: wide trapezoid with treads
      { pts: poly([[700, 396], [812, 396], [862, GY], [650, GY]]) },
      { pts: ln(692, 404, 820, 404), w: 1.1, c: PAL.inkSoft },
      { pts: ln(684, 412, 828, 412), w: 1.1, c: PAL.inkSoft },
      { pts: ln(676, 420, 836, 420), w: 1.1, c: PAL.inkSoft },
      { pts: ln(668, 428, 844, 428), w: 1.1, c: PAL.inkSoft },
    ].filter((s) => s.pts && (!s.pts.length || s.pts.length > 1) && s.w !== 0),
    { tag: 'f3' }
  );
  const f3sil = [
    [608, GY + 8], [608, 286], [657, 248], [706, 286], [706, 324], [714, 324], [756, 290], [798, 324], [806, 324], [806, 286], [855, 248], [904, 286], [904, 336], [872, 396], [872, GY + 8],
  ];
  // tone from hatching: the stair face gets shade, house rules, never a fill
  const f3shade = [[700, 396], [812, 396], [862, GY], [650, GY]];

  // F4 gabled Gothic church with rose window, corner spirelets, side aisle
  const f4 = pass(
    [
      { pts: ln(952, GY, 952, 330) },
      { pts: ln(1084, GY, 1084, 330) },
      { pts: ln(948, 330, 1018, 258) },
      { pts: ln(1088, 330, 1018, 258) },
      { pts: circle(1018, 251, 3), w: 1.6 },
      { pts: poly([[938, 306], [948, 278], [958, 306]]), w: 1.6 },
      { pts: circle(948, 272, 2.4), w: 1.4 },
      { pts: ln(938, 306, 938, 330), w: 1.6 },
      { pts: ln(958, 306, 958, 330), w: 1.6 },
      { pts: poly([[1078, 306], [1088, 278], [1098, 306]]), w: 1.6 },
      { pts: circle(1088, 272, 2.4), w: 1.4 },
      { pts: ln(1078, 306, 1078, 330), w: 1.6 },
      { pts: ln(1098, 306, 1098, 330), w: 1.6 },
      { pts: circle(1018, 302, 13), w: 1.5 },
      { pts: ln(1018, 289, 1018, 315), w: 1.1, c: PAL.inkSoft },
      { pts: ln(1005, 302, 1031, 302), w: 1.1, c: PAL.inkSoft },
      { pts: ln(1009, 293, 1027, 311), w: 1.1, c: PAL.inkSoft },
      { pts: ln(1027, 293, 1009, 311), w: 1.1, c: PAL.inkSoft },
      { pts: pointed(1018, 366, GY, 15), w: 1.8 },
      // side aisle to the right, lower
      { pts: ln(1084, 380, 1136, 380) },
      { pts: ln(1136, GY, 1136, 380) },
      { pts: pointed(1100, 400, 424, 8), w: 1.4 },
      { pts: pointed(1122, 400, 424, 8), w: 1.4 },
    ],
    { tag: 'f4' }
  );
  const f4sil = [[928, GY + 6], [928, 268], [948, 268], [1018, 244], [1088, 268], [1108, 268], [1108, 306], [1144, 306], [1144, GY + 6]];

  // F5 broad slab with horizontal floor bands + tall three-door base
  const f5 = (() => {
    const S = [
      { pts: ln(1170, GY, 1170, 214) },
      { pts: ln(1360, GY, 1360, 214) },
      { pts: ln(1170, 214, 1360, 214) },
      { pts: poly([[1216, 214], [1216, 190], [1316, 190], [1316, 214]]), w: 1.8 },
    ];
    for (let i = 0; i < 5; i++) {
      const y = 232 + i * 14;
      S.push({ pts: ln(1176, y, 1354, y), w: 1.2, c: PAL.inkSoft });
    }
    // three tall window bands lower down
    for (const bx of [1210, 1265, 1320]) S.push({ pts: ln(bx - 9, 320, bx - 9, 412), w: 1.2 }, { pts: ln(bx + 9, 320, bx + 9, 412), w: 1.2 }, { pts: ln(bx - 9, 320, bx + 9, 320), w: 1.2 });
    S.push({ pts: ln(1201, 412, 1329, 412), w: 1.2, c: PAL.inkSoft });
    S.push({ pts: ln(1240, GY, 1240, 380), w: 1.4 }, { pts: ln(1290, GY, 1290, 380), w: 1.4 }, { pts: ln(1240, 380, 1290, 380), w: 1.4 });
    return pass(S, { w: 2.2, tag: 'f5' });
  })();
  const f5sil = [[1158, GY + 6], [1158, 208], [1210, 208], [1210, 184], [1322, 184], [1322, 208], [1372, 208], [1372, GY + 6]];

  // F6 Art Deco tower crowned by a standing statue with raised arm
  const f6 = pass(
    [
      { pts: ln(1478, GY, 1478, 216) },
      { pts: ln(1602, GY, 1602, 216) },
      { pts: ln(1474, 216, 1606, 216) },
      // balustrade frieze
      { pts: ln(1474, 208, 1606, 208), w: 1.4 },
      ...Array.from({ length: 14 }, (_, i) => ({ pts: ln(1484 + i * 9, 208, 1484 + i * 9, 200), w: 1 })),
      // statue plinth + figure
      { pts: poly([[1520, 200], [1520, 186], [1562, 186], [1562, 200]]), w: 1.8 },
      { pts: circle(1541, 160, 5.5), w: 1.8 },
      { pts: ln(1541, 166, 1541, 178), w: 1.8 },
      { pts: ln(1541, 168, 1528, 148), w: 1.8 },
      { pts: ln(1541, 170, 1550, 176), w: 1.8 },
      { pts: ln(1541, 178, 1535, 186), w: 1.6 },
      { pts: ln(1541, 178, 1547, 186), w: 1.6 },
      // sparse panes in two vertical runs + tall base doors
      ...winField(1502, 248, 1578, 360, 4, 5, 'f6'),
      { pts: ln(1518, GY, 1518, 384), w: 1.6 },
      { pts: ln(1562, GY, 1562, 384), w: 1.6 },
      { pts: ln(1518, 384, 1562, 384), w: 1.6 },
    ],
    { tag: 'f6' }
  );
  const f6sil = [[1462, GY + 6], [1462, 210], [1514, 210], [1514, 180], [1541, 152], [1568, 180], [1568, 210], [1618, 210], [1618, GY + 6]];

  // F8 low closing arcade at the right edge
  const f8 = pass(
    [
      { pts: ln(1640, GY, 1640, 344) },
      { pts: ln(1770, GY, 1770, 344) },
      { pts: ln(1636, 344, 1774, 344) },
      ...archRow([1666, 1705, 1744], GY, 15),
      { pts: ln(1640, 372, 1770, 372), w: 1.2, c: PAL.inkSoft },
    ],
    { tag: 'f8' }
  );
  const f8sil = [[1628, GY + 8], [1628, 336], [1782, 336], [1782, GY + 8]];

  // ---------------------------------------------------------------------------
  // the timeline of the pen (100 bpm grid, docs/storyboard.md)
  // ---------------------------------------------------------------------------

  const backs = [
    { P: bkMast, t0: 1.2, dur: 0.9 },
    { P: bkDense, t0: 1.7, dur: 1.5 },
    { P: bkOrb, t0: 2.7, dur: 1.6 },
    { P: bkSpire, t0: 3.8, dur: 1.0 },
    { P: bkPin, t0: 4.4, dur: 1.5 },
    { P: bkMono, t0: 5.6, dur: 0.8 },
  ];
  const fronts = [
    { P: f1, sil: f1sil, t0: 6.2, dur: 1.7 },
    { P: f2, sil: f2sil, t0: 7.0, dur: 1.5 },
    { P: f7, sil: f7sil, t0: 7.8, dur: 1.2 },
    { P: f3, sil: f3sil, t0: 8.2, dur: 2.0, shade: f3shade },
    { P: f4, sil: f4sil, t0: 9.2, dur: 1.5 },
    { P: f5, sil: f5sil, t0: 9.8, dur: 1.5 },
    { P: f6, sil: f6sil, t0: 10.4, dur: 1.7 },
    { P: f8, sil: f8sil, t0: 11.0, dur: 0.9 },
  ];

  const GROUND = pass([{ pts: ln(24, GY, 1896, GY), w: 2.2 }], { tag: 'grd' });

  // ---------------------------------------------------------------------------
  // wordmark: light serif caps, wide tracking (reference)
  // ---------------------------------------------------------------------------

  const WORD = 'BIRMINGHAM';
  const FONT = '400 60px Georgia, "Times New Roman", serif';

  function drawWordmark(ctx, t) {
    const u = seg(t, 11.6, 12.9);
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

      drawPass(ctx, GROUND, seg(t, 0, 1.15));

      for (const b of backs) drawPass(ctx, b.P, seg(t, b.t0, b.t0 + b.dur));

      for (const f of fronts) {
        const u = seg(t, f.t0, f.t0 + f.dur);
        if (u <= 0) continue;
        knock(ctx, f.sil);
        drawPass(ctx, f.P, u);
        // tone from hatching: the station staircase shades in last
        if (f.shade && u > 0.75) {
          const a = seg(u, 0.75, 1);
          ctx.save();
          ctx.globalAlpha = 0.5 * a;
          LIB.hatch(ctx, f.shade, {
            angle: -0.12,
            spacing: 5,
            width: 1.2,
            color: PAL.inkSoft,
            alpha: 0.55,
            seed: sd('shade'),
            length: [60, 220],
            gap: [1, 2],
            inset: 2,
            overshoot: 0,
            density: 0.9,
          });
          ctx.restore();
        }
      }

      // front knocks erased ground segments: restore the rule on top
      ctx.save();
      drawPass(ctx, GROUND, clamp01(seg(t, 0.4, 0.8) * 1));
      ctx.restore();

      drawWordmark(ctx, t);
    },
  });
})();
