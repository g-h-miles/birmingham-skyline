// headless check of the page: load index.html, click Start, sample frames, catch console errors
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.tmp-page/blank.png' });

  await page.click('#start');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '.tmp-page/mid.png' });
  // wait for the full run + buffer
  await page.waitForFunction(() => document.getElementById('start').textContent === 'Replay', { timeout: 8000 });
  await page.screenshot({ path: '.tmp-page/final.png' });

  const fps = await page.evaluate(() => {
    const t0 = performance.now();
    FILM.renderFrame(6.5);
    let n = 0;
    while (performance.now() - t0 < 500) { FILM.renderFrame(6.5); n++; }
    return n * 2;
  });
  console.log('render throughput ~' + Math.round(fps) + ' fps at 1920x560');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
  if (errors.length) process.exit(1);
})();
