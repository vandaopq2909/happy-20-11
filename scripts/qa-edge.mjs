/**
 * Edge-case browser checks: reduced motion, WebGL fallback, music controls,
 * audio decode and keyboard navigation.
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const executablePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('No Chromium browser found.');

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader'],
});
const failures = [];

async function makePage(options = {}, init) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'vi-VN',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ...options,
  });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => !document.querySelector('#preloader') && window.__bloom?.current === 0,
    { timeout: 30000 },
  ).catch(() => failures.push('intro did not become ready'));
  await page.waitForTimeout(500);
  return { context, page, errors };
}

// 1. Reduced motion: all essential content should still be visible; the letter
// should be complete immediately instead of typewriting.
{
  const { context, page, errors } = await makePage({ reducedMotion: 'reduce' });
  const blossom = await page.evaluate(() => {
    const el = document.querySelector('.blossom');
    return el ? getComputedStyle(el).opacity : null;
  });
  if (blossom !== null && Number(blossom) < 0.9) failures.push(`blossoms hidden under reduced motion (${blossom})`);
  await page.locator('#open-gift').click();
  await page.waitForFunction(() => window.__bloom.current === 1, { timeout: 30000 }).catch(() => failures.push('reduced: gift did not open'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'qa-artifacts/edge-reduced-flowers.png' });
  await page.evaluate(() => window.__bloom.goTo(4));
  await page.waitForFunction(() => window.__bloom.current === 4, { timeout: 15000 }).catch(() => {});
  await page
    .waitForFunction(
      () => document.querySelector('#letter-reader')?.classList.contains('is-open'),
      { timeout: 10000 },
    )
    .catch(() => failures.push('reduced: letter did not auto-open'));
  await page.waitForTimeout(800);
  const typed = await page.evaluate(() => document.querySelector('.letter-p__typed')?.textContent?.length ?? 0);
  if (typed < 40) failures.push(`reduced motion letter was not filled immediately (${typed} chars)`);
  await page.screenshot({ path: 'qa-artifacts/edge-reduced-letter.png' });
  if (errors.length) failures.push(`reduced console errors: ${errors.join(' | ')}`);
  await context.close();
}

// 2. No WebGL: illustrated fallback should appear and be openable.
{
  const { context, page, errors } = await makePage(
    {},
    () => {
      Object.defineProperty(window, 'WebGLRenderingContext', { value: undefined, configurable: true });
    },
  );
  const fallbackVisible = await page.evaluate(() => {
    const fallback = document.querySelector('#gift-fallback');
    return Boolean(fallback && !fallback.hidden);
  });
  if (!fallbackVisible) failures.push('WebGL fallback was not visible');
  await page.screenshot({ path: 'qa-artifacts/edge-webgl-fallback.png' });
  await page.locator('#open-gift').click();
  await page.waitForFunction(() => window.__bloom.current === 1, { timeout: 20000 }).catch(() => failures.push('fallback gift did not open'));
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'qa-artifacts/edge-webgl-fallback-flowers.png' });
  if (errors.length) failures.push(`fallback console errors: ${errors.join(' | ')}`);
  await context.close();
}

// 3. Music toggle and audio file integrity.
{
  const { context, page, errors } = await makePage();
  await page.locator('#open-gift').click();
  await page.waitForFunction(() => window.__bloom.current === 1, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const started = await page.evaluate(() => window.__bloom.music.started && window.__bloom.music.playing);
  if (!started) failures.push('music did not start after opening gift');
  await page.locator('#music-toggle').click();
  await page.waitForTimeout(600);
  const paused = await page.evaluate(() => window.__bloom.music.playing);
  if (paused) failures.push('music toggle did not pause playback');
  await page.locator('#music-toggle').click();
  await page.waitForTimeout(900);
  const resumed = await page.evaluate(() => window.__bloom.music.playing);
  if (!resumed) failures.push('music toggle did not resume playback');

  const audio = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/background-music.mp3');
    if (!response.ok) return { ok: false, status: response.status };
    const buffer = await response.arrayBuffer();
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(buffer.slice(0));
    const channel = decoded.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < channel.length; i += 64) peak = Math.max(peak, Math.abs(channel[i]));
    const result = { ok: true, bytes: buffer.byteLength, duration: decoded.duration, peak, sampleRate: decoded.sampleRate };
    await ctx.close();
    return result;
  });
  if (!audio.ok || audio.duration < 30 || audio.peak < 0.05) failures.push(`audio invalid: ${JSON.stringify(audio)}`);
  console.log('audio', audio);

  // Keyboard navigation.
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1600);
  const keyboardScene = await page.evaluate(() => window.__bloom.current);
  if (keyboardScene !== 2) failures.push(`keyboard navigation failed (current ${keyboardScene})`);

  if (errors.length) failures.push(`console errors: ${errors.join(' | ')}`);
  await context.close();
}

await browser.close();
if (failures.length) {
  console.log('FAILURES');
  failures.forEach((failure) => console.log(' -', failure));
  process.exitCode = 1;
} else {
  console.log('EDGE CHECKS PASSED');
}
