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
          'right on beats 0-2. The back plane rises first: a lattice mast, the one dense-grid slab, ' +
          'the hero orb tower with pediment and corner balls, a Gothic octagonal spire, a pinstripe ' +
          'slab, a plain monolith. Then the front plane inks in left to right, each building ' +
          'knocking a clean sticker margin out of the backs: a broad classical office with arched ' +
          'clerestory and sparse panes, a stepped cupola tower with dome and needle, a gabled ' +
          'tower, the twin-domed station centrepiece with a hatched staircase, a gabled Gothic ' +
          'church with rose window and corner spirelets, a broad slab with horizontal floor bands, ' +
          'an Art Deco tower crowned by a standing statue with raised arm, and a low closing ' +
          'arcade. A light-tracked BIRMINGHAM wordmark wipes in below the ground rule.',
      },
    ],
    cues: [],
  };
})();
