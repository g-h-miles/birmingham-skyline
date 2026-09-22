// 01 skyline : Birmingham draws itself as a footer — direct trace of the reference.
// Reference (Desktop screenshot 2026-09-21 8.21.43 PM) mapped at 1920x676: pale grey hairlines,
// buildings ~90% of the band, a continuous overlapping wall of architecture. BACK plane: lattice
// mast, dense-grid slab, the orb-and-pediment hero tower (behind the station), the canopied Gothic
// spire, the broad floor-banded slab, the pinstripe slab, the plain monolith. FRONT plane (each
// knocks a clean sticker margin from the backs): broad classical office with arched clerestory +
// ground arcade, statue-crowned cupola tower, the twin-domed station with the hatched staircase
// (the centrepiece), the gabled church with rose window, the balustrade statue tower, the low
// closing arcade. Built once at load; draw() reads only (ctx, t).
(function () {
  'use strict';

  const ID = 'skyline';
  const LIB = FILM.lib;
  const PAL = LIB.pal;
  const TAU = Math.PI * 2;

  const W = 1920;
  const H = 676;
  const GY = 556; // the ground rule

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const seg = (t, a, b) => sstep(a, b, t);
  let SID = 1;
  const sd = (k) => (LIB.hash(ID, k, SID++) & 0x7fffffff) || 7;

  // reference tones: pale hairline ink; panes lighter still; wordmark grey
  const LINE = PAL.inkSoft;
  const PANE = PAL.inkFaint;

  // ---------------------------------------------------------------------------
  // geometry helpers -> dense polylines
  // ---------------------------------------------------------------------------

  const STEP = 8;

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
  function pointed(cx, topY, botY, hw) {
    return poly([[cx - hw, botY], [cx - hw, topY + hw], [cx, topY], [cx + hw, topY + hw], [cx + hw, botY]]);
  }
  // one small pane (the reference's tiny window squares)
  function win(cx, cy, w2, h2) {
    return poly([[cx - w2, cy - h2], [cx + w2, cy - h2], [cx + w2, cy + h2], [cx - w2, cy + h2], [cx - w2, cy - h2]]);
  }
  // dense pane field, row by row (the reference's signature: many tiny windows, not few big ones)
  function paneField(x0, y0, x1, y1, cols, rows, tag) {
    const r = LIB.rng(sd(tag));
    const S = [];
    for (let i = 0; i < rows; i++) {
      const y = y0 + ((y1 - y0) * i) / Math.max(1, rows - 1);
      for (let j = 0; j < cols; j++) {
        if (r() < 0.045) continue; // the odd pane left out
        const x = x0 + ((x1 - x0) * j) / Math.max(1, cols - 1);
        S.push({ pts: win(x, y, 3.6, 4.6), w: 1.0, c: PANE });
      }
    }
    return S;
  }
  function archRow(centers, y, r0, w) {
    return centers.map((x) => ({ pts: arc(x, y, r0, Math.PI, TAU), w: w || 1.6 }));
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
        w: s.w != null ? s.w : o.w || 2.0,
        c: s.c || o.c || LINE,
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
        smooth: st.w >= 1.8, // panes keep crisp corners; structural lines wobble
        wobble: st.w >= 1.8 ? 1.3 : 0.4,
        tremble: 0.3,
        taper: [8, f >= 1 ? 14 : 1],
      });
    }
  }

  // Sticker overlap: a front building knocks a clean margin out of everything behind it.
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
  // BACK plane — the tall silhouettes the front wall stands against
  // ---------------------------------------------------------------------------

  // lattice radio mast, slim taper with light braces and a long needle (x 395-445)
  const bkMast = (() => {
    const cx = 420;
    const hw = (y) => 2.5 + ((GY - y) / (GY - 160)) * 12; // slim
    const S = [
      { pts: ln(cx - 14, GY, cx - 2.5, 160) },
      { pts: ln(cx + 14, GY, cx + 2.5, 160) },
      { pts: ln(cx, 160, cx, 84) },
      { pts: ln(cx - 2.5, 140, cx + 2.5, 140), w: 1.0 },
    ];
    const ys = [200, 252, 312, 378, 446, 512];
    for (let i = 0; i < ys.length; i++) {
      const y = ys[i];
      const w = hw(y);
      S.push({ pts: ln(cx - w, y, cx + w, y), w: 0.9 });
      const y2 = i + 1 < ys.length ? ys[i + 1] : GY;
      const w2 = hw(y2);
      S.push({ pts: ln(cx - w, y, cx + w2 * 0.5, y2), w: 0.8 });
      S.push({ pts: ln(cx + w, y, cx - w2 * 0.5, y2), w: 0.8 });
    }
    return pass(S, { w: 1.1, c: PANE, tag: 'mast' });
  })();

  // the ONE dense-grid slab (x 560-700)
  const bkDense = (() => {
    const S = [
      { pts: ln(560, GY, 560, 92) },
      { pts: ln(700, GY, 700, 92) },
      { pts: ln(560, 92, 700, 92) },
    ];
    for (let y = 104; y < GY - 8; y += 11) S.push({ pts: ln(566, y, 694, y), w: 0.9, c: PANE });
    for (let x = 570; x < 696; x += 11.5) S.push({ pts: ln(x, 96, x, GY - 10), w: 0.9, c: PANE });
    return pass(S, { w: 1.9, tag: 'dense' });
  })();

  // hero orb tower behind the station (x 880-1130): pediment, two corner orbs, pane columns
  const bkOrb = (() => {
    const S = [
      { pts: ln(880, GY, 880, 112) },
      { pts: ln(1130, GY, 1130, 112) },
      { pts: ln(876, 112, 1134, 112) },
      { pts: ln(876, 112, 1005, 44) },
      { pts: ln(1134, 112, 1005, 44) },
      { pts: ln(892, 100, 1118, 100), w: 1.4 },
      { pts: circle(893, 88, 11), w: 1.8 },
      { pts: circle(1117, 88, 11), w: 1.8 },
    ];
    // paired corner columns + a plain central spine with its own tall strip
    S.push({ pts: ln(1005, 112, 1005, GY - 16), w: 1.4 }, { pts: ln(990, 124, 990, GY - 16), w: 1.1 }, { pts: ln(1020, 124, 1020, GY - 16), w: 1.1 });
    S.push(...paneField(908, 134, 975, GY - 24, 5, 15, 'orba'));
    S.push(...paneField(1035, 134, 1102, GY - 24, 5, 15, 'orbb'));
    return pass(S, { w: 1.9, tag: 'orb' });
  })();

  // canopied Gothic spire tower (x 1195-1275): tall broad spire with crockets and a big light
  const bkSpire = pass(
    [
      { pts: ln(1200, GY, 1200, 230) },
      { pts: ln(1270, GY, 1270, 230) },
      { pts: ln(1195, 230, 1275, 230) },
      { pts: ln(1198, 230, 1235, 70) },
      { pts: ln(1272, 230, 1235, 70) },
      { pts: circle(1235, 62, 3.4), w: 1.5 },
      // crocket ticks along both spire edges
      { pts: ln(1220, 170, 1212, 166), w: 1.1 },
      { pts: ln(1228, 124, 1221, 121), w: 1.1 },
      { pts: ln(1250, 170, 1258, 166), w: 1.1 },
      { pts: ln(1242, 124, 1249, 121), w: 1.1 },
      // corner needle pinnacles on drum corners
      { pts: ln(1195, 230, 1195, 204), w: 1.4 },
      { pts: ln(1275, 230, 1275, 204), w: 1.4 },
      { pts: circle(1195, 200, 2.4), w: 1.2 },
      { pts: circle(1275, 200, 2.4), w: 1.2 },
      // the big canopied light: arch + inner arch + eye
      { pts: pointed(1235, 268, 384, 17), w: 1.5 },
      { pts: pointed(1235, 286, 384, 10), w: 1.1 },
      { pts: circle(1235, 306, 2.6), w: 1.1 },
      { pts: ln(1200, 440, 1270, 440), w: 1.1, c: PANE },
    ],
    { w: 1.7, tag: 'spire' }
  );

  // broad slab with horizontal floor bands + setback (x 1300-1565)
  const bkBand = (() => {
    const S = [
      { pts: ln(1300, GY, 1300, 168) },
      { pts: ln(1565, GY, 1565, 168) },
      { pts: ln(1300, 168, 1565, 168) },
      { pts: poly([[1350, 168], [1350, 138], [1520, 138], [1520, 168]]), w: 1.6 },
    ];
    for (let y = 184; y < 448; y += 10.5) S.push({ pts: ln(1308, y, 1557, y), w: 0.9, c: PANE });
    return pass(S, { w: 1.9, tag: 'band' });
  })();

  // the pinstripe slab (x 1596-1704)
  const bkPin = (() => {
    const S = [
      { pts: ln(1596, GY, 1596, 132) },
      { pts: ln(1704, GY, 1704, 132) },
      { pts: ln(1596, 132, 1704, 132) },
    ];
    for (let y = 142; y < GY - 8; y += 7.5) S.push({ pts: ln(1602, y, 1698, y), w: 0.9, c: PANE });
    return pass(S, { w: 1.9, tag: 'pin' });
  })();

  // plain monolith right edge (x 1770-1838)
  const bkMono = pass(
    [
      { pts: ln(1770, GY, 1770, 288) },
      { pts: ln(1838, GY, 1838, 288) },
      { pts: ln(1770, 288, 1838, 288) },
      { pts: ln(1804, 296, 1804, GY - 10), w: 1.0, c: PANE },
    ],
    { w: 1.8, tag: 'mono' }
  );

  // ---------------------------------------------------------------------------
  // FRONT plane — the wall of architecture, each knocking the backs clean
  // ---------------------------------------------------------------------------

  // f1 broad classical office (x 50-395): roof blocks, arched clerestory, dense panes, arcade
  const f1 = pass(
    [
      { pts: ln(50, GY, 50, 288) },
      { pts: ln(395, GY, 395, 288) },
      { pts: ln(46, 288, 399, 288) },
      { pts: poly([[62, 288], [62, 270], [110, 270], [110, 288]]), w: 1.6 },
      { pts: poly([[336, 288], [336, 270], [384, 270], [384, 288]]), w: 1.6 },
      { pts: ln(46, 312, 399, 312), w: 1.4 },
      ...archRow([78, 118, 158, 198, 238, 278, 318, 358], 312, 13, 1.4),
      ...paneField(80, 348, 365, 458, 11, 8, 'f1p'),
      { pts: ln(50, 480, 395, 480), w: 1.4 },
      ...archRow([82, 124, 166, 248, 290, 332], GY, 15, 1.4),
      { pts: poly([[202, GY], [202, 492], [236, 492], [236, GY]]), w: 1.6 },
      { pts: ln(202, 506, 236, 506), w: 1.1 },
    ],
    { tag: 'f1' }
  );
  const f1sil = [[40, GY + 8], [40, 282], [56, 264], [116, 264], [116, 282], [330, 282], [330, 264], [390, 264], [390, 282], [405, 282], [405, GY + 8]];

  // f2 cupola tower with a statue on the dome (x 428-566)
  const f2 = pass(
    [
      { pts: ln(428, GY, 428, 336) },
      { pts: ln(566, GY, 566, 336) },
      { pts: ln(424, 336, 570, 336) },
      { pts: ln(446, 336, 446, 292) },
      { pts: ln(548, 336, 548, 292) },
      { pts: ln(442, 292, 552, 292) },
      { pts: ln(458, 292, 458, 262) },
      { pts: ln(536, 292, 536, 262) },
      { pts: arc(497, 262, 40, Math.PI, TAU) },
      { pts: ln(497, 222, 497, 208) },
      // small statue crowning the dome (the reference's figure)
      { pts: circle(497, 200, 4.5), w: 1.5 },
      { pts: ln(497, 205, 497, 216), w: 1.5 },
      { pts: ln(497, 207, 490, 197), w: 1.3 },
      // drum panels
      { pts: ln(470, 262, 470, 240), w: 1.0, c: PANE },
      { pts: ln(497, 262, 497, 238), w: 1.0, c: PANE },
      { pts: ln(524, 262, 524, 240), w: 1.0, c: PANE },
      ...paneField(448, 366, 546, 480, 6, 7, 'f2p'),
      { pts: poly([[478, GY], [478, 506], [516, 506], [516, GY]]), w: 1.6 },
      { pts: ln(478, 520, 516, 520), w: 1.1 },
    ],
    { tag: 'f2' }
  );
  const f2sil = [[418, GY + 8], [418, 330], [438, 330], [438, 286], [452, 286], [452, 262], [497, 218], [542, 262], [542, 286], [556, 286], [556, 330], [576, 330], [576, GY + 8]];

  // f3 THE STATION centrepiece (x 690-1060): twin dome towers, pedimented facade, staircase
  const f3 = pass(
    [
      // left dome tower: sides, drum, dome, finial; two arcade tiers
      { pts: ln(690, GY, 690, 372) },
      { pts: ln(786, GY, 786, 420) },
      { pts: ln(684, 372, 792, 372) },
      { pts: arc(738, 372, 50, Math.PI, TAU) },
      { pts: ln(738, 322, 738, 310), w: 1.3 },
      { pts: circle(738, 305, 3.2), w: 1.3 },
      ...archRow([716, 738, 760], 402, 10, 1.3),
      { pts: ln(690, 452, 786, 452), w: 1.1, c: PANE },
      ...archRow([716, 738, 760], 476, 10, 1.3),
      { pts: ln(690, 512, 786, 512), w: 1.1, c: PANE },
      // right dome tower (mirrored)
      { pts: ln(1060, GY, 1060, 372) },
      { pts: ln(964, GY, 964, 420) },
      { pts: ln(958, 372, 1066, 372) },
      { pts: arc(1012, 372, 50, Math.PI, TAU) },
      { pts: ln(1012, 322, 1012, 310), w: 1.3 },
      { pts: circle(1012, 305, 3.2), w: 1.3 },
      ...archRow([990, 1012, 1034], 402, 10, 1.3),
      { pts: ln(964, 452, 1060, 452), w: 1.1, c: PANE },
      ...archRow([990, 1012, 1034], 476, 10, 1.3),
      { pts: ln(964, 512, 1060, 512), w: 1.1, c: PANE },
      // central facade: cornice, pediment, great lunette
      { pts: ln(786, 420, 786, 432) },
      { pts: ln(964, 420, 964, 432) },
      { pts: ln(782, 432, 968, 432) },
      { pts: ln(782, 432, 875, 378) },
      { pts: ln(968, 432, 875, 378) },
      { pts: circle(875, 418, 3), w: 1.3 },
      { pts: arc(875, 452, 26, Math.PI, TAU), w: 1.5 },
      { pts: ln(875, 452, 875, 428), w: 1.1, c: PANE },
      { pts: ln(856, 452, 863, 436), w: 1.1, c: PANE },
      { pts: ln(894, 452, 887, 436), w: 1.1, c: PANE },
      { pts: ln(848, 452, 848, 434), w: 1.1, c: PANE },
      { pts: ln(902, 452, 902, 434), w: 1.1, c: PANE },
      { pts: ln(786, 466, 964, 466), w: 1.1, c: PANE },
      // three tall arched entrances
      ...archRow([820, 875, 930], GY - 56, 17, 1.6),
      { pts: ln(803, 500, 803, GY - 56), w: 1.3 },
      { pts: ln(837, 500, 837, GY - 56), w: 1.3 },
      { pts: ln(858, 500, 858, GY - 56), w: 1.3 },
      { pts: ln(892, 500, 892, GY - 56), w: 1.3 },
      { pts: ln(913, 500, 913, GY - 56), w: 1.3 },
      { pts: ln(947, 500, 947, GY - 56), w: 1.3 },
      // the great staircase: one wide trapezoid with treads, hatched (reference grey)
      { pts: poly([[790, 500], [960, 500], [1016, GY], [734, GY]]), w: 1.5 },
      { pts: ln(784, 512, 966, 512), w: 1.0, c: PANE },
      { pts: ln(774, 524, 976, 524), w: 1.0, c: PANE },
      { pts: ln(764, 536, 986, 536), w: 1.0, c: PANE },
      { pts: ln(752, 548, 998, 548), w: 1.0, c: PANE },
    ],
    { tag: 'f3' }
  );
  const f3sil = [
    [680, GY + 8], [680, 366], [738, 300], [796, 366], [796, 424], [808, 424], [875, 360], [942, 424], [954, 424], [954, 366], [1012, 300], [1070, 366], [1070, 500], [1024, 560], [726, 560],
  ];
  const f3shade = [[790, 500], [960, 500], [1016, GY], [734, GY]];

  // f4 gabled Gothic church (x 1100-1330): rose window, spirelets, aisle
  const f4 = pass(
    [
      { pts: ln(1130, GY, 1130, 410) },
      { pts: ln(1280, GY, 1280, 410) },
      { pts: ln(1126, 410, 1205, 330) },
      { pts: ln(1284, 410, 1205, 330) },
      { pts: circle(1205, 322, 3), w: 1.4 },
      // corner spirelets
      { pts: ln(1114, 380, 1114, 410) },
      { pts: ln(1132, 380, 1132, 410) },
      { pts: poly([[1112, 380], [1123, 348], [1134, 380]]), w: 1.4 },
      { pts: circle(1123, 342, 2.6), w: 1.2 },
      { pts: ln(1278, 380, 1278, 410) },
      { pts: ln(1296, 380, 1296, 410) },
      { pts: poly([[1276, 380], [1287, 348], [1298, 380]]), w: 1.4 },
      { pts: circle(1287, 342, 2.6), w: 1.2 },
      // rose window
      { pts: circle(1205, 402, 17), w: 1.4 },
      { pts: ln(1205, 385, 1205, 419), w: 1.0, c: PANE },
      { pts: ln(1188, 402, 1222, 402), w: 1.0, c: PANE },
      { pts: ln(1193, 390, 1217, 414), w: 1.0, c: PANE },
      { pts: ln(1217, 390, 1193, 414), w: 1.0, c: PANE },
      // gable-eye + door
      { pts: circle(1205, 366, 3.4), w: 1.2 },
      { pts: pointed(1205, 470, GY, 17), w: 1.6 },
      // right aisle, lower, paired lancets
      { pts: ln(1280, 458, 1330, 458) },
      { pts: ln(1330, GY, 1330, 458) },
      { pts: pointed(1298, 486, 528, 8), w: 1.2 },
      { pts: pointed(1318, 486, 528, 8), w: 1.2 },
      { pts: ln(1280, 540, 1330, 540), w: 1.0, c: PANE },
    ],
    { tag: 'f4' }
  );
  const f4sil = [[1104, GY + 8], [1104, 336], [1140, 336], [1205, 316], [1272, 336], [1304, 336], [1304, 452], [1340, 452], [1340, GY + 8]];

  // f6 statue tower (x 1390-1560): balustrade frieze, standing figure with raised arm
  const f6 = pass(
    [
      { pts: ln(1390, GY, 1390, 330) },
      { pts: ln(1560, GY, 1560, 330) },
      { pts: ln(1386, 330, 1564, 330) },
      // balustrade
      { pts: ln(1386, 320, 1564, 320), w: 1.2 },
      ...Array.from({ length: 24 }, (_, i) => ({ pts: ln(1394 + i * 7, 320, 1394 + i * 7, 311), w: 0.9 })),
      // plinth + robed statue with raised arm (the reference figure is solid, not a stick)
      { pts: poly([[1444, 311], [1444, 288], [1506, 288], [1506, 311]]), w: 1.4 },
      { pts: circle(1475, 236, 6.5), w: 1.6 },
      // cloak/body: closed outline, shoulders to hem
      { pts: poly([[1468, 244], [1464, 262], [1463, 288], [1487, 288], [1485, 260], [1481, 244], [1475, 242]]), w: 1.6 },
      // raised arm to a pointing hand
      { pts: ln(1469, 248, 1452, 222), w: 1.6 },
      { pts: circle(1450, 219, 2.4), w: 1.3 },
      { pts: ln(1481, 254, 1489, 266), w: 1.3 },
      // facade: three tall banded lights with caps + a row of small squares
      { pts: ln(1414, 352, 1414, 470), w: 1.1, c: PANE },
      { pts: ln(1428, 352, 1428, 470), w: 1.1, c: PANE },
      { pts: ln(1414, 352, 1428, 352), w: 1.1, c: PANE },
      { pts: ln(1468, 352, 1468, 470), w: 1.1, c: PANE },
      { pts: ln(1482, 352, 1482, 470), w: 1.1, c: PANE },
      { pts: ln(1468, 352, 1482, 352), w: 1.1, c: PANE },
      { pts: ln(1522, 352, 1522, 470), w: 1.1, c: PANE },
      { pts: ln(1536, 352, 1536, 470), w: 1.1, c: PANE },
      { pts: ln(1522, 352, 1536, 352), w: 1.1, c: PANE },
      { pts: ln(1408, 336, 1542, 336), w: 1.0, c: PANE },
      ...[1418, 1442, 1466, 1490, 1514, 1538].map((x) => ({ pts: win(x, 344, 4, 4.6), w: 1.0, c: PANE })),
      { pts: poly([[1452, GY], [1452, 500], [1500, 500], [1500, GY]]), w: 1.6 },
      { pts: ln(1452, 514, 1500, 514), w: 1.1 },
    ],
    { tag: 'f6' }
  );
  const f6sil = [[1380, GY + 8], [1380, 324], [1432, 324], [1432, 240], [1450, 210], [1475, 198], [1514, 240], [1514, 324], [1570, 324], [1570, GY + 8]];

  // f7 baroque-crowned tower in front of the dense slab (x 596-678)
  const f7 = pass(
    [
      { pts: ln(596, GY, 596, 320) },
      { pts: ln(678, GY, 678, 320) },
      { pts: ln(592, 320, 682, 320) },
      { pts: arc(637, 320, 41, Math.PI, TAU) },
      { pts: circle(637, 271, 3), w: 1.3 },
      { pts: arc(637, 320, 15, Math.PI, TAU), w: 1.2 },
      { pts: ln(596, 336, 678, 336), w: 1.1, c: PANE },
      ...paneField(610, 356, 664, 492, 3, 8, 'f7p'),
      { pts: arc(637, GY, 13, Math.PI, TAU), w: 1.5 },
    ],
    { tag: 'f7' }
  );
  const f7sil = [[586, GY + 8], [586, 314], [637, 262], [688, 314], [688, GY + 8]];

  // f8 the low closing wall (x 1600-1896): cornice + arcade, ends the strip low like the reference
  const f8 = pass(
    [
      { pts: ln(1600, GY, 1600, 452) },
      { pts: ln(1600, 452, 1896, 452) },
      { pts: ln(1896, GY, 1896, 452) },
      { pts: ln(1600, 468, 1896, 468), w: 1.1, c: PANE },
      ...archRow([1640, 1702, 1764, 1826, 1884], GY, 14, 1.4),
    ],
    { tag: 'f8' }
  );
  const f8sil = [[1592, GY + 8], [1592, 444], [1896, 444], [1896, GY + 8]];

  // ---------------------------------------------------------------------------
  // the pen timeline (100 bpm grid, docs/storyboard.md)
  // ---------------------------------------------------------------------------

  const backs = [
    { P: bkDense, t0: 1.2, dur: 1.3 },
    { P: bkOrb, t0: 1.9, dur: 1.7 },
    { P: bkSpire, t0: 2.8, dur: 1.1 },
    { P: bkBand, t0: 3.4, dur: 1.5 },
    { P: bkPin, t0: 4.2, dur: 1.1 },
    { P: bkMono, t0: 4.9, dur: 0.8 },
    { P: bkMast, t0: 5.3, dur: 0.9 },
  ];
  const fronts = [
    { P: f1, sil: f1sil, t0: 5.8, dur: 1.7 },
    { P: f2, sil: f2sil, t0: 6.7, dur: 1.4 },
    { P: f7, sil: f7sil, t0: 7.3, dur: 1.1 },
    { P: f3, sil: f3sil, t0: 7.8, dur: 2.2, shade: f3shade },
    { P: f4, sil: f4sil, t0: 8.9, dur: 1.5 },
    { P: f6, sil: f6sil, t0: 9.6, dur: 1.6 },
    { P: f8, sil: f8sil, t0: 10.5, dur: 1.0 },
  ];

  const GROUND = pass([{ pts: ln(24, GY, 1896, GY), w: 2.6 }], { tag: 'grd', c: PAL.ink });

  // ---------------------------------------------------------------------------
  // wordmark: light serif caps, wide tracking, grey like the reference
  // ---------------------------------------------------------------------------

  const WORD = 'BIRMINGHAM';
  const FONT = '400 60px Georgia, "Times New Roman", serif';

  function drawWordmark(ctx, t) {
    const u = seg(t, 11.5, 12.8);
    if (u <= 0) return;
    ctx.save();
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '30px';
    const tw = ctx.measureText(WORD).width;
    const x0 = W / 2 - tw / 2 - 12;
    ctx.beginPath();
    ctx.rect(x0, 576, (tw + 24) * u, H - 576);
    ctx.clip();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = PAL.ink;
    ctx.fillText(WORD, W / 2, 644);
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
        if (f.shade && u > 0.72) {
          const a = seg(u, 0.72, 1);
          ctx.save();
          ctx.globalAlpha = 0.55 * a;
          LIB.hatch(ctx, f.shade, {
            angle: -0.08,
            spacing: 4.5,
            width: 1.1,
            color: PANE,
            alpha: 0.9,
            seed: sd('shade'),
            length: [80, 300],
            gap: [1, 2],
            inset: 1,
            overshoot: 0,
            density: 0.95,
          });
          ctx.restore();
        }
      }

      // front knocks erased ground segments: restore the rule on top
      ctx.save();
      drawPass(ctx, GROUND, seg(t, 0.4, 0.8));
      ctx.restore();

      drawWordmark(ctx, t);
    },
  });
})();
