// FILM.TIMELINE: "Birmingham draws itself" — one continuous footer shot.
// 100 bpm: a beat is 0.6 s. Every event in the scene sits on this grid (docs/storyboard.md).
(function () {
  'use strict';

  FILM.W = 1920;
  FILM.H = 676;
  FILM.FPS = 24;

  FILM.TIMELINE = {
    title: 'Birmingham draws itself',
    bpm: 100,
    duration: 13.2,
    width: 1920,
    height: 676,
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
          'right on beats 0-2. The back plane rises first: the ONE dense-grid slab, the orb tower ' +
          'with pediment, corner balls and tall central ogee light, the canopied Gothic spire, the ' +
          'broad slab of horizontal floor lines with its stepped block, the two vertical-banded ' +
          'towers, the slim lattice mast, the plain monolith and THE VULCAN — solid figure, tablet ' +
          'raised overhead, hammer at the hip, crowning a slim denticulated tower at the right. ' +
          'Then the front plane inks in left to right, each knocking a clean sticker margin out of ' +
          'the backs: the dense-grid office with parapet blocks, arched clerestory, pane wall and ' +
          'ground arcade; the domed monument with a small figure on its drum and a double portal; ' +
          'the baroque-crowned gable tower; the Romanesque twin-DOMED church with arcaded drums, ' +
          'pediment, lunette, triple arcade and hatched staircase; the Gothic church of two steep ' +
          'crocketed gables with spirelets, pinnacles, a canopied tracery light and an aisle of ' +
          'paired lancets; and the low annex block. A light-tracked BIRMINGHAM wordmark wipes in ' +
          'below the ground rule.',
      },
    ],
    cues: [],
  };
})();
