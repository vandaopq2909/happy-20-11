/**
 * Builds the 1200×630 social sharing card from the live site's fonts and
 * the real sensei portrait. Run: node scripts/generate-og.mjs
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
];
const executablePath = candidates.find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('No Chromium browser found.');

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

await page.evaluate(() => {
  const style = document.createElement('style');
  style.textContent = `
    .og-card { position: fixed; inset: 0; z-index: 9999; overflow: hidden; color: #fff9fc;
      background:
        radial-gradient(ellipse at 72% 38%, rgba(246,191,214,.22), transparent 42%),
        radial-gradient(ellipse at 20% 80%, rgba(155,121,214,.2), transparent 45%),
        linear-gradient(145deg, #160c22 0%, #2d1838 55%, #180d24 100%);
      font-family: 'Be Vietnam Pro', sans-serif; }
    .og-card::before { content:''; position:absolute; inset:0;
      background-image: radial-gradient(rgba(255,255,255,.28) .7px, transparent .8px);
      background-size: 54px 54px; opacity:.24; mask-image: linear-gradient(90deg, #000, transparent 65%); }
    .og-card::after { content:''; position:absolute; inset:22px; border:1px solid rgba(232,199,122,.28); }
    .og-copy { position: absolute; top: 88px; left: 72px; width: 640px; z-index: 2; }
    .og-mark { display:flex; align-items:center; gap:12px; color:#e8c77a; font-size:11px; letter-spacing:.32em; font-weight:600; }
    .og-mark svg { width:30px; height:30px; }
    .og-kicker { margin-top:50px; color:rgba(255,249,252,.52); font-size:10px; letter-spacing:.34em; }
    .og-title { margin:12px 0 0; font-family:'Playfair Display', serif; font-size:56px; font-weight:500; line-height:.98; letter-spacing:-.03em; }
    .og-title em { font-style:italic; color:#f6bfd6; }
    .og-name { margin-top:20px; font-family:'Playfair Display', serif; font-size:34px; font-weight:500; letter-spacing:.01em; }
    .og-role { margin-top:6px; color:#e8c77a; font-size:10px; letter-spacing:.3em; }
    .og-quote { margin-top:20px; max-width:440px; color:rgba(255,249,252,.68); font-family:'Playfair Display',serif;
      font-style:italic; font-size:18px; line-height:1.55; }
    .og-bottom { position:absolute; left:74px; bottom:54px; z-index:2; display:flex; align-items:center; gap:18px;
      color:rgba(255,249,252,.48); font-size:10px; letter-spacing:.26em; }
    .og-bottom b { color:#f6bfd6; font-family:'Playfair Display',serif; font-size:26px; letter-spacing:.09em; font-weight:500; }
    .og-line { width:44px; height:1px; background:rgba(232,199,122,.5); }
    .og-portrait { position:absolute; right:80px; top:58px; width:340px; height:514px; z-index:2;
      padding:9px; border:1px solid rgba(232,199,122,.55); border-radius:190px 190px 10px 10px;
      background:linear-gradient(160deg, rgba(255,241,217,.14), rgba(246,191,214,.04));
      box-shadow:0 30px 80px rgba(3,1,8,.5); transform:rotate(2deg); }
    .og-portrait img { width:100%; height:100%; object-fit:cover; border-radius:182px 182px 5px 5px; filter:saturate(.95); }
    .og-badge { position:absolute; right:60px; top:106px; z-index:3; padding:8px 14px; border-radius:99px;
      border:1px solid rgba(232,199,122,.5); background:rgba(17,8,25,.65); color:#ffe3a6; font-size:9px; letter-spacing:.18em; }
    .og-flower { position:absolute; z-index:3; width:90px; height:90px; color:#f6bfd6; opacity:.7; left:-38px; bottom:70px; transform:rotate(-20deg); }
    .og-flower svg { width:100%; height:100%; }
  `;
  document.head.appendChild(style);
  const card = document.createElement('div');
  card.className = 'og-card';
  card.innerHTML = `
    <div class="og-copy">
      <div class="og-mark">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-opacity=".4"/><g fill="#f6bfd6"><ellipse cx="24" cy="12.5" rx="4.4" ry="7.2"/><ellipse cx="24" cy="12.5" rx="4.4" ry="7.2" transform="rotate(72 24 24)"/><ellipse cx="24" cy="12.5" rx="4.4" ry="7.2" transform="rotate(144 24 24)"/><ellipse cx="24" cy="12.5" rx="4.4" ry="7.2" transform="rotate(216 24 24)"/><ellipse cx="24" cy="12.5" rx="4.4" ry="7.2" transform="rotate(288 24 24)"/></g><circle cx="24" cy="24" r="3" fill="#E8C77A"/></svg>
        ĐÓA HOA TRI ÂN
      </div>
      <p class="og-kicker">20 · 11 · 2026 · VIETNAMESE TEACHERS' DAY</p>
      <h1 class="og-title">Tri ân <em>người thầy</em><br>Người truyền lửa võ đạo</h1>
      <p class="og-name">Nguyễn Xuân Hải Âu</p>
      <p class="og-role">KARATE SENSEI · CỐ VẤN CLB VÕ THUẬT HUIT</p>
      <p class="og-quote">“Người truyền cảm hứng, bản lĩnh và tinh thần võ đạo.”</p>
    </div>
    <div class="og-portrait">
      <img src="/assets/images/teacher/sensei-portrait.webp" alt="">
      <div class="og-flower"><svg viewBox="-50 -50 100 100"><g fill="currentColor"><ellipse cx="0" cy="-28" rx="13" ry="24"/><ellipse cx="0" cy="-28" rx="13" ry="24" transform="rotate(72)"/><ellipse cx="0" cy="-28" rx="13" ry="24" transform="rotate(144)"/><ellipse cx="0" cy="-28" rx="13" ry="24" transform="rotate(216)"/><ellipse cx="0" cy="-28" rx="13" ry="24" transform="rotate(288)"/></g><circle r="10" fill="#E8C77A"/></svg></div>
    </div>
    <span class="og-badge">A GIFT FOR OUR SENSEI</span>
    <div class="og-bottom"><b>20 · 11</b><span class="og-line"></span><span>KARATE HUIT</span></div>
  `;
  document.body.appendChild(card);
});

await page.waitForTimeout(600);
const target = path.resolve('assets/images/backgrounds/og-cover.png');
await mkdir(path.dirname(target), { recursive: true });
await page.screenshot({ path: target, type: 'png' });
await browser.close();
console.log('wrote', target);
