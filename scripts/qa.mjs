/**
 * Browser QA for Bloom of Gratitude.
 * Usage: node scripts/qa.mjs [baseUrl]
 * Requires playwright-core and a local Chromium (Chrome/Edge or Playwright browser).
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  `${process.env.LOCALAPPDATA || ''}/ms-playwright/chromium-1234/chrome-win64/chrome.exe`,
];
const executablePath = candidates.find((candidate) => candidate && existsSync(candidate));
if (!executablePath) throw new Error('No Chromium browser found.');

const outDir = path.resolve('qa-artifacts');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--disable-dev-shm-usage'],
});

const errors = [];
const failedRequests = [];
const context = await browser.newContext({
  viewport: { width: 414, height: 896 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'vi-VN',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('requestfailed', (request) => {
  failedRequests.push(`${request.url()} â€” ${request.failure()?.errorText}`);
});

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
  console.log('shot', name);
}

async function waitReady(sceneId, selector, timeout = 30000) {
  await page.waitForFunction(
    ({ targetScene, targetSelector }) => {
      const scene = document.querySelector(`#${targetScene}`);
      if (!scene?.classList.contains('is-active')) return false;
      if (document.querySelector('#preloader')) return false;
      if (window.__bloom?.transitioning) return false;
      if (targetSelector) {
        const element = document.querySelector(targetSelector);
        if (element && Number.parseFloat(getComputedStyle(element).opacity) < 0.98) return false;
      }
      return true;
    },
    { targetScene: sceneId, targetSelector: selector },
    { timeout },
  ).catch(() => {
    errors.push(`Timed out waiting for ${sceneId} / ${selector}`);
  });
  await page.waitForTimeout(450);
}

async function metrics(label) {
  const data = await page.evaluate(() => {
    const active = document.querySelector('.scene.is-active');
    const scroll = active?.querySelector('[data-scene-scroll]');
    const webgl = (() => {
      const c = document.createElement('canvas');
      return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
    })();
    return {
      scene: active?.id,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      viewport: [window.innerWidth, window.innerHeight],
      activeScrollWidth: scroll?.scrollWidth ?? null,
      activeClientWidth: scroll?.clientWidth ?? null,
      scrollHeight: scroll?.scrollHeight ?? null,
      clientHeight: scroll?.clientHeight ?? null,
      webgl,
      audio: window.__bloom?.music?.started,
      current: window.__bloom?.current,
    };
  });
  console.log(label, JSON.stringify(data));
  return data;
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await waitReady('scene-intro', '.intro__bottom');
  await metrics('intro');
  await shot('01-intro-414x896');

  // Open the gift.
  await page.locator('#open-gift').click();
  await waitReady('scene-flowers', '.flowers__bottom');
  await metrics('flowers');
  await shot('02-flowers-414x896');

  // Sensei.
  await page.locator('[data-next="sensei"]').click();
  await waitReady('scene-sensei', '.sensei__actions');
  await metrics('sensei');
  await shot('03-sensei-414x896');

  // Memories.
  await page.locator('[data-next="memories"]').click();
  await waitReady('scene-memories', '.memories__bottom');
  const albumState = await page.evaluate(() => ({
    slides: document.querySelectorAll('.memory-slide').length,
    chapters: document.querySelectorAll('#gallery-chapters .chapter').length,
    total: document.querySelector('#album-total')?.textContent?.trim(),
  }));
  if (albumState.slides !== 12) errors.push(`Expected 12 album slides, found ${albumState.slides}`);
  if (albumState.chapters !== 4) errors.push(`Expected 4 album chapters, found ${albumState.chapters}`);
  if (albumState.total !== '12') errors.push(`Album total label is ${albumState.total}`);
  await metrics('memories');
  await shot('04-memories-414x896');

  // Lightbox.
  await page.locator('.swiper-slide-active .memory-card').click();
  await page.waitForTimeout(700);
  await shot('05-lightbox-414x896');
  await page.locator('.lightbox__close').click();
  await page.waitForTimeout(450);

  // Letter: it should open by itself after the scene has settled.
  await page.locator('[data-next="letter"]').click();
  await waitReady('scene-letter', null);
  await metrics('letter');
  await shot('06-letter-envelope-414x896');

  await page
    .waitForFunction(
      () => document.querySelector('#letter-reader')?.classList.contains('is-open'),
      { timeout: 15000 },
    )
    .catch(() => errors.push('Letter did not open automatically'));
  await page.waitForTimeout(1800);
  await shot('07-letter-reading-414x896');

  // Tap the dimmed area outside the paper: the letter should close and the
  // envelope should be available again.
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
      { timeout: 6000 },
    )
    .catch(() => errors.push('Letter did not close when clicking outside'));
  await page.waitForTimeout(700);
  await shot('08-letter-closed-414x896');

  const closedLabel = await page.locator('#open-letter .btn__text').textContent();
  if (!closedLabel?.includes('ĐỌC LẠI')) {
    errors.push(`Letter close label was not updated (${closedLabel})`);
  }

  // It must stay closed until explicitly opened again.
  await page.waitForTimeout(1800);
  const reopenedByItself = await page.evaluate(() =>
    document.querySelector('#letter-reader')?.classList.contains('is-open'),
  );
  if (reopenedByItself) errors.push('Letter reopened by itself after being closed');

  // Clicking the envelope must bring the same letter back.
  await page.locator('#envelope-trigger').click({ position: { x: 150, y: 100 } });
  await page
    .waitForFunction(
      () => document.querySelector('#letter-reader')?.classList.contains('is-open'),
      { timeout: 15000 },
    )
    .catch(() => errors.push('Letter did not reopen from the envelope'));

  // A tap on the paper itself must not close it.
  await page.locator('#letter-paper').click({ position: { x: 180, y: 220 } });
  await page.waitForTimeout(350);
  const stillOpen = await page.evaluate(() =>
    document.querySelector('#letter-reader')?.classList.contains('is-open'),
  );
  if (!stillOpen) errors.push('Clicking the letter paper closed it unexpectedly');

  const skip = page.locator('#skip-typing');
  if (await skip.isVisible()) {
    await skip.click();
  }
  await page.waitForTimeout(500);
  await shot('08b-letter-full-414x896');

  // Ending.
  await page.locator('[data-next="ending"]').click();
  await waitReady('scene-ending', '.ending__actions');
  await metrics('ending');
  await shot('09-ending-414x896');

  // Restart.
  await page.locator('#restart').click();
  await waitReady('scene-intro', '.intro__bottom');
  await metrics('restart');
  await shot('10-restart-414x896');

  // 390 x 844 pass, quick viewport check.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(900);
  await metrics('restart-390x844');
  await shot('11-intro-390x844');

  // Horizontal overflow check on all scenes by direct navigation.
  for (let index = 2; index < 6; index += 1) {
    await page.evaluate((i) => window.__bloom.goTo(i), index);
    await page.waitForTimeout(2600);
    const result = await metrics(`scene-${index}-390x844`);
    if (result.docScrollWidth > result.docClientWidth + 1) {
      errors.push(`Horizontal overflow on scene ${index}: ${result.docScrollWidth} > ${result.docClientWidth}`);
    }
    if (result.activeScrollWidth && result.activeScrollWidth > result.activeClientWidth + 1) {
      errors.push(
        `Horizontal overflow in scroll container on scene ${index}: ${result.activeScrollWidth} > ${result.activeClientWidth}`,
      );
    }
    await shot(`12-scene-${index}-390x844`);
  }

  console.log('\nConsole/page errors:', errors.length ? errors : 'none');
  console.log('Failed requests:', failedRequests.length ? failedRequests : 'none');
} catch (error) {
  errors.push(`QA failure: ${error.stack || error.message}`);
  console.error(error);
  await shot('error-state');
} finally {
  await browser.close();
  if (errors.length) {
    console.log('\nFAILURES');
    errors.forEach((error) => console.log(' -', error));
    process.exitCode = 1;
  }
}

