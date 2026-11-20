/**
 * Generates the original, illustrated placeholder artwork used by the site.
 * No photographs of real people are used. Run with:
 *   node scripts/generate-art.mjs
 */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'assets', 'images');
const chromeCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = chromeCandidates.find((p) => existsSync(p));
if (!executablePath) throw new Error('No Chromium browser found for artwork rendering.');

const gold = '#E8C77A';
const rose = '#F6BFD6';
const cream = '#FFF9FC';

const defs = (id, palette) => `
  <defs>
    <radialGradient id="halo-${id}" cx="50%" cy="38%" r="62%">
      <stop offset="0" stop-color="${palette.glow}" stop-opacity=".88"/>
      <stop offset=".48" stop-color="${palette.glow}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${palette.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="${palette.sky1}"/>
      <stop offset=".55" stop-color="${palette.sky2}"/>
      <stop offset="1" stop-color="${palette.sky3}"/>
    </linearGradient>
    <linearGradient id="floor-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.floor1}"/>
      <stop offset="1" stop-color="${palette.floor2}"/>
    </linearGradient>
    <linearGradient id="lightbeam-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF6DD" stop-opacity=".38"/>
      <stop offset="1" stop-color="#FFF6DD" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vignette-${id}" cx="50%" cy="46%" r="72%">
      <stop offset=".5" stop-color="#170C20" stop-opacity="0"/>
      <stop offset="1" stop-color="#130A1B" stop-opacity=".72"/>
    </radialGradient>
    <filter id="soft-${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
    <filter id="glow-${id}" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="grain-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer>
    </filter>
    <pattern id="tatami-${id}" width="210" height="120" patternUnits="userSpaceOnUse">
      <rect width="210" height="120" fill="none"/>
      <path d="M0 0H210M0 120H210M0 0V120M210 0V120" stroke="${gold}" stroke-opacity=".13" stroke-width="2"/>
      <path d="M0 60H210" stroke="${gold}" stroke-opacity=".055" stroke-width="1"/>
    </pattern>
  </defs>`;

const blossom = (x, y, s = 1, fill = rose, opacity = 0.85) => `
  <g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
    ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-13" rx="7.5" ry="13" fill="${fill}" transform="rotate(${a})"/>`).join('')}
    <circle r="5.3" fill="${gold}"/>
    <circle r="2" fill="#FFF2D0"/>
  </g>`;

const petal = (x, y, s = 1, fill = rose, opacity = 0.55, r = 16) =>
  `<ellipse cx="${x}" cy="${y}" rx="${5.2 * s}" ry="${10 * s}" fill="${fill}" opacity="${opacity}" transform="rotate(${r} ${x} ${y})"/>`;

const grain = (id) => `<rect width="1200" height="1500" filter="url(#grain-${id})" opacity=".55" style="mix-blend-mode:soft-light"/>`;

const frame = (id, inner) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#170D20"/>
  ${inner}
  <rect x="30" y="30" width="1140" height="1440" fill="none" stroke="${gold}" stroke-opacity=".34" stroke-width="2"/>
  <path d="M30 140V30H140M1060 30h110v110M1170 1360v110h-110M140 1470H30v-110" fill="none" stroke="${gold}" stroke-opacity=".65" stroke-width="3"/>
  ${grain(id)}
  <rect width="1200" height="1500" fill="url(#vignette-${id})"/>
</svg>`;

const skyline = (id, palette) => `
  <rect width="1200" height="1500" fill="url(#sky-${id})"/>
  <rect width="1200" height="1500" fill="url(#halo-${id})"/>
  <ellipse cx="600" cy="540" rx="380" ry="380" fill="${palette.glow}" opacity=".16" filter="url(#soft-${id})"/>
`;

function dojo(id, palette, { window = true, rays = true } = {}) {
  return `
  ${skyline(id, palette)}
  ${window ? `
  <g opacity=".82">
    <rect x="252" y="238" width="696" height="790" rx="6" fill="#1C1028" stroke="${gold}" stroke-opacity=".5" stroke-width="3"/>
    <rect x="276" y="262" width="648" height="742" fill="${palette.window}" opacity=".68"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${276 + 162 * i} 262V1004M276 ${262 + 185.5 * i}H924" stroke="#2A1734" stroke-width="${i === 0 ? 0 : 9}" opacity=".55"/>`).join('')}
    <rect x="276" y="262" width="648" height="742" fill="url(#lightbeam-${id})"/>
  </g>` : ''}
  ${rays ? `
  <g opacity=".38" style="mix-blend-mode:screen">
    <path d="M665 250L280 1120L480 1170L790 340Z" fill="url(#lightbeam-${id})"/>
    <path d="M760 270L450 1135L570 1170L880 360Z" fill="url(#lightbeam-${id})" opacity=".7"/>
  </g>` : ''}
  <path d="M0 1030H1200V1500H0Z" fill="url(#floor-${id})"/>
  <path d="M0 1030H1200" stroke="${gold}" stroke-opacity=".36" stroke-width="3"/>
  <rect y="1060" width="1200" height="440" fill="url(#tatami-${id})" opacity=".7"/>
  <path d="M100 1500L430 1030M1100 1500L770 1030" stroke="${gold}" stroke-opacity=".12" stroke-width="2"/>`;
}

