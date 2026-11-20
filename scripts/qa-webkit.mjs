/**
 * Safari-engine pass using Playwright WebKit at the two priority iPhone
 * viewports. This is not a physical device, but it catches WebKit-only
 * layout/runtime issues that Chromium cannot.
 */
import { webkit } from 'playwright-core';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = path.resolve('qa-artifacts');
await mkdir(outDir, { recursive: true });

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 414, height: 896 },
  // WebKit headless renders WebGL in software; 1x keeps the Safari-engine
  // layout/runtime test representative without artificially freezing rAF.
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  locale: 'vi-VN',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await context.newPage();
const errors = [];
const failed = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  if (message.type() === 'warning' || message.type() === 'info') {
    console.log('WEBKIT', message.type(), message.text());
  }
});
page.on('requestfailed', (request) => failed.push(`${request.url()} — ${request.failure()?.errorText}`));

const shot = async (name) => {
  await page.screenshot({ path: path.join(outDir, `webkit-${name}.png`) });
  console.log('shot', name);
};
const waitReady = async (sceneId, selector) => {
  await page.waitForFunction(
    ({ id, sel }) => {
      const scene = document.querySelector(`#${id}`);
      return (
        scene?.classList.contains('is-active') &&
        !document.querySelector('#preloader') &&
        !window.__bloom?.transitioning &&
        (!sel || Number.parseFloat(getComputedStyle(document.querySelector(sel)).opacity) > 0.98)
      );
    },
    { id: sceneId, sel: selector },
    { timeout: 35000 },
  );
  await page.waitForTimeout(450);
};

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await waitReady('scene-intro', '.intro__bottom');
  const intro = await page.evaluate(() => ({
    webgl: Boolean(document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')),
    fallback: !document.querySelector('#gift-fallback')?.hidden,
    canvasHidden: document.querySelector('#gift-canvas')?.hidden,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    audio: window.__bloom?.music?.started,
    scene: window.__bloom?.current,
  }));
  console.log('webkit intro', intro);
  await shot('01-intro-414x896');

  await page.locator('#open-gift').click();
  await waitReady('scene-flowers', '.flowers__bottom');
  await shot('02-flowers-414x896');

  await page.locator('[data-next="sensei"]').click();
  await waitReady('scene-sensei', '.sensei__actions');
  await shot('03-sensei-414x896');

  await page.locator('[data-next="memories"]').click();
  await waitReady('scene-memories', '.memories__bottom');
  const album = await page.evaluate(() => ({
    slides: document.querySelectorAll('.memory-slide').length,
    chapters: document.querySelectorAll('#gallery-chapters .chapter').length,
    total: document.querySelector('#album-total')?.textContent?.trim(),
  }));
  if (album.slides !== 12 || album.chapters !== 4 || album.total !== '12') {
    errors.push(`WebKit: album expected 12 slides / 4 chapters / total 12, got ${JSON.stringify(album)}`);
  }
  await shot('04-memories-414x896');

  await page.locator('.swiper-slide-active .memory-card').click();
  await page.waitForTimeout(700);
  await shot('05-lightbox-414x896');
  await page.locator('.lightbox__close').click();
  await page.waitForTimeout(500);

  await page.locator('[data-next="letter"]').click();
  await waitReady('scene-letter', null);
  await shot('06-letter-envelope-414x896');

  await page
    .waitForFunction(
      () => document.querySelector('#letter-reader')?.classList.contains('is-open'),
      { timeout: 20000 },
    )
    .catch(() => errors.push('WebKit: letter did not open automatically'));
  await page.waitForTimeout(1800);
  await shot('07-letter-reading-414x896');

  await page.mouse.click(8, 300);
  await page
    .waitForFunction(
      () => {
        const reader = document.querySelector('#letter-reader');
        const stage = document.querySelector('#letter-stage');
        return (
          reader &&
          !reader.classList.contains('is-open') &&
          stage &&
          !stage.classList.contains('is-hidden') &&
          getComputedStyle(stage).visibility === 'visible'
        );
      },
      { timeout: 8000 },
    )
    .catch(() => errors.push('WebKit: letter did not close when clicking outside'));
  await page.waitForTimeout(700);
  await shot('08-letter-closed-414x896');

  const closedLabel = await page.locator('#open-letter .btn__text').textContent();
  if (!closedLabel?.includes('ĐỌC LẠI')) {
    errors.push(`WebKit: letter close label was not updated (${closedLabel})`);
  }

  await page.waitForTimeout(1800);
  const reopenedByItself = await page.evaluate(() =>
    document.querySelector('#letter-reader')?.classList.contains('is-open'),
  );
  if (reopenedByItself) errors.push('WebKit: letter reopened by itself after being closed');

  await page.locator('#envelope-trigger').click({ position: { x: 150, y: 100 } });
  await page
    .waitForFunction(
      () => document.querySelector('#letter-reader')?.classList.contains('is-open'),
      { timeout: 20000 },
    )
    .catch(() => errors.push('WebKit: letter did not reopen from the envelope'));

  await page.locator('#letter-paper').click({ position: { x: 180, y: 220 } });
  await page.waitForTimeout(400);
  const stillOpen = await page.evaluate(() =>
    document.querySelector('#letter-reader')?.classList.contains('is-open'),
  );
  if (!stillOpen) errors.push('WebKit: clicking the letter paper closed it unexpectedly');

  const skip = page.locator('#skip-typing');
  if (await skip.isVisible()) {
    await skip.click();
  }
  await page.waitForTimeout(500);
  await shot('08b-letter-full-414x896');

  await page.locator('[data-next="ending"]').click();
  await waitReady('scene-ending', '.ending__actions');
  await shot('09-ending-414x896');

  // Shorter iPhone 11 logical width is the same; check the 390x844 height.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(900);
  for (let index = 0; index < 6; index += 1) {
    await page.evaluate((index) => window.__bloom.goTo(index), index);
    await page.waitForFunction(
      (index) => !window.__bloom.transitioning && window.__bloom.current === index,
      index,
      { timeout: 20000 },
    ).catch(() => errors.push(`WebKit transition to scene ${index} timed out`));
    await page.waitForTimeout(700);
    const metric = await page.evaluate(() => {
      const active = document.querySelector('.scene.is-active');
      const scroll = active?.querySelector('[data-scene-scroll]');
      return {
        scene: active?.id,
        doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
        scroll: scroll ? [scroll.scrollWidth, scroll.clientWidth, scroll.scrollHeight, scroll.clientHeight] : null,
      };
    });
    console.log('webkit 390', metric);
    if (metric.doc[0] > metric.doc[1] + 1) errors.push(`doc overflow ${metric.scene}: ${metric.doc}`);
    if (metric.scroll && metric.scroll[0] > metric.scroll[1] + 1) {
      errors.push(`scroll overflow ${metric.scene}: ${metric.scroll}`);
    }
    await shot(`10-390-${index}-${metric.scene}`);
  }
} catch (error) {
  errors.push(`QA failure: ${error.message}`);
  console.error(error);
  await shot('error');
} finally {
  await browser.close();
  console.log('\nWebKit console/page errors:', errors.length ? errors : 'none');
  console.log('WebKit failed requests:', failed.length ? failed : 'none');
  if (errors.length || failed.length) process.exitCode = 1;
}
