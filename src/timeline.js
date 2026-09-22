// FILM.TIMELINE: "Birmingham draws itself" — one continuous footer shot.
// 100 bpm: a beat is 0.6 s. Every event in the scene sits on this grid (docs/storyboard.md).
(function () {
  'use strict';

  FILM.W = 1920;
  FILM.H = 560;
  FILM.FPS = 24;

  FILM.TIMELINE = {
    title: 'Birmingham draws itself',
    bpm: 100,
    duration: 13.2,
    width: 1920,
    height: 560,
    shots: [
      {
        id: 'skyline',
        file: '01-skyline.js',
        start: 0,
        end: 13.2,
        mode: 'illustrated',
        post: false, // transparent footer: no grain plate over the page's own background
        title: 'The skyline inks itself as a footer',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'A transparent footer plate on the page background. A thin ground rule sweeps left to ' +
          'right on beats 0-2, three faint ghost slabs peek up behind, then a dense band of ' +
          'nineteen shoulder-to-shoulder landmark buildings inks itself in one travelling pen each, ' +
          'staggered L to R: gridded corner block, cupola tower, striped slab, Gothic spire with a ' +
          'flag, pediment tower with urns, turret cluster, colonnaded classical front, bandstand ' +
          'dome, tall Gothic tower with rose window, banded block with balustrade, stepped steeple ' +
          'with clock, lattice slab with mast and orb, domed civic building, gabled terrace, belfry ' +
          'cone tower, the statue column with raised-arm figure as the tallest peak, the Colmore ' +
          'block with two corner orbs, crown slab, and a closing arcade with a pyramidal tower. ' +
          'Each pass draws outline, then window lattice, then crown. A light-tracked BIRMINGHAM ' +
          'wordmark wipes in below the ground rule on beats 18-20.',
      },
    ],
    cues: [],
  };
})();