function figure(x, y, scale, color, pose = 'stand', opacity = 1, rim = gold) {
  const poses = {
    stand: {
      head: [100, 48, 29],
      body: 'M100 88 C92 120 88 178 94 228',
      arms: ['M98 112 C78 154 70 190 66 232', 'M102 112 C122 150 134 186 138 226'],
      legs: ['M94 228 C78 290 68 350 60 410', 'M96 228 C112 292 122 354 132 412'],
    },
    bow: {
      head: [128, 92, 28],
      body: 'M124 124 C140 154 136 194 112 226',
      arms: ['M128 136 C148 170 150 192 145 218', 'M120 138 C102 172 98 196 104 220'],
      legs: ['M112 226 C108 292 92 348 82 410', 'M114 226 C126 292 134 354 140 412'],
    },
    punch: {
      head: [100, 50, 28],
      body: 'M100 88 C94 142 92 188 98 226',
      arms: ['M96 112 C60 120 38 112 12 102', 'M105 118 C126 154 138 184 150 210'],
      legs: ['M98 226 C56 280 44 336 26 402', 'M100 226 C140 284 160 342 184 406'],
    },
    kick: {
      head: [102, 50, 28],
      body: 'M102 88 C96 136 94 174 102 210',
      arms: ['M96 116 C64 142 54 174 58 204', 'M108 116 C138 128 154 154 158 186'],
      legs: ['M100 210 C90 274 80 332 66 396', 'M102 210 C154 190 194 146 222 106'],
    },
    block: {
      head: [100, 52, 29],
      body: 'M100 90 C94 144 94 184 100 226',
      arms: ['M96 116 C64 126 50 108 38 84', 'M104 116 C136 126 152 108 164 84'],
      legs: ['M100 226 C76 292 64 348 48 408', 'M100 226 C124 292 140 350 158 410'],
    },
    kneel: {
      head: [100, 88, 26],
      body: 'M100 122 C96 164 96 198 100 232',
      arms: ['M96 146 C70 166 62 194 72 218', 'M104 146 C132 166 138 194 128 218'],
      legs: ['M100 232 C72 274 54 308 34 330', 'M100 232 C130 270 144 300 166 326'],
    },
  };
  const p = poses[pose] || poses.stand;
  const limb = (d, w = 20) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `
  <g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}">
    <ellipse cx="100" cy="420" rx="120" ry="22" fill="#100817" opacity=".38"/>
    ${limb(p.legs[0], 23)}${limb(p.legs[1], 23)}
    ${limb(p.body, 48)}
    ${limb(p.arms[0], 18)}${limb(p.arms[1], 18)}
    <circle cx="${p.head[0]}" cy="${p.head[1]}" r="${p.head[2]}" fill="${color}"/>
    <path d="M${p.head[0] - 22} ${p.head[1] - 22} C${p.head[0] - 6} ${p.head[1] - 38} ${p.head[0] + 24} ${p.head[1] - 20} ${p.head[0] + 19} ${p.head[1] + 3}" fill="none" stroke="${rim}" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
    <path d="${p.body}" fill="none" stroke="${rim}" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function galleryScene(id, palette, content) {
  return frame(id, `${defs(id, palette)}${content}`);
}

const palettes = {
  dawn: { sky1: '#28142F', sky2: '#5D2947', sky3: '#1A0F24', glow: '#FFD9B5', window: '#FFE9C6', floor1: '#2D1830', floor2: '#130B1D' },
  plum: { sky1: '#21132F', sky2: '#4C2647', sky3: '#170C22', glow: '#F3AFCB', window: '#F8CFDF', floor1: '#2B1732', floor2: '#120A1C' },
  gold: { sky1: '#1C1129', sky2: '#3B2336', sky3: '#150B1E', glow: '#F3D59A', window: '#FBE6B8', floor1: '#25162C', floor2: '#100813' },
  rose: { sky1: '#2A152E', sky2: '#6A3351', sky3: '#190D23', glow: '#FFC7D9', window: '#FFDDE6', floor1: '#301A33', floor2: '#150B1F' },
  night: { sky1: '#120B23', sky2: '#2A1740', sky3: '#0D0718', glow: '#CBB5FF', window: '#A9A0D8', floor1: '#1C112A', floor2: '#090512' },
};

const scenes = [];

scenes.push({
  slug: '01-the-first-bow',
  title: 'The Beginning',
  palette: palettes.dawn,
  body: `${dojo('b1', palettes.dawn)}
    <g opacity=".92">${figure(430, 595, 1.62, '#1A0D1E', 'bow')}</g>
    <path d="M258 1030H944" stroke="${gold}" stroke-opacity=".55" stroke-width="3"/>
    ${blossom(294, 250, 1.35, '#FFE0E9', 0.8)}
    ${blossom(1020, 560, 1.1, '#F6BFD6', 0.7)}
    ${blossom(860, 190, .9, '#FFE8EF', 0.55)}
    ${Array.from({ length: 24 }, (_, i) => petal(120 + ((i * 137) % 980), 300 + ((i * 211) % 1080), 0.8 + (i % 3) * .35, '#F8C7D9', .35, i * 31)).join('')}
    <g opacity=".8" filter="url(#glow-b1)">
      <circle cx="600" cy="590" r="14" fill="${gold}" opacity=".7"/>
      <circle cx="600" cy="590" r="38" fill="none" stroke="${gold}" stroke-opacity=".2"/>
      <circle cx="600" cy="590" r="76" fill="none" stroke="${gold}" stroke-opacity=".08"/>
    </g>
    <text x="600" y="1330" text-anchor="middle" font-family="Georgia,serif" font-size="28" letter-spacing="14" fill="${gold}" opacity=".26">BEGINNING</text>`,
});

scenes.push({
  slug: '02-dojo-morning',
  title: 'The Beginning',
  palette: palettes.gold,
  body: `${dojo('b2', palettes.gold)}
    ${figure(180, 690, 1.02, '#170D1B', 'stand', .75)}
    ${figure(390, 640, 1.12, '#170D1B', 'stand', .9)}
    ${figure(625, 640, 1.12, '#170D1B', 'stand', .9)}
    ${figure(860, 690, 1.02, '#170D1B', 'stand', .75)}
    <g opacity=".9" transform="translate(600 420)">
      <circle r="152" fill="none" stroke="${gold}" stroke-opacity=".35" stroke-width="2"/>
      <circle r="118" fill="none" stroke="${gold}" stroke-opacity=".16"/>
      <path d="M-72 0H72M0-72V72" stroke="${gold}" stroke-opacity=".18"/>
    </g>
    <path d="M0 1190H1200" stroke="${gold}" stroke-opacity=".18"/>
    ${Array.from({ length: 14 }, (_, i) => petal(120 + i * 73, 128 + ((i * 173) % 620), .9 + (i % 3) * .4, '#F8D9A8', .32, i * 17)).join('')}
    <text x="600" y="1340" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="12" fill="${gold}" opacity=".22">THE FIRST STEP</text>`,
});

scenes.push({
  slug: '03-kata-in-light',
  title: 'Training Moments',
  palette: palettes.plum,
  body: `${dojo('b3', palettes.plum)}
    <path d="M0 0H1200V1500H0Z" fill="${paletteGlow(palettes.plum)}" opacity=".04"/>
    <g opacity=".95">${figure(470, 520, 1.85, '#160B1C', 'block')}</g>
    <g opacity=".5" filter="url(#soft-b3)"><circle cx="600" cy="700" r="240" fill="${rose}"/></g>
    <path d="M330 1120C490 1050 690 1050 860 1120" stroke="${gold}" stroke-opacity=".3" stroke-width="2"/>
    ${blossom(218, 420, 1.6, '#E9A9C7', .6)}
    ${blossom(1010, 300, 1.2, '#F6BFD6', .5)}
    ${blossom(930, 890, .8, '#FFE4ED', .45)}
    ${Array.from({ length: 30 }, (_, i) => petal(80 + ((i * 151) % 1060), 150 + ((i * 223) % 1200), .7 + (i % 4) * .3, '#F4B3CE', .3, i * 23)).join('')}
    <text x="600" y="1335" text-anchor="middle" font-family="Georgia,serif" font-size="28" letter-spacing="13" fill="${gold}" opacity=".24">KATA Â· DISCIPLINE</text>`,
});

scenes.push({
  slug: '04-kick-at-sunset',
  title: 'Training Moments',
  palette: palettes.rose,
  body: `${dojo('b4', palettes.rose, { rays: true })}
    <g opacity=".98">${figure(430, 480, 1.95, '#190C1F', 'kick')}</g>
    <g opacity=".55" filter="url(#soft-b4)"><ellipse cx="700" cy="710" rx="300" ry="110" fill="${rose}"/></g>
    <path d="M0 1170C220 1120 350 1120 600 1180S980 1230 1200 1160" fill="none" stroke="${gold}" stroke-opacity=".22" stroke-width="2"/>
    ${blossom(200, 250, 1.45, '#FFDDE8', .65)}
    ${blossom(1040, 650, 1.0, '#F6BFD6', .55)}
    ${Array.from({ length: 28 }, (_, i) => petal(60 + ((i * 179) % 1080), 240 + ((i * 247) % 1130), .8 + (i % 3) * .4, '#FFCFDF', .35, i * 29)).join('')}
    <text x="600" y="1345" text-anchor="middle" font-family="Georgia,serif" font-size="27" letter-spacing="12" fill="${gold}" opacity=".23">STRENGTH Â· FOCUS</text>`,
});

scenes.push({
  slug: '05-the-guidance',
  title: 'Brotherhood',
  palette: palettes.dawn,
  body: `${dojo('b5', palettes.dawn)}
    ${figure(300, 660, 1.28, '#1A0D20', 'stand', .86)}
    <g opacity="1">${figure(545, 610, 1.42, '#160A1C', 'punch')}</g>
    <g opacity=".7" filter="url(#soft-b5)"><circle cx="700" cy="670" r="175" fill="${gold}"/></g>
    <path d="M650 675C700 665 750 670 792 690" stroke="${gold}" stroke-width="4" stroke-linecap="round" stroke-opacity=".55"/>
    <circle cx="792" cy="690" r="4" fill="${gold}"/>
    ${blossom(950, 290, 1.3, '#FFE0E9', .62)}
    ${blossom(170, 950, .95, '#F6BFD6', .48)}
    ${Array.from({ length: 22 }, (_, i) => petal(95 + ((i * 191) % 1010), 170 + ((i * 233) % 1160), .7 + (i % 3) * .35, '#F9C9DA', .3, i * 37)).join('')}
    <text x="600" y="1340" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="12" fill="${gold}" opacity=".22">GUIDANCE Â· TRUST</text>`,
});

scenes.push({
  slug: '06-circle-of-brothers',
  title: 'Brotherhood',
  palette: palettes.plum,
  body: `${dojo('b6', palettes.plum, { window: false })}
    <g opacity=".58" transform="translate(600 690)">
      <circle r="300" fill="none" stroke="${gold}" stroke-opacity=".18"/>
      <circle r="352" fill="none" stroke="${gold}" stroke-opacity=".1"/>
      <path d="M-330 0H330M0-330V330" stroke="${gold}" stroke-opacity=".08"/>
    </g>
    ${figure(110, 760, .96, '#160B1D', 'stand', .8)}
    ${figure(330, 680, 1.08, '#160B1D', 'block', .9)}
    ${figure(560, 740, .98, '#160B1D', 'bow', .84)}
    ${figure(790, 690, 1.08, '#160B1D', 'punch', .9)}
    ${figure(1010, 770, .95, '#160B1D', 'stand', .76)}
    ${Array.from({ length: 44 }, (_, i) => petal(50 + ((i * 131) % 1110), 130 + ((i * 209) % 1220), .6 + (i % 4) * .3, '#F1AECA', .28, i * 19)).join('')}
    <text x="600" y="1345" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="12" fill="${gold}" opacity=".24">WE RISE TOGETHER</text>`,
});

scenes.push({
  slug: '07-black-belt',
  title: 'Memories',
  palette: palettes.gold,
  body: `${skyline('b7', palettes.gold)}
    <ellipse cx="600" cy="760" rx="470" ry="330" fill="url(#floor-b7)" opacity=".9"/>
    <rect y="990" width="1200" height="510" fill="url(#tatami-b7)" opacity=".55"/>
    <g transform="translate(600 760)">
      <g transform="rotate(-7)">
        <path d="M-335 70C-280-45-90-95 15-35C110 18 85 144-20 160C-140 180-300 150-335 70Z" fill="#1B101F" stroke="${gold}" stroke-opacity=".35" stroke-width="3"/>
        <path d="M-160-50C-45-82 150-48 240 38" fill="none" stroke="${gold}" stroke-opacity=".16" stroke-width="2"/>
        <path d="M-320 78C-120 128 110 120 320 52" fill="none" stroke="${gold}" stroke-opacity=".15" stroke-width="2"/>
      </g>
      <g transform="translate(250 -25) rotate(5)">
        <rect x="-26" y="-110" width="52" height="220" rx="20" fill="#24142A" stroke="${gold}" stroke-opacity=".3" stroke-width="2"/>
      </g>
      <g transform="translate(-18 -5)">
        <circle r="84" fill="#21132A" stroke="${gold}" stroke-width="2"/>
        <circle r="67" fill="none" stroke="${gold}" stroke-opacity=".4"/>
        <path d="M-34 6L0-29L34 6L0 41Z" fill="none" stroke="${gold}" stroke-width="2"/>
        <circle r="8" fill="${gold}"/>
      </g>
    </g>
    ${blossom(235, 350, 2.2, '#F6BFD6', .55)}
    ${blossom(1010, 1100, 1.7, '#FFE0E9', .45)}
    ${Array.from({ length: 32 }, (_, i) => petal(80 + ((i * 163) % 1040), 150 + ((i * 197) % 1220), .8 + (i % 4) * .35, '#F7D4AA', .3, i * 41)).join('')}
    <text x="600" y="1355" text-anchor="middle" font-family="Georgia,serif" font-size="27" letter-spacing="13" fill="${gold}" opacity=".3">A BELT IS A BEGINNING</text>`,
});

scenes.push({
  slug: '08-medal-of-memory',
  title: 'Memories',
  palette: palettes.night,
  body: `${skyline('b8', palettes.night)}
    <g opacity=".55" filter="url(#soft-b8)"><circle cx="600" cy="650" r="360" fill="${gold}"/></g>
    <path d="M600 150V1080M160 650H1040" stroke="${gold}" stroke-opacity=".09" stroke-width="2"/>
    <g transform="translate(600 630)">
      <path d="M-105-215L-18-64H18L105-215" fill="none" stroke="${rose}" stroke-width="44" stroke-linejoin="round" opacity=".8"/>
      <path d="M-112-215L-20-64M112-215L20-64" stroke="${gold}" stroke-opacity=".4" stroke-width="3"/>
      <circle r="170" fill="#1B1026" stroke="${gold}" stroke-opacity=".55" stroke-width="3"/>
      <circle r="143" fill="none" stroke="${gold}" stroke-opacity=".25"/>
      <path d="M0-92L27-30L94-21L44 24L57 90L0 58L-57 90L-44 24L-94-21L-27-30Z" fill="${gold}" opacity=".82"/>
      <circle r="38" fill="#21132A" stroke="${gold}" stroke-opacity=".6"/>
      <path d="M-13 0L-3 12L15-12" fill="none" stroke="${gold}" stroke-width="4" stroke-linecap="round"/>
    </g>
    ${blossom(230, 300, 1.8, '#F3B7D1', .5)}
    ${blossom(985, 1040, 1.4, '#D9C0FF', .38)}
    ${Array.from({ length: 40 }, (_, i) => {
      const x = 100 + ((i * 149) % 1000);
      const y = 120 + ((i * 227) % 1210);
      return `<circle cx="${x}" cy="${y}" r="${1 + (i % 3)}" fill="${i % 2 ? gold : rose}" opacity="${.2 + (i % 4) * .1}"/>`;
    }).join('')}
    <text x="600" y="1348" text-anchor="middle" font-family="Georgia,serif" font-size="27" letter-spacing="13" fill="${gold}" opacity=".25">EVERY MEDAL HAS A STORY</text>`,
});

scenes.push({
  slug: '09-sunset-journey',
  title: 'The Journey',
  palette: palettes.rose,
  body: `${dojo('b9', palettes.rose, { window: false, rays: false })}
    <rect width="1200" height="1500" fill="url(#halo-b9)"/>
    <g transform="translate(600 500)">
      <circle r="295" fill="#FFD9AA" opacity=".18" filter="url(#soft-b9)"/>
      <circle r="238" fill="#FFE3B8" opacity=".22"/>
      <circle r="192" fill="#FFF0D8" opacity=".32"/>
    </g>
    <path d="M0 1070C190 1010 310 1035 455 1080S720 1140 840 1070S1090 1015 1200 1050V1500H0Z" fill="#170C20" opacity=".9"/>
    <path d="M0 1120C190 1060 330 1085 475 1130S735 1180 870 1110S1080 1060 1200 1095" fill="none" stroke="${gold}" stroke-opacity=".35" stroke-width="2"/>
    ${figure(370, 720, 1.28, '#160B1D', 'stand', .96)}
    ${figure(605, 740, 1.16, '#160B1D', 'bow', .9)}
    ${figure(810, 755, 1.03, '#160B1D', 'stand', .82)}
    ${blossom(960, 330, 1.8, '#F6BFD6', .7)}
    ${blossom(210, 280, 1.2, '#FFE2EC', .55)}
    ${Array.from({ length: 34 }, (_, i) => petal(80 + ((i * 173) % 1070), 120 + ((i * 251) % 1230), .7 + (i % 4) * .35, '#F7B9D0', .32, i * 33)).join('')}
    <text x="600" y="1340" text-anchor="middle" font-family="Georgia,serif" font-size="27" letter-spacing="12" fill="${gold}" opacity=".25">THE ROAD WE SHARE</text>`,
});

scenes.push({
  slug: '10-together',
  title: 'The Journey',
  palette: palettes.plum,
  body: `${skyline('b10', palettes.plum)}
    <g opacity=".33">
      <circle cx="290" cy="310" r="3" fill="${gold}"/>
      <circle cx="940" cy="260" r="2" fill="${rose}"/>
      <circle cx="1050" cy="720" r="3" fill="${gold}"/>
      <circle cx="160" cy="780" r="2" fill="${rose}"/>
    </g>
    <path d="M0 1030H1200V1500H0Z" fill="url(#floor-b10)"/>
    <rect y="1030" width="1200" height="470" fill="url(#tatami-b10)" opacity=".55"/>
    <g opacity=".55" filter="url(#soft-b10)"><ellipse cx="600" cy="760" rx="430" ry="260" fill="${rose}"/></g>
    ${figure(150, 665, 1.0, '#180C1E', 'punch', .82)}
    ${figure(385, 710, 1.1, '#180C1E', 'stand', .9)}
    ${figure(610, 665, 1.22, '#180C1E', 'block', .96)}
    ${figure(845, 705, 1.08, '#180C1E', 'stand', .9)}
    ${figure(1040, 700, .94, '#180C1E', 'punch', .78)}
    ${Array.from({ length: 52 }, (_, i) => petal(40 + ((i * 137) % 1120), 100 + ((i * 211) % 1230), .7 + (i % 4) * .35, i % 3 ? '#F6BFD6' : '#E8C77A', .34, i * 27)).join('')}
    <path d="M300 250C380 200 470 180 560 200M700 180C820 160 900 200 940 260" fill="none" stroke="${gold}" stroke-opacity=".22" stroke-width="2"/>
    <text x="600" y="1340" text-anchor="middle" font-family="Georgia,serif" font-size="27" letter-spacing="12" fill="${gold}" opacity=".28">FOREVER A TEAM</text>`,
});

scenes.push({
  slug: '11-sensei-and-students',
  title: 'With Our Sensei',
  palette: palettes.dawn,
  body: `${dojo('b11', palettes.dawn)}
    <g opacity=".6" filter="url(#soft-b11)"><circle cx="600" cy="660" r="300" fill="${gold}"/></g>
    <g opacity=".66" transform="translate(600 650)">
      <circle r="300" fill="none" stroke="${gold}" stroke-opacity=".24"/>
      <circle r="338" fill="none" stroke="${gold}" stroke-opacity=".12"/>
      <path d="M-340 0H340M0-340V340" stroke="${gold}" stroke-opacity=".08"/>
    </g>
    ${figure(118, 755, 1.02, '#170D1B', 'stand', .78)}
    ${figure(305, 690, 1.22, '#170D1B', 'block', .9)}
    ${figure(510, 548, 1.62, '#150A1B', 'stand', 1)}
    ${figure(805, 690, 1.2, '#170D1B', 'bow', .88)}
    ${figure(995, 750, 1.0, '#170D1B', 'stand', .76)}
    <path d="M575 690C630 676 690 676 748 692" stroke="${gold}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
    <circle cx="753" cy="692" r="4" fill="${gold}"/>
    ${blossom(200, 285, 1.3, '#FFE2EC', .6)}
    ${blossom(1000, 330, 1.15, '#F6BFD6', .55)}
    ${blossom(930, 1040, .8, '#FFE9F0', .4)}
    ${Array.from({ length: 30 }, (_, i) => petal(60 + ((i * 173) % 1070), 150 + ((i * 239) % 1190), .7 + (i % 4) * .3, '#F8C7D9', .3, i * 31)).join('')}
    <text x="600" y="1340" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="12" fill="${gold}" opacity=".25">SENSEI &amp; STUDENTS</text>`,
});

scenes.push({
  slug: '12-one-club',
  title: 'Our Club',
  palette: palettes.plum,
  body: `${dojo('b12', palettes.plum, { window: false })}
    <g opacity=".58" filter="url(#soft-b12)"><ellipse cx="600" cy="740" rx="440" ry="290" fill="${rose}"/></g>
    <g opacity=".55" transform="translate(600 650)">
      <circle r="360" fill="none" stroke="${gold}" stroke-opacity=".17"/>
      <circle r="300" fill="none" stroke="${gold}" stroke-opacity=".09" stroke-dasharray="2 14"/>
    </g>
    ${figure(54, 760, .9, '#170B1D', 'stand', .74)}
    ${figure(225, 700, 1.0, '#170B1D', 'block', .85)}
    ${figure(402, 660, 1.1, '#170B1D', 'stand', .9)}
    ${figure(568, 530, 1.5, '#160A1C', 'stand', 1)}
    ${figure(850, 660, 1.08, '#170B1D', 'punch', .9)}
    ${figure(1015, 720, .98, '#170B1D', 'stand', .8)}
    <path d="M600 430V1130M120 760H1080" stroke="${gold}" stroke-opacity=".07" stroke-width="2"/>
    ${blossom(175, 300, 1.5, '#F6BFD6', .55)}
    ${blossom(1025, 280, 1.2, '#FFE4ED', .48)}
    ${blossom(965, 1080, 1.0, '#F6BFD6', .42)}
    ${Array.from({ length: 52 }, (_, i) => petal(35 + ((i * 137) % 1130), 105 + ((i * 211) % 1250), .6 + (i % 4) * .35, i % 3 ? '#F6BFD6' : '#E8C77A', .32, i * 23)).join('')}
    <text x="600" y="1345" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="12" fill="${gold}" opacity=".27">ONE CLUB · ONE HEART</text>`,
});

function paletteGlow(p) { return p.glow; }

function portrait() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <defs>
    <radialGradient id="bg" cx="50%" cy="34%" r="82%">
      <stop offset="0" stop-color="#6A3C5C"/>
      <stop offset=".4" stop-color="#3B203C"/>
      <stop offset="1" stop-color="#140B1E"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="52%">
      <stop offset="0" stop-color="#FFE6C2" stop-opacity=".58"/>
      <stop offset=".42" stop-color="#F6BFD6" stop-opacity=".2"/>
      <stop offset="1" stop-color="#F6BFD6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gi" x1=".15" y1="0" x2=".85" y2="1">
      <stop offset="0" stop-color="#FFFCF3"/>
      <stop offset=".38" stop-color="#F5EAE4"/>
      <stop offset=".72" stop-color="#DCCBD0"/>
      <stop offset="1" stop-color="#A994AE"/>
    </linearGradient>
    <linearGradient id="giShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#B6A1B2" stop-opacity=".5"/>
      <stop offset=".28" stop-color="#F9F0E9" stop-opacity="0"/>
      <stop offset=".7" stop-color="#F9F0E9" stop-opacity="0"/>
      <stop offset="1" stop-color="#95809E" stop-opacity=".56"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8D674E"/>
      <stop offset=".5" stop-color="#5E3E32"/>
      <stop offset="1" stop-color="#3A231F"/>
    </linearGradient>
    <linearGradient id="belt" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#08050A"/>
      <stop offset=".45" stop-color="#241725"/>
      <stop offset="1" stop-color="#08050A"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="44%" r="72%">
      <stop offset=".42" stop-color="#0D0715" stop-opacity="0"/>
      <stop offset="1" stop-color="#090510" stop-opacity=".86"/>
    </radialGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="46"/></filter>
    <filter id="glow" x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <rect width="1200" height="1500" fill="url(#halo)"/>
  <g opacity=".16" stroke="#E8C77A" fill="none">
    <circle cx="600" cy="520" r="438" stroke-width="2"/>
    <circle cx="600" cy="520" r="474" stroke-width="1"/>
    <path d="M600 30v1000M100 520h1000" stroke-width="1"/>
  </g>
  <g opacity=".26">
    <circle cx="600" cy="500" r="366" fill="none" stroke="#E8C77A" stroke-dasharray="2 18" stroke-width="2"/>
    <circle cx="600" cy="500" r="312" fill="none" stroke="#F6BFD6" stroke-dasharray="1 24" stroke-width="1"/>
  </g>
  <g opacity=".48" filter="url(#soft)"><ellipse cx="390" cy="370" rx="300" ry="340" fill="#F6BFD6"/></g>
  <g filter="url(#soft)" opacity=".45"><circle cx="600" cy="480" r="250" fill="#FFE7C7"/></g>

  <!-- inner arch -->
  <g opacity=".62">
    <path d="M255 1330V600C255 407 409 280 600 280C791 280 945 407 945 600V1330" fill="none" stroke="#E8C77A" stroke-opacity=".32" stroke-width="2"/>
    <path d="M280 1330V604C280 424 422 305 600 305C778 305 920 424 920 604V1330" fill="none" stroke="#E8C77A" stroke-opacity=".14"/>
  </g>

  <!-- cherry branch -->
  <g opacity=".82">
    <path d="M-20 350C160 385 280 485 360 660" fill="none" stroke="#2C1428" stroke-width="16" stroke-linecap="round"/>
    <path d="M135 380C200 320 265 290 345 275M260 465C320 440 380 442 435 468M330 575C390 558 442 564 490 592" fill="none" stroke="#2C1428" stroke-width="8" stroke-linecap="round"/>
    ${blossom(160, 366, 1.3, '#F6BFD6', .86)}
    ${blossom(345, 274, 1.05, '#FFE3EC', .72)}
    ${blossom(436, 469, .9, '#E9A8C4', .65)}
    ${blossom(491, 593, .72, '#F6BFD6', .5)}
    ${blossom(274, 442, .62, '#FFDCE8', .55)}
    ${Array.from({ length: 14 }, (_, i) => petal(50 + ((i * 181) % 560), 250 + ((i * 173) % 680), .7 + (i % 3) * .3, '#F7BDD2', .3, i * 31)).join('')}
  </g>

  <!-- hanging rail and hook -->
  <g>
    <rect x="320" y="276" width="560" height="10" rx="5" fill="url(#wood)" opacity=".8"/>
    <path d="M600 286V214C600 184 622 165 648 173" fill="none" stroke="#E8C77A" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <path d="M574 286V230" stroke="#E8C77A" stroke-opacity=".34" stroke-width="2"/>
  </g>

  <!-- wooden hanger -->
  <g opacity=".95">
    <path d="M438 354L600 300L762 354" fill="none" stroke="url(#wood)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M600 300V250" stroke="#8D674E" stroke-width="9" stroke-linecap="round"/>
    <circle cx="600" cy="248" r="5" fill="#E8C77A" opacity=".6"/>
  </g>

  <!-- karate gi hanging -->
  <g>
    <!-- sleeves -->
    <path d="M442 345C390 352 342 392 320 468C298 548 306 680 324 794L430 816C438 690 450 560 470 438Z" fill="url(#gi)"/>
    <path d="M758 345C810 352 858 392 880 468C902 548 894 680 876 794L770 816C762 690 750 560 730 438Z" fill="url(#gi)"/>
    <path d="M442 345C390 352 342 392 320 468C298 548 306 680 324 794L430 816C438 690 450 560 470 438Z" fill="url(#giShade)" opacity=".55"/>
    <path d="M758 345C810 352 858 392 880 468C902 548 894 680 876 794L770 816C762 690 750 560 730 438Z" fill="url(#giShade)" opacity=".55"/>
    <!-- torso -->
    <path d="M442 345C480 318 525 304 566 300L600 336L634 300C675 304 720 318 758 345C792 440 804 620 800 760C798 900 808 1110 826 1280C742 1315 458 1315 374 1280C392 1110 402 900 400 760C396 620 408 440 442 345Z" fill="url(#gi)"/>
    <path d="M442 345C480 318 525 304 566 300L600 336L634 300C675 304 720 318 758 345C792 440 804 620 800 760C798 900 808 1110 826 1280C742 1315 458 1315 374 1280C392 1110 402 900 400 760C396 620 408 440 442 345Z" fill="none" stroke="#E8C77A" stroke-opacity=".22" stroke-width="2"/>
    <!-- lapels -->
    <path d="M566 300L600 336L494 610L458 588Z" fill="#FFFDF7"/>
    <path d="M634 300L600 336L706 610L742 588Z" fill="#F4E9E3"/>
    <path d="M566 300L600 336L494 610" fill="none" stroke="#B69EA9" stroke-opacity=".4" stroke-width="2"/>
    <path d="M634 300L600 336L706 610" fill="none" stroke="#B69EA9" stroke-opacity=".4" stroke-width="2"/>
    <path d="M600 336V790" stroke="#A98F9F" stroke-opacity=".3" stroke-width="2"/>
    <!-- sleeve seams / cuffs -->
    <path d="M430 800C470 815 510 818 546 812M770 800C730 815 690 818 654 812" fill="none" stroke="#A78E9B" stroke-opacity=".35" stroke-width="3"/>
    <path d="M330 486C360 512 390 526 430 532M870 486C840 512 810 526 770 532" fill="none" stroke="#A78E9B" stroke-opacity=".25" stroke-width="2"/>
    <!-- fabric folds -->
    <path d="M490 380C470 560 466 760 478 940M710 380C730 560 734 760 722 940" fill="none" stroke="#9A8193" stroke-opacity=".23" stroke-width="3"/>
    <path d="M540 620C520 800 520 1000 534 1190M660 620C680 800 680 1000 666 1190" fill="none" stroke="#B49EAA" stroke-opacity=".22" stroke-width="2"/>
    <path d="M374 1190C450 1220 750 1220 826 1190" fill="none" stroke="#A78E9B" stroke-opacity=".25" stroke-width="2"/>
    <!-- chest emblem -->
    <g transform="translate(690 500)" opacity=".62">
      <circle r="33" fill="none" stroke="#E8C77A" stroke-opacity=".55" stroke-width="1.5"/>
      <circle r="24" fill="none" stroke="#E8C77A" stroke-opacity=".28"/>
      <path d="M-9 8L0-10L9 8L0 17Z" fill="none" stroke="#E8C77A" stroke-opacity=".5" stroke-width="1.5"/>
    </g>
  </g>

  <!-- black belt -->
  <g>
    <path d="M398 866C500 906 700 906 802 866L812 956C704 1002 496 1002 388 956Z" fill="url(#belt)" stroke="#E8C77A" stroke-opacity=".32" stroke-width="2"/>
    <path d="M582 936C572 992 564 1044 552 1104" fill="none" stroke="#08050B" stroke-width="18" stroke-linecap="round"/>
    <path d="M618 936C628 992 636 1044 648 1104" fill="none" stroke="#08050B" stroke-width="18" stroke-linecap="round"/>
    <path d="M582 936C572 992 564 1044 552 1104M618 936C628 992 636 1044 648 1104" fill="none" stroke="#E8C77A" stroke-opacity=".24" stroke-width="2"/>
    <path d="M600 916V962" stroke="#E8C77A" stroke-opacity=".5" stroke-width="3"/>
    <circle cx="600" cy="966" r="8" fill="#E8C77A" opacity=".8"/>
    <path d="M600 966C600 1010 600 1060 600 1100" stroke="#E8C77A" stroke-opacity=".18" stroke-width="2"/>
  </g>

  <!-- lower monogram plaque -->
  <g transform="translate(600 1360)" opacity=".55">
    <path d="M-95 0H95" stroke="#E8C77A" stroke-opacity=".35"/>
    <text x="0" y="42" text-anchor="middle" font-family="Georgia, serif" font-size="34" letter-spacing="12" fill="#E8C77A" opacity=".75">H · A</text>
    <path d="M-95 60H95" stroke="#E8C77A" stroke-opacity=".18"/>
  </g>

  <!-- foreground petals -->
  ${Array.from({ length: 18 }, (_, i) => petal(820 + ((i * 137) % 330), 980 + ((i * 211) % 450), .8 + (i % 3) * .4, '#F6BFD6', .18, i * 37)).join('')}
  <rect width="1200" height="1500" filter="url(#grain)" opacity=".55" style="mix-blend-mode:soft-light"/>
  <rect width="1200" height="1500" fill="url(#vignette)"/>
  <rect x="32" y="32" width="1136" height="1436" fill="none" stroke="#E8C77A" stroke-opacity=".38" stroke-width="2"/>
  <path d="M32 152V32H152M1048 32h120v120M1168 1348v120h-120M152 1468H32v-120" fill="none" stroke="#E8C77A" stroke-opacity=".7" stroke-width="3"/>
</svg>`;
}
async function main() {
  await mkdir(path.join(outDir, 'gallery'), { recursive: true });
  await mkdir(path.join(outDir, 'teacher'), { recursive: true });
  await mkdir(path.join(outDir, 'backgrounds'), { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  const render = async (svg, outPath) => {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#120a1a">${svg}</body></html>`, { waitUntil: 'load' });
    await page.screenshot({ path: outPath, type: 'png' });
    console.log('rendered', path.relative(root, outPath));
  };
  await render(portrait(), path.join(outDir, 'teacher', 'sensei-portrait-placeholder.png'));
  for (const scene of scenes) {
    await render(galleryScene(scene.slug, scene.palette, scene.body), path.join(outDir, 'gallery', `${scene.slug}.png`));
  }
  await browser.close();
  await writeFile(path.join(outDir, 'gallery', 'credits.json'), JSON.stringify({
    note: 'Original illustrated placeholders generated for Bloom of Gratitude. Replace with real photos of Sensei and CLB HUIT activities.',
    scenes: scenes.map(({ slug, title }) => ({ file: `${slug}.webp`, title })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



