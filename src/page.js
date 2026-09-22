/*
 * page.js : the footer player. Not the house player.js — a footer never goes fullscreen.
 *
 * The page starts blank (paper). Pressing Start runs FILM.renderFrame(T) once per 24 fps
 * quantised step from 0 to DURATION, then holds the final drawing. The button returns as
 * Replay for a re-run. prefers-reduced-motion jumps straight to the finished drawing.
 */
(function () {
  'use strict';

  const FILM = window.FILM;
  const canvas = document.getElementById('film');
  const btn = document.getElementById('start');
  const hint = document.getElementById('hint');

  // transparent plate: the ink sits on the page's own background, no paper seam, no grain
  FILM.transparent = true;

  // crisp on retina, capped: logical 1920 px is already wider than any window
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  FILM.mount(canvas, { scale: dpr });

  const FPS = FILM.FPS;
  const DUR = FILM.DURATION;

  function draw(T) {
    FILM.errors = [];
    FILM.renderFrame(T);
    if (FILM.errors.length && window.console) console.warn('FILM errors', FILM.errors);
  }

  // t=0: an empty sheet of paper waiting to be drawn on
  draw(0);

  let raf = 0;

  function play() {
    cancelAnimationFrame(raf);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(DUR);
      return;
    }
    btn.disabled = true;
    hint.textContent = '…ink still wet';
    const t0 = performance.now();
    let lastQ = -1;
    function tick(now) {
      const T = Math.min(DUR, (now - t0) / 1000);
      const q = Math.floor(T * FPS + 1e-6) / FPS;
      if (q !== lastQ) {
        lastQ = q;
        draw(q);
      }
      if (T < DUR) {
        raf = requestAnimationFrame(tick);
      } else {
        btn.disabled = false;
        btn.textContent = 'Replay';
        hint.textContent = 'press replay — same skyline, fresh ink';
      }
    }
    raf = requestAnimationFrame(tick);
  }

  btn.addEventListener('click', play);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!btn.disabled) play();
    }
  });
})();
