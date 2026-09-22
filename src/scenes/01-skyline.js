// 01 skyline : Birmingham draws itself as a footer.
// One travelling pen. The ground rule sweeps in, the back row ghosts in faint, then ten landmarks
// ink themselves left to right (outline -> lattice -> crown), trees pop, clouds draw, doodles pop,
// two cars cruise, and a bold serif wordmark wipes in below. See docs/storyboard.md for the grid.
// Geometry is built once at load, deterministically (seeded); draw() reads only (ctx, t).
(function () {
  'use strict';

  const ID = 'skyline';
  const LIB = FILM.lib;
  const PAL = LIB.pal;
  const TAU = Math.PI * 2;

  const W = 1920;
  const H = 560;
  const GY = 432; // the ground rule

  const lerp = (a, b, t) => a + (b - t * (a - b) - b); // guard: keep simple below
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const seg = (t, a, b) => sstep(a, b, t);
  let SID = 1;
  const sd = (k) => (LIB.hash(ID, k) & 0x7fffffff) || 7;

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
  function cat(a, b) {
    const p = a.concat(b.map((q) => q));
    return p;
  }
  // window lattice: floor lines then column lines across [x0..x1] x [y0..y1]
  function lattice(x0, y0, x1, y1, rows, cols, rseed) {
    const r = LIB.rng(sd(rseed));
    const S = [];
    for (let i = 1; i <= rows; i++) {
      const y = y0 + ((y1 - y0) * i) / (rows + 1);
      S.push({ pts: ln(x0, y, x1, y) });
    }
    for (let j = 1; j <= cols; j++) {
      const x = x0 + ((x1 - x0) * j) / (cols + 1);
      if (r() < 0.12) continue; // a few columns skipped: hand-doodled charm
      S.push({ pts: ln(x, y0, x, y1) });
    }
    return S;
  }

  // ---------------------------------------------------------------------------
  // strokes and pen passes
  // ---------------------------------------------------------------------------

  // Finalise a stroke list into pen-pass geometry: { pts, cum, len, w, c, seed }
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
        w: s.w != null ? s.w : o.w || 3.4,
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

  // Draw the pen pass at progress u (0..1): strokes ink in order, one continuous pen.
  function drawPass(ctx, P, u, o) {
    o = o || {};
    if (!(u > 0)) return;
    let budget = clamp01(u) * P.total;
    for (const st of P.strokes) {
      if (budget <= 0) break;
      const f = clamp01(budget / st.len);
      const pts = trimStroke(st, f);
      budget -= st.len;
      if (!pts) continue;
      LIB.inkPath(ctx, pts, {
        width: st.w * (o.scaleW || 1),
        color: st.c,
        seed: st.seed,
        smooth: true,
        wobble: st.w > 2.5 ? 2 : 1.2,
        tremble: 0.4,
        taper: [10, f >= 1 ? 22 : 1],
        alpha: o.alpha != null ? o.alpha : 1,
      });
    }
  }

  // A pop element: small and fully drawn, appearing with an alpha ramp.
  function drawPop(ctx, el, t) {
    const a = seg(t, el.t0, el.t0 + 0.18);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    for (const s of el.P.strokes)
      LIB.inkPath(ctx, s.pts, { width: s.w, color: s.c, seed: s.seed, smooth: true, taper: [8, 14], wobble: 1 });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // the plate: geometry built once
  // ---------------------------------------------------------------------------

  // ---- ground rule
  const GROUND = pass([{ pts: ln(24, GY, 1896, GY) }], { w: 6, tag: 'grd' });

  // ---- back row (inkFaint), drawn behind the landmarks
  function ghostTower(x, w2, top, tag) {
    const S = [
      { pts: ln(x, GY, x, top) },
      { pts: ln(x + w2, GY, x + w2, top) },
      { pts: ln(x, top, x + w2, top) },
    ];
    const rows = Math.round((GY - top) / 34);
    for (let i = 1; i < rows; i++) S.push({ pts: ln(x, top + ((GY - top) * i) / rows, x + w2, top + ((GY - top) * i) / rows) });
    return pass(S, { w: 1.8, c: PAL.inkFaint, tag });
  }
  const ghosts = [
    { P: ghostTower(428, 46, 210, 'g1'), t0: 1.15 },
    { P: ghostTower(800, 44, 232, 'g2'), t0: 1.4 },
    { P: ghostTower(1690, 48, 250, 'g4'), t0: 1.65 },
  ];
  // a gasholder between b7 and b8
  const gasholder = pass(
    [
      { pts: ln(1436, GY, 1436, 320) },
      { pts: ln(1474, GY, 1474, 320) },
      { pts: arc(1455, 320, 19, Math.PI, TAU) },
      { pts: circle(1455, 294, 3.4) },
      { pts: ln(1436, 336, 1474, 386) },
      { pts: ln(1474, 336, 1436, 386) },
    ],
    { w: 1.8, c: PAL.inkFaint, tag: 'gas' }
  );
  ghosts.push({ P: gasholder, t0: 1.85 });

  // ---- landmarks: each is an ordered pen pass. t0s L->R, staggered.
  const bStart = 1.5,
    bStepT = 0.55,
    bDur = 1.5;

  // 1. the Rotunda
  const rotunda = pass(
    [
      { pts: ln(70, GY, 70, 190) },
      { pts: ln(220, GY, 220, 190) },
      { pts: arc(145, 190, 75, Math.PI, TAU) },
      { pts: ln(145, 115, 145, 88) },
      { pts: ln(138, 98, 152, 98) },
      ...lattice(78, 244, 212, 384, 4, 6, 'rot'),
      { pts: arc(145, GY, 22, Math.PI, TAU) },
    ],
    { tag: 'rot' }
  );

  // 2. back-to-back terrace
  const backToBack = pass(
    [
      { pts: ln(250, GY, 250, 350) },
      { pts: poly([[250, 350], [292, 318], [334, 350], [376, 318], [420, 350]]) },
      { pts: ln(420, 350, 420, GY) },
      { pts: poly([[286, 318], [286, 296], [298, 296], [298, 320]]) },
      { pts: poly([[370, 318], [370, 296], [382, 296], [382, 320]]) },
      { pts: ln(289, 296, 289, 288) },
      { pts: ln(295, 296, 295, 288) },
      { pts: ln(373, 296, 373, 288) },
      { pts: ln(379, 296, 379, 288) },
      { pts: poly([[272, GY], [272, 398], [288, 398], [288, GY]]), w: 2.4 },
      { pts: poly([[324, GY], [324, 398], [340, 398], [340, GY]]), w: 2.4 },
      { pts: poly([[376, GY], [376, 398], [392, 398], [392, GY]]), w: 2.4 },
      { pts: ln(274, 372, 286, 372), w: 1.6, c: PAL.inkSoft },
      { pts: ln(326, 372, 338, 372), w: 1.6, c: PAL.inkSoft },
      { pts: ln(378, 372, 390, 372), w: 1.6, c: PAL.inkSoft },
    ],
    { tag: 'b2b' }
  );

  // 3. BT Tower
  const btTower = pass(
    [
      { pts: ln(470, GY, 470, 120) },
      { pts: ln(516, GY, 516, 120) },
      { pts: poly([[470, 120], [462, 112], [524, 112], [516, 120]]) },
      { pts: ln(493, 112, 493, 58) },
      { pts: ln(486, 74, 500, 74), w: 2.2 },
      { pts: ln(488, 88, 498, 88), w: 2.2 },
      { pts: ln(470, 180, 516, 180), w: 1.6, c: PAL.inkSoft },
      { pts: ln(470, 258, 516, 258), w: 1.6, c: PAL.inkSoft },
      { pts: ln(470, 336, 516, 336), w: 1.6, c: PAL.inkSoft },
    ],
    { tag: 'bt' }
  );

  // 4. the Colmore hero block: pediment + two corner orbs (reference 1, centre)
  const colmore = pass(
    [
      { pts: ln(560, GY, 560, 110) },
      { pts: ln(790, GY, 790, 110) },
      { pts: ln(560, 110, 790, 110) },
      { pts: ln(560, 110, 675, 74) },
      { pts: ln(675, 74, 790, 110) },
      { pts: circle(566, 98, 10), w: 2.6 },
      { pts: circle(784, 98, 10), w: 2.6 },
      ...lattice(574, 130, 776, 402, 8, 7, 'colm'),
      { pts: arc(675, GY, 26, Math.PI, TAU), w: 2.6 },
    ],
    { tag: 'colm' }
  );

  // 5. St Philip's Cathedral
  const cathedral = pass(
    [
      { pts: ln(840, GY, 840, 330) },
      { pts: ln(990, GY, 990, 330) },
      { pts: ln(840, 330, 990, 330) },
      { pts: ln(888, 330, 888, 262) },
      { pts: ln(942, 330, 942, 262) },
      { pts: arc(915, 262, 27, Math.PI, TAU) },
      { pts: circle(915, 228, 5), w: 2.4 },
      { pts: circle(846, 322, 4), w: 2.2 },
      { pts: circle(984, 322, 4), w: 2.2 },
      { pts: ln(846, 356, 880, 356), w: 1.6, c: PAL.inkSoft },
      { pts: ln(950, 356, 984, 356), w: 1.6, c: PAL.inkSoft },
      { pts: ln(846, 388, 880, 388), w: 1.6, c: PAL.inkSoft },
      { pts: ln(950, 388, 984, 388), w: 1.6, c: PAL.inkSoft },
      { pts: poly([[903, GY], [903, 376], [927, 376], [927, GY]]), w: 2.4 },
      { pts: arc(915, 376, 12, Math.PI, TAU), w: 2.4 },
    ],
    { tag: 'cat' }
  );

  // 6. New Street Station: train-shed arc behind the arcade facade
  const station = pass(
    [
      { pts: ln(1020, GY, 1020, 336) },
      { pts: ln(1280, GY, 1280, 336) },
      { pts: arc(1150, 336, 120, Math.PI, TAU) },
      { pts: arc(1150, 336, 96, Math.PI, TAU), w: 1.8 },
      { pts: arc(1150, 336, 72, Math.PI, TAU), w: 1.8 },
      { pts: ln(1020, 336, 1280, 336) },
      { pts: arc(1046, 336, 16, Math.PI, TAU), w: 2.4 },
      { pts: arc(1254, 336, 16, Math.PI, TAU), w: 2.4 },
      { pts: circle(1150, 362, 9), w: 2.2 },
      { pts: ln(1150, 362, 1150, 356), w: 1.6 },
      { pts: ln(1150, 362, 1155, 364), w: 1.6 },
    ].concat(
      [1044, 1086, 1128, 1170, 1212, 1256].map((x) => ({ pts: arc(x, GY, 17, Math.PI, TAU), w: 2.2 }))
    ),
    { tag: 'stn' }
  );

  // 7. St Martin in the Bullring: stepped steeple
  const stMartin = pass(
    [
      { pts: ln(1344, GY, 1344, 190) },
      { pts: ln(1416, GY, 1416, 190) },
      { pts: ln(1344, 190, 1416, 190) },
      { pts: ln(1356, 190, 1356, 150) },
      { pts: ln(1404, 190, 1404, 150) },
      { pts: ln(1356, 150, 1404, 150) },
      { pts: ln(1356, 150, 1380, 106) },
      { pts: ln(1404, 150, 1380, 106) },
      { pts: circle(1380, 100, 4), w: 2.2 },
      { pts: ln(1344, 250, 1416, 250), w: 1.6, c: PAL.inkSoft },
      { pts: ln(1344, 320, 1416, 320), w: 1.6, c: PAL.inkSoft },
      { pts: poly([[1362, 392], [1362, 318], [1380, 296], [1398, 318], [1398, 392]]), w: 2.2 },
    ],
    { tag: 'stm' }
  );

  // 8. Library of Birmingham: stacked cantilever rings
  const library = pass(
    [
      { pts: ln(1480, GY, 1480, 266) },
      { pts: ln(1610, GY, 1610, 266) },
      { pts: ln(1480, 266, 1610, 266) },
      { pts: ln(1468, 288, 1622, 288) },
      { pts: ln(1468, 324, 1622, 324) },
      { pts: ln(1468, 360, 1622, 360) },
      { pts: ln(1468, 396, 1622, 396) },
      { pts: circle(1500, 306, 5), w: 1.8, c: PAL.inkSoft },
      { pts: circle(1532, 306, 5), w: 1.8, c: PAL.inkSoft },
      { pts: circle(1564, 306, 5), w: 1.8, c: PAL.inkSoft },
      { pts: circle(1596, 306, 5), w: 1.8, c: PAL.inkSoft },
    ],
    { tag: 'lib' }
  );

  // 9. Chamberlain Memorial: slim column + stick statue with raised arm
  const chamberlain = pass(
    [
      { pts: ln(1642, GY, 1642, 416) },
      { pts: ln(1674, GY, 1674, 416) },
      { pts: ln(1638, 416, 1678, 416) },
      { pts: ln(1650, 414, 1650, 124) },
      { pts: ln(1666, 414, 1666, 124) },
      { pts: ln(1658, 410, 1658, 130), w: 1.2, c: PAL.inkSoft },
      { pts: ln(1644, 124, 1672, 124) },
      { pts: ln(1644, 114, 1672, 114), w: 2.6 },
      { pts: circle(1658, 68, 6), w: 2.2 },
      { pts: ln(1658, 74, 1658, 98), w: 2.2 },
      { pts: ln(1658, 82, 1648, 60), w: 2.2 },
      { pts: ln(1658, 84, 1667, 94), w: 2.2 },
      { pts: ln(1658, 98, 1652, 114), w: 2.2 },
      { pts: ln(1658, 98, 1664, 114), w: 2.2 },
    ],
    { tag: 'chg' }
  );

  // 10. the Cube: a tilted cube on a slim shaft
  const cubePts = (() => {
    const cx = 1781,
      cy = 196,
      r = 40;
    const hex = [];
    for (let i = 0; i < 6; i++) {
      const a = ((30 + i * 60) * Math.PI) / 180;
      hex.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const loop = hex.concat([hex[0]]);
    return { loop, cx, cy, up: hex[0], ur: hex[2], ul: hex[4] };
  })();
  const theCube = pass(
    [
      { pts: ln(1770, GY, 1770, 238) },
      { pts: ln(1792, GY, 1792, 238) },
      { pts: ln(1766, 238, 1796, 238) },
      { pts: poly(cubePts.loop) },
      { pts: ln(cubePts.cx, cubePts.cy, cubePts.up[0], cubePts.up[1]) },
      { pts: ln(cubePts.cx, cubePts.cy, cubePts.ur[0], cubePts.ur[1]) },
      { pts: ln(cubePts.cx, cubePts.cy, cubePts.ul[0], cubePts.ul[1]) },
    ],
    { tag: 'cube' }
  );

  const landmarks = [
    { P: rotunda },
    { P: backToBack },
    { P: btTower },
    { P: colmore },
    { P: cathedral },
    { P: station },
    { P: stMartin },
    { P: library },
    { P: chamberlain },
    { P: theCube },
  ].map((m, i) => {
    m.t0 = bStart + i * bStepT;
    m.dur = bDur;
    return m;
  });

  // ---- trees: trunk then canopy, popping between the buildings
  function tree(cx, rc, th, tag) {
    return pass(
      [
        { pts: ln(cx, GY, cx, GY - th), w: 2.4 },
        { pts: circle(cx, GY - th - rc + 5, rc), w: 2.4 },
      ],
      { tag }
    );
  }
  const trees = [
    { P: tree(232, 16, 20, 't1'), t0: 6.6 },
    { P: tree(530, 18, 24, 't2'), t0: 6.95 },
    { P: tree(820, 15, 20, 't3'), t0: 7.3 },
    { P: tree(1298, 17, 22, 't4'), t0: 7.65 },
    { P: tree(1710, 16, 20, 't5'), t0: 8.0 },
    { P: tree(1862, 19, 24, 't6'), t0: 8.3 },
  ];

  // ---- clouds: scalloped arcs on a base line + a trailing dash (reference 1)
  function cloud(bumps, baseY, tag) {
    let top = [];
    for (const [bcx, br] of bumps) top = cat(top, arc(bcx, baseY, br, Math.PI, TAU));
    const x0 = bumps[0][0] - bumps[0][1] - 6;
    const last = bumps[bumps.length - 1];
    const x1 = last[0] + last[1] + 6;
    return pass(
      [
        { pts: top, w: 2.2, c: PAL.inkSoft },
        { pts: ln(x0, baseY + 2, x1, baseY + 2), w: 2.2, c: PAL.inkSoft },
        { pts: ln(x0 + 14, baseY + 14, x1 - 24, baseY + 14), w: 1.8, c: PAL.inkFaint },
      ],
      { tag }
    );
  }
  const clouds = [
    { P: cloud([[292, 26], [330, 34], [368, 24]], 84, 'c1'), t0: 8.1 },
    { P: cloud([[1152, 22], [1186, 30]], 58, 'c2'), t0: 8.5 },
    { P: cloud([[1676, 20], [1706, 26]], 114, 'c3'), t0: 8.9 },
  ];

  // ---- doodles that pop: birds, plus signs, small circles
  function bird(x, y) {
    return pass(
      [
        { pts: arc(x - 7, y + 2, 8, Math.PI * 1.12, Math.PI * 1.9), w: 1.8, c: PAL.inkSoft },
        { pts: arc(x + 7, y + 2, 8, Math.PI * 1.1, Math.PI * 1.88), w: 1.8, c: PAL.inkSoft },
      ],
      { tag: 'bird' + x }
    );
  }
  function plus(x, y) {
    return pass(
      [
        { pts: ln(x - 6, y, x + 6, y), w: 1.8, c: PAL.inkSoft },
        { pts: ln(x, y - 6, x, y + 6), w: 1.8, c: PAL.inkSoft },
      ],
      { tag: 'pl' + x + y }
    );
  }
  function dot(x, y) {
    return pass([{ pts: circle(x, y, 4.5), w: 1.8, c: PAL.inkSoft }], { tag: 'dot' + x + y });
  }
  let pt = 8.7;
  const pops = []
    .concat(
      [[480, 150], [516, 134], [960, 120], [1452, 96], [1490, 112]].map((p) => ({ P: bird(p[0], p[1]), t0: (pt += 0.16) }))
    )
    .concat(
      [[150, 150], [600, 60], [900, 92], [1120, 124], [1560, 78], [1862, 240]].map((p) => ({ P: plus(p[0], p[1]), t0: (pt += 0.14) }))
    )
    .concat([[70, 300], [1042, 62], [1602, 84], [1880, 128]].map((p) => ({ P: dot(p[0], p[1]), t0: (pt += 0.13) })));

  // ---- cars: fully drawn little cartoons that cruise along the ground
  function carGeometry(tag) {
    return pass(
      [
        { pts: ln(2, GY - 11, 76, GY - 11), w: 2.4 },
        { pts: poly([[14, GY - 13], [22, GY - 29], [46, GY - 29], [54, GY - 13]]), w: 2.4 },
        { pts: circle(20, GY - 6, 6), w: 2.2 },
        { pts: circle(58, GY - 6, 6), w: 2.2 },
        { pts: ln(30, GY - 29, 30, GY - 13), w: 1.6, c: PAL.inkSoft },
        { pts: ln(40, GY - 29, 40, GY - 13), w: 1.6, c: PAL.inkSoft },
        { pts: circle(73, GY - 16, 2.2), w: 1.8 },
      ],
      { tag }
    );
  }
  const carA = { P: carGeometry('carA'), t0: 9.4, v: 230, from: -80, dir: 1 };
  const carB = { P: carGeometry('carB'), t0: 10.3, v: 245, from: 2000, dir: -1 };

  function drawCar(ctx, car, t) {
    if (t < car.t0) return;
    const x = car.from + car.dir * car.v * (t - car.t0);
    if (x < -120 || x > 2040) return;
    ctx.save();
    ctx.translate(x, 0);
    if (car.dir < 0) ctx.scale(-1, 1);
    for (const s of car.P.strokes)
      LIB.inkPath(ctx, s.pts, { width: s.w, color: s.c, seed: s.seed, smooth: true, taper: [8, 14], wobble: 1 });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // wordmark
  // ---------------------------------------------------------------------------

  const WORD = 'Birmingham';
  const FONT = '700 92px Georgia, "Times New Roman", serif';

  function drawWordmark(ctx, t) {
    const u = seg(t, 10.8, 12.1);
    if (u <= 0) return;
    ctx.save();
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
    const tw = ctx.measureText(WORD).width;
    const x0 = W / 2 - tw / 2 - 10;
    ctx.beginPath();
    ctx.rect(x0, 440, (tw + 20) * u, H - 440);
    ctx.clip();
    ctx.fillStyle = PAL.ink;
    ctx.fillText(WORD, W / 2, 528);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // the scene
  // ---------------------------------------------------------------------------

  FILM.scene({
    id: ID,
    draw(ctx, t) {
      // paper plate
      ctx.fillStyle = PAL.paper;
      ctx.fillRect(0, 0, FILM.W, FILM.H);

      // back row ghosts in first, faint
      for (const g of ghosts) drawPass(ctx, g.P, seg(t, g.t0, g.t0 + 1.1));

      // the ground rule sweeps left to right (beats 0-2)
      drawPass(ctx, GROUND, seg(t, 0, 1.15));

      // landmarks, pen travelling left to right
      for (const m of landmarks) drawPass(ctx, m.P, seg(t, m.t0, m.t0 + m.dur));

      for (const tr of trees) drawPass(ctx, tr.P, seg(t, tr.t0, tr.t0 + 0.5));
      for (const c of clouds) drawPass(ctx, c.P, seg(t, c.t0, c.t0 + 0.6));
      for (const p of pops) drawPop(ctx, p, t);

      drawCar(ctx, carA, t);
      drawCar(ctx, carB, t);

      drawWordmark(ctx, t);
    },
  });
})();
