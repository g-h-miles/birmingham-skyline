// 01 skyline : Birmingham draws itself as a footer — traced from the reference.
// The reference (Desktop screenshot 2026-09-21 at 8.21.43 PM) mapped building-for-building.
// BACK plane, left to right: lattice mast behind the office; the ONE dense-grid slab; the orb
// tower with pediment, corner balls and a tall central ogee light; the canopied Gothic spire
// tower; the broad horizontal-floor-line slab with a tall parapet block; the two vertical-banded
// towers (square-cap rows, three-bay lights, tall base entrances); and THE VULCAN — huge raised-
// arm figure on a balustraded platform atop a slim shaft, dominating the right.
// FRONT plane, each knocking clean sticker margins out of the backs: the dense-grid office with
// parapet blocks, twin-arcade frieze and portal; the domed monument with a small figure on its
// drum; the baroque-crowned gable tower; the ROMANESQUE CHURCH (not a station) — twin DOMED
// towers with arcaded drums, pedimented facade, lunette, triple arcade and the grey hatched
// staircase; the big GOTHIC church — twin steep crocketed gables with spirelets and corner
// pinnacles, a canopied perpendicular TRACERY window (no rose), triple portal, long aisle of
// paired lancets; the low closing wall at the right edge. Built once at load; draw reads t only.
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

  // reference tones: pale hairline ink; panes lighter still
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
  // Gothic canopy: outer pointed arch over an inner one + vertical mullions (tracery light)
  function tracery(cx, topY, botY, hw) {
    const S = [{ pts: pointed(cx, topY, botY, hw), w: 1.5 }];
    S.push({ pts: pointed(cx, topY + 14, botY, hw * 0.62), w: 1.1, c: PANE });
    S.push({ pts: ln(cx - hw, topY + hw + 6, cx + hw, topY + hw + 6), w: 1.0, c: PANE }); // transom
    S.push({ pts: ln(cx, topY + hw + 6, cx, botY), w: 1.0, c: PANE }); // main mullion
    S.push({ pts: ln(cx - hw * 0.45, topY + hw + 16, cx - hw * 0.45, botY), w: 0.9, c: PANE });
    S.push({ pts: ln(cx + hw * 0.45, topY + hw + 16, cx + hw * 0.45, botY), w: 0.9, c: PANE });
    return S;
  }
  // one small pane (the reference's tiny window squares)
  function win(cx, cy, w2, h2) {
    return poly([[cx - w2, cy - h2], [cx + w2, cy - h2], [cx + w2, cy + h2], [cx - w2, cy + h2], [cx - w2, cy - h2]]);
  }
  function paneField(x0, y0, x1, y1, cols, rows, tag) {
    const r = LIB.rng(sd(tag));
    const S = [];
    for (let i = 0; i < rows; i++) {
      const y = y0 + ((y1 - y0) * i) / Math.max(1, rows - 1);
      for (let j = 0; j < cols; j++) {
        if (r() < 0.045) continue;
        const x = x0 + ((x1 - x0) * j) / Math.max(1, cols - 1);
        S.push({ pts: win(x, y, 3.6, 4.6), w: 1.0, c: PANE });
      }
    }
    return S;
  }
  function archRow(centers, y, r0, w) {
    return centers.map((x) => ({ pts: arc(x, y, r0, Math.PI, TAU), w: w || 1.6 }));
  }
  // vertical band lights: pairs of full-height lines with caps (the reference's banded towers)
  function bandLights(centers, y0, y1, hw) {
    const S = [];
    for (const bx of centers) {
      S.push({ pts: ln(bx - hw, y0, bx - hw, y1), w: 1.0, c: PANE });
      S.push({ pts: ln(bx + hw, y0, bx + hw, y1), w: 1.0, c: PANE });
      S.push({ pts: ln(bx - hw, y0, bx + hw, y0), w: 1.0, c: PANE });
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
        smooth: st.w >= 1.8,
        wobble: st.w >= 1.8 ? 1.3 : 0.4,
        tremble: 0.3,
        taper: [8, f >= 1 ? 14 : 1],
      });
    }
  }

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
  // BACK plane
  // ---------------------------------------------------------------------------

  // lattice radio mast behind the office (x 395-445)
  const bkMast = (() => {
    const cx = 420;
    const hw = (y) => 2.5 + ((GY - y) / (GY - 160)) * 12;
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

  // hero orb tower behind the domed church (x 880-1130): pediment, corner balls,
  // dense grid + the tall central ogee light the reference shows
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
      // the tall ogee light on the spine
      { pts: pointed(1005, 150, GY - 60, 13), w: 1.4 },
    ];
    S.push(...paneField(912, 140, 972, GY - 24, 5, 15, 'orba'));
    S.push(...paneField(1038, 140, 1098, GY - 24, 5, 15, 'orbb'));
    return pass(S, { w: 1.9, tag: 'orb' });
  })();

  // canopied GOTHIC spire tower (x 1180-1260), right of the orb tower
  const bkSpire = pass(
    [
      { pts: ln(1186, GY, 1186, 212) },
      { pts: ln(1254, GY, 1254, 212) },
      { pts: ln(1180, 212, 1260, 212) },
      { pts: ln(1184, 212, 1220, 52) },
      { pts: ln(1256, 212, 1220, 52) },
      { pts: circle(1220, 44, 3.4), w: 1.5 },
      // crocket ticks along both spire edges
      { pts: ln(1205, 150, 1198, 147), w: 1.1 },
      { pts: ln(1212, 108, 1206, 105), w: 1.1 },
      { pts: ln(1236, 150, 1243, 147), w: 1.1 },
      { pts: ln(1229, 108, 1235, 105), w: 1.1 },
      // corner needle pinnacles with balls
      { pts: ln(1180, 212, 1180, 184) },
      { pts: ln(1260, 212, 1260, 184) },
      { pts: circle(1180, 180, 2.4), w: 1.2 },
      { pts: circle(1260, 180, 2.4), w: 1.2 },
      // the big canopied tracery light
      ...tracery(1220, 250, 380, 18),
      { pts: ln(1186, 416, 1254, 416), w: 1.0, c: PANE },
      // small trefoil band under the light
      { pts: circle(1208, 400, 3), w: 1.0 },
      { pts: circle(1220, 398, 3), w: 1.0 },
      { pts: circle(1232, 400, 3), w: 1.0 },
    ],
    { w: 1.8, tag: 'spire' }
  );

  // the broad slab of horizontal floor lines + tall block + mid step (x 1280-1500)
  const bkBand = (() => {
    const S = [
      { pts: ln(1280, GY, 1280, 150) },
      { pts: ln(1280, 150, 1440, 150) },
      { pts: ln(1390, 150, 1390, 122) },
      { pts: ln(1390, 122, 1456, 122) },
      { pts: ln(1456, 122, 1456, 228) },
      { pts: ln(1456, 228, 1500, 228) },
      { pts: ln(1500, 228, 1500, GY) },
    ];
    for (let y = 162; y < GY - 8; y += 9) S.push({ pts: ln(1286, y, 1434, y), w: 0.9, c: PANE });
    return pass(S, { w: 1.9, tag: 'band' });
  })();

  // the two vertical-banded towers (measured): stepped A with square caps, three-bay
  // lights and tall base entrances (1516-1608), then lower B (1620-1684)
  const bkBands = pass(
    [
      // tower A
      { pts: ln(1516, GY, 1516, 308) },
      { pts: ln(1608, GY, 1608, 308) },
      { pts: ln(1516, 308, 1608, 308) },
      { pts: win(1536, 322, 4.5, 5), w: 1.0 },
      { pts: win(1554, 322, 4.5, 5), w: 1.0 },
      { pts: win(1572, 322, 4.5, 5), w: 1.0 },
      { pts: win(1590, 322, 4.5, 5), w: 1.0 },
      ...bandLights([1536, 1562, 1588], 340, 436, 6),
      // tall base entrances
      { pts: ln(1528, 470, 1528, GY) },
      { pts: ln(1544, 470, 1544, GY) },
      { pts: ln(1560, 470, 1560, GY) },
      { pts: ln(1576, 470, 1576, GY) },
      { pts: ln(1592, 470, 1592, GY) },
      { pts: ln(1528, 470, 1592, 470), w: 1.4 },
      // tower B (lower, attached right)
      { pts: ln(1620, GY, 1620, 344) },
      { pts: ln(1684, GY, 1684, 344) },
      { pts: ln(1620, 344, 1684, 344) },
      { pts: win(1640, 358, 4.5, 5), w: 1.0 },
      { pts: win(1664, 358, 4.5, 5), w: 1.0 },
      ...bandLights([1652], 376, 452, 9),
      ...paneField(1628, 396, 1634, 470, 1, 5, 'bB'),
      ...paneField(1670, 396, 1676, 470, 1, 5, 'bC'),
    ],
    { w: 1.9, tag: 'bands' }
  );

  // THE VULCAN — the giant of the strip (measured from the reference image): solid ~110 px
  // figure, tablet raised overhead, hammer at the hip, feet on the crowned tower at x 1686-1746
  const bkVulcan = (() => {
    const S = [
      // slim shaft to the ground
      { pts: ln(1698, GY, 1698, 352) },
      { pts: ln(1734, GY, 1734, 352) },
      { pts: ln(1716, 400, 1716, GY - 8), w: 1.0, c: PANE },
      { pts: ln(1694, 470, 1738, 470), w: 1.1 },
      // crown cornice with baluster dashes
      { pts: ln(1686, 344, 1746, 344), w: 1.6 },
      { pts: ln(1686, 352, 1746, 352), w: 1.6 },
      ...Array.from({ length: 10 }, (_, i) => ({ pts: ln(1690 + i * 6, 344, 1690 + i * 6, 352), w: 0.9 })),
      // ——— the figure: feet 344, tablet apex ~235 ———
      { pts: circle(1719, 272, 8), w: 1.8 }, // head
      { pts: ln(1723, 276, 1722, 281), w: 1.2 }, // beard hint
      // torso: broad shoulders, brawny, tapering to the waist
      { pts: poly([[1708, 282], [1703, 292], [1702, 308], [1706, 324], [1728, 324], [1731, 306], [1729, 290], [1721, 282]]), w: 1.8 },
      // raised right arm up to the tablet overhead
      { pts: ln(1709, 286, 1698, 262), w: 1.8 },
      { pts: ln(1698, 262, 1694, 250), w: 1.7 },
      { pts: poly([[1688, 242], [1697, 235], [1700, 246], [1691, 252]]), w: 1.6 }, // the tablet
      // left arm bent, hammer at the hip
      { pts: ln(1729, 290, 1737, 302), w: 1.7 },
      { pts: ln(1737, 302, 1731, 314), w: 1.6 },
      { pts: ln(1736, 292, 1734, 306), w: 1.2 }, // hammer head
      // drapery over the hips + legs to the crown
      { pts: ln(1707, 322, 1705, 336), w: 1.4 },
      { pts: ln(1711, 326, 1713, 336), w: 1.1, c: PANE },
      { pts: ln(1710, 336, 1708, 344), w: 1.5 },
      { pts: ln(1723, 336, 1725, 344), w: 1.5 },
      // muscle hint
      { pts: ln(1716, 292, 1718, 306), w: 0.9, c: PANE },
    ];
    return pass(S, { w: 1.7, tag: 'vulcan' });
  })();

  // the plain monolith slab, tight right of the statue tower, near its height
  const bkMono = pass(
    [
      { pts: ln(1752, GY, 1752, 252) },
      { pts: ln(1782, GY, 1782, 252) },
      { pts: ln(1752, 252, 1782, 252) },
    ],
    { w: 1.9, tag: 'mono' }
  );

  // ---------------------------------------------------------------------------
  // FRONT plane
  // ---------------------------------------------------------------------------

  // f1 broad dense-grid office (x 50-395): parapet blocks, tall-window frieze, dense grid, arcades
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

  // f2 domed monument (x 424-576): stepped shoulders, arcaded drum, dome, small figure on top
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
      { pts: ln(454, 262, 540, 262) },
      { pts: arc(497, 262, 40, Math.PI, TAU) },
      { pts: ln(497, 222, 497, 208) },
      // small statue crowning the dome
      { pts: circle(497, 200, 4.5), w: 1.5 },
      { pts: ln(497, 205, 497, 216), w: 1.5 },
      { pts: ln(497, 207, 490, 197), w: 1.3 },
      // drum panels
      { pts: ln(470, 262, 470, 240), w: 1.0, c: PANE },
      { pts: ln(497, 262, 497, 238), w: 1.0, c: PANE },
      { pts: ln(524, 262, 524, 240), w: 1.0, c: PANE },
      // pilaster bands on the shaft (the reference's vertical stripes)
      { pts: ln(452, 344, 452, 470), w: 1.0, c: PANE },
      { pts: ln(468, 344, 468, 470), w: 1.0, c: PANE },
      { pts: ln(526, 344, 526, 470), w: 1.0, c: PANE },
      { pts: ln(542, 344, 542, 470), w: 1.0, c: PANE },
      ...paneField(480, 356, 514, 460, 3, 6, 'f2p'),
      // tall double portal
      { pts: poly([[478, GY], [478, 506], [516, 506], [516, GY]]), w: 1.6 },
      { pts: ln(497, 506, 497, GY), w: 1.0, c: PANE },
    ],
    { tag: 'f2' }
  );
  const f2sil = [[418, GY + 8], [418, 330], [438, 330], [438, 286], [452, 286], [452, 262], [497, 218], [542, 262], [542, 286], [556, 286], [556, 330], [576, 330], [576, GY + 8]];

  // f7 baroque-crowned tower (x 596-678): swan-neck curved gable + arched niche, NOT a dome
  const bez = (p0, c, p1) => {
    const S = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, v = 1 - u;
      S.push([v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]]);
    }
    return S;
  };
  const f7 = pass(
    [
      { pts: ln(596, GY, 596, 320) },
      { pts: ln(678, GY, 678, 320) },
      { pts: bez([596, 320], [604, 272], [631, 262]) },
      { pts: bez([678, 320], [670, 272], [643, 262]) },
      { pts: arc(637, 262, 6, Math.PI, TAU), w: 1.5 },
      { pts: circle(637, 249, 2.4), w: 1.3 },
      { pts: pointed(637, 288, 318, 13), w: 1.3 },
      { pts: ln(596, 336, 678, 336), w: 1.1, c: PANE },
      { pts: ln(604, 352, 604, 336), w: 1.2 },
      { pts: ln(670, 352, 670, 336), w: 1.2 },
      { pts: ln(596, 352, 678, 352), w: 1.1, c: PANE },
      ...paneField(610, 372, 664, 494, 3, 8, 'f7p'),
      { pts: arc(637, GY, 13, Math.PI, TAU), w: 1.5 },
    ],
    { tag: 'f7' }
  );
  const f7sil = [[586, GY + 8], [586, 258], [637, 244], [688, 258], [688, GY + 8]];

  // f3 the ROMANESQUE church with twin DOMED towers + hatched staircase (x 680-1070)
  const f3 = pass(
    [
      // left dome tower
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
      // three arched entrances
      ...archRow([820, 875, 930], GY - 56, 17, 1.6),
      { pts: ln(803, 500, 803, GY - 56), w: 1.3 },
      { pts: ln(837, 500, 837, GY - 56), w: 1.3 },
      { pts: ln(858, 500, 858, GY - 56), w: 1.3 },
      { pts: ln(892, 500, 892, GY - 56), w: 1.3 },
      { pts: ln(913, 500, 913, GY - 56), w: 1.3 },
      { pts: ln(947, 500, 947, GY - 56), w: 1.3 },
      // the great staircase: wide hatched trapezoid with treads
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

  // f4 the GOTHIC church (x 1120-1360): twin steep crocketed gables with spirelets and
  // pinnacles, canopied perpendicular tracery window, triple portal, long aisle of lancets
  const f4 = pass(
    [
      // left tall gable with spirelet + cross finial
      { pts: ln(1132, GY, 1132, 396) },
      { pts: ln(1210, GY, 1210, 396) },
    ].concat(
      [
        { pts: ln(1128, 396, 1163, 316) },
        { pts: ln(1214, 396, 1163, 316) },
        { pts: ln(1163, 316, 1163, 296), w: 1.3 },
        { pts: ln(1157, 302, 1169, 302), w: 1.3 },
        // corner spirelet left of the gable
        { pts: ln(1116, 414, 1116, 434) },
        { pts: ln(1130, 414, 1130, 434) },
        { pts: poly([[1114, 414], [1123, 384], [1132, 414]]), w: 1.4 },
        { pts: circle(1123, 379, 2.4), w: 1.2 },
        // right taller pinnacle with a ball
        { pts: ln(1206, 396, 1206, 356) },
        { pts: ln(1218, 396, 1218, 356) },
        { pts: poly([[1204, 356], [1212, 334], [1220, 356]]), w: 1.4 },
        { pts: circle(1212, 329, 2.4), w: 1.2 },
        // second gable (right, shallower, overlapping)
        { pts: ln(1240, GY, 1240, 408) },
        { pts: ln(1316, GY, 1316, 408) },
        { pts: ln(1236, 408, 1278, 344) },
        { pts: ln(1320, 408, 1278, 344) },
        { pts: circle(1278, 337, 2.6), w: 1.3 },
        // pinnacles flanking the second gable
        { pts: ln(1228, 408, 1228, 372) },
        { pts: poly([[1222, 372], [1228, 350], [1234, 372]]), w: 1.3 },
        { pts: ln(1328, 408, 1328, 372) },
        { pts: poly([[1322, 372], [1328, 350], [1334, 372]]), w: 1.3 },
        // the big canopied perpendicular tracery window
        ...tracery(1163, 412, 486, 16),
        // triple pointed portal under the window
        { pts: pointed(1163, 502, GY, 15), w: 1.6 },
        { pts: pointed(1147, 516, GY, 6), w: 1.1 },
        { pts: pointed(1179, 516, GY, 6), w: 1.1 },
        // aisle: sloped roof down to the right, then a flat wall with paired lancets
        { pts: ln(1240, 448, 1316, 424) },
        { pts: ln(1316, GY, 1316, 424) },
        { pts: ln(1316, 466, 1360, 466) },
        { pts: ln(1360, GY, 1360, 466) },
        // paired aisle lancets with heads
        { pts: pointed(1276, 478, 516, 7), w: 1.2 },
        { pts: pointed(1296, 478, 516, 7), w: 1.2 },
        { pts: ln(1276, 528, 1296, 528), w: 1.0, c: PANE },
        { pts: pointed(1330, 492, 528, 7), w: 1.2 },
        { pts: pointed(1348, 492, 528, 7), w: 1.2 },
      ]
    ),
    { tag: 'f4' }
  );
  const f4sil = [
    [1108, GY + 8], [1108, 376], [1140, 376], [1163, 288], [1188, 376], [1222, 376], [1222, 340], [1240, 340], [1278, 330], [1322, 340], [1338, 340], [1338, 372], [1368, 456], [1368, GY + 8],
  ];

  // f5 the low annex in front of tower B (x 1612-1698): flat cornice, dash row, door
  const f5 = pass(
    [
      { pts: ln(1612, GY, 1612, 392) },
      { pts: ln(1612, 392, 1698, 392) },
      { pts: ln(1698, GY, 1698, 392) },
      ...Array.from({ length: 9 }, (_, i) => ({ pts: ln(1620 + i * 9, 402, 1620 + i * 9, 394), w: 0.9 })),
      { pts: poly([[1640, GY], [1640, 430], [1664, 430], [1664, GY]]), w: 1.4 },
    ],
    { tag: 'f5' }
  );
  const f5sil = [[1604, GY + 8], [1604, 384], [1698, 384], [1698, GY + 8]];

  // ---------------------------------------------------------------------------
  // the pen timeline (100 bpm grid, docs/storyboard.md)
  // ---------------------------------------------------------------------------

  const backs = [
    { P: bkDense, t0: 1.2, dur: 1.3 },
    { P: bkOrb, t0: 1.9, dur: 1.7 },
    { P: bkSpire, t0: 2.8, dur: 1.2 },
    { P: bkBand, t0: 3.5, dur: 1.3 },
    { P: bkBands, t0: 4.1, dur: 1.5 },
    { P: bkMast, t0: 4.7, dur: 0.8 },
    { P: bkMono, t0: 5.0, dur: 0.6 },
    { P: bkVulcan, t0: 5.3, dur: 1.3 },
  ];
  const fronts = [
    { P: f1, sil: f1sil, t0: 5.8, dur: 1.7 },
    { P: f2, sil: f2sil, t0: 6.7, dur: 1.4 },
    { P: f7, sil: f7sil, t0: 7.3, dur: 1.1 },
    { P: f3, sil: f3sil, t0: 7.8, dur: 2.2, shade: f3shade },
    { P: f4, sil: f4sil, t0: 8.9, dur: 1.8 },
    { P: f5, sil: f5sil, t0: 10.2, dur: 0.7 },
  ];

  const GROUND = pass([{ pts: ln(24, GY, 1868, GY), w: 2.6 }], { tag: 'grd', c: PAL.ink });

  // ---------------------------------------------------------------------------
  // wordmark: light serif caps, wide tracking, grey like the reference
  // ---------------------------------------------------------------------------

  const WORD = 'BIRMINGHAM';
  const FONT = '400 60px Georgia, "Times New Roman", serif';

  function drawWordmark(ctx, t) {
    const u = seg(t, 11.4, 12.7);
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
        // tone from hatching: the church staircase shades in last
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

      ctx.save();
      drawPass(ctx, GROUND, seg(t, 0.4, 0.8));
      ctx.restore();

      drawWordmark(ctx, t);
    },
  });
})();
