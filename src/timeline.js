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
        title: 'The skyline inks itself as a footer',
        transitionIn: { kind: 'cut', dur: 0 },
        brief:
          'A cream paper footer. A heavy ground rule sweeps left to right on beats 0-2; faint back-row ' +
          'towers ink in behind it; then ten Birmingham landmarks are drawn one after another by a ' +
          'travelling pen, left to right (Rotunda, back-to-backs, BT Tower, Colmore hero block with the ' +
          'two corner orbs and pediment, St Philips dome, New Street shed, St Martin steeple, Library ' +
          'rings, Chamberlain column with its raised-arm statue, the Cube), each pass outlining first, ' +
          'then window lattice, then crown. Round trees pop in between the buildings, scalloped clouds ' +
          'draw across the sky with birds and + and o doodles, two little cars cruise along the ground, ' +
          'and a bold serif wordmark "Birmingham" wipes in below the ground rule on beats 18-20.',
      },
    ],
    cues: [],
  };
})();
