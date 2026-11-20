import './styles/main.css';
import './styles/animations.css';
import './styles/responsive.css';

import { gsap } from 'gsap';
import { siteConfig } from './data/config.js';
import { galleryPhotos } from './data/gallery.js';
import { $, $$, isLowPowerDevice, prefersReducedMotion, wait } from './utils.js';
import { MusicPlayer } from './components/music-player.js';
import { Lightbox } from './components/lightbox.js';
import { Navigation } from './components/navigation.js';
import { createIntroScene } from './scenes/intro.js';
import { createFlowersScene } from './scenes/flowers.js';
import { createSenseiScene } from './scenes/sensei.js';
import { createMemoriesScene } from './scenes/memories.js';
import { createLetterScene } from './scenes/letter.js';
import { createEndingScene } from './scenes/ending.js';

// Allow slow devices to catch up rather than stretching a two-second opening
// into ten seconds (GSAP's default lag cap is 33ms).
gsap.ticker.lagSmoothing(500, 100);

document.body.classList.add('is-loading');

const app = $('#app');
const sceneEls = $$('.scene');
const veil = $('#scene-veil');
const preloader = $('#preloader');
const metaTheme = $('meta[name="theme-color"]');

if (isLowPowerDevice()) app.classList.add('is-low-power');
if (prefersReducedMotion()) app.classList.add('reduce-motion');

const music = new MusicPlayer(siteConfig.audio);
music.init();

const lightbox = new Lightbox({ photos: galleryPhotos });

let current = 0;
let transitioning = false;
let started = false;
let restarting = false;

const startMusic = () => {
  if (!music.started && music.available) {
    music.play();
  }
};

const scenes = [
  createIntroScene({
    onStartAudio: startMusic,
    onOpenComplete: () => goTo(1, { direction: 1, source: 'gift' }),
  }),
  createFlowersScene(),
  createSenseiScene(siteConfig),
  createMemoriesScene({ lightbox }),
  createLetterScene(siteConfig, { onStartAudio: startMusic }),
  createEndingScene({ onRestart: () => restartExperience() }),
];

const navigation = new Navigation({
  sceneIds: siteConfig.scenes.map((scene) => scene.id),
  onNavigate: (index, options) => goTo(index, options),
  canNavigate: () => !transitioning && !document.querySelector('.lightbox.is-open'),
  onUserNavigate: () => {
    if (!music.started) startMusic();
  },
});

const setTheme = (index) => {
  const paper = siteConfig.scenes[index]?.id === 'letter';
  app.dataset.scene = String(index + 1);
  app.dataset.theme = paper ? 'paper' : 'night';
  if (metaTheme) metaTheme.setAttribute('content', paper ? '#F7ECDF' : '#21162F');
};

const resetScroll = (sceneEl) => {
  $$('[data-scene-scroll]', sceneEl).forEach((scroll) => {
    scroll.scrollTop = 0;
  });
};

const activateScene = (index) => {
  sceneEls.forEach((sceneEl, sceneIndex) => {
    const active = sceneIndex === index;
    sceneEl.classList.toggle('is-active', active);
    sceneEl.classList.remove('is-leaving');
    sceneEl.setAttribute('aria-hidden', String(!active));
    sceneEl.inert = !active;
  });
  current = index;
  setTheme(index);
  resetScroll(sceneEls[index]);
  navigation.update(index);
};

const finishTransition = (oldEl, newEl) => {
  oldEl.classList.remove('is-active', 'is-leaving');
  oldEl.setAttribute('aria-hidden', 'true');
  oldEl.inert = true;
  gsap.set(oldEl, { clearProps: 'opacity,transform,zIndex,filter' });
  gsap.set(newEl, { clearProps: 'opacity,transform,zIndex,filter' });
  newEl.classList.add('is-active');
  newEl.setAttribute('aria-hidden', 'false');
  newEl.inert = false;
  app.classList.remove('is-transitioning');
  transitioning = false;
  newEl.focus({ preventScroll: true });
};

function goTo(index, options = {}) {
  if (restarting) return;
  if (index < 0 || index >= sceneEls.length) return;
  if (transitioning) return;
  if (index === current) {
    if (options.source === 'restart') {
      scenes[current]?.enter?.({ initial: true });
    }
    return;
  }

  // Never interrupt the gift-opening moment; its own completion navigates.
  if (
    options.source !== 'gift' &&
    current === 0 &&
    $('#scene-intro')?.classList.contains('is-opening')
  ) {
    return;
  }

  if (
    !music.started &&
    ['next', 'progress', 'swipe', 'keyboard', 'brand'].includes(options.source)
  ) {
    startMusic();
  }

  const oldIndex = current;
  const oldEl = sceneEls[oldIndex];
  const newEl = sceneEls[index];
  const direction = options.direction ?? (index > oldIndex ? 1 : -1);
  const reduced = prefersReducedMotion();

  transitioning = true;
  app.classList.add('is-transitioning');
  lightbox.close();
  scenes[oldIndex]?.leave?.();
  setTheme(index);

  newEl.classList.add('is-active');
  newEl.setAttribute('aria-hidden', 'false');
  newEl.inert = false;
  oldEl.classList.add('is-leaving');
  navigation.update(index);

  if (reduced) {
    activateScene(index);
    scenes[index]?.enter?.({ direction, initial: false });
    oldEl.classList.remove('is-active');
    oldEl.setAttribute('aria-hidden', 'true');
    oldEl.inert = true;
    gsap.set([oldEl, newEl], { clearProps: 'opacity,transform,zIndex,filter' });
    app.classList.remove('is-transitioning');
    transitioning = false;
    newEl.focus({ preventScroll: true });
    return;
  }

  const offset = direction > 0 ? 22 : -22;
  gsap.set(oldEl, { zIndex: 2 });
  gsap.set(newEl, { zIndex: 3, opacity: 0, y: offset, scale: 0.992 });

  const timeline = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete: () => finishTransition(oldEl, newEl),
  });

  timeline
    .to(veil, { opacity: 1, duration: 0.32, ease: 'power2.out' }, 0)
    .to(oldEl, { opacity: 0, y: -offset * 0.7, scale: 0.99, duration: 0.62 }, 0)
    .add(() => {
      activateScene(index);
      scenes[index]?.enter?.({ direction, initial: false });
    }, 0.3)
    .to(newEl, { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: 'power3.out' }, 0.38)
    .to(veil, { opacity: 0, duration: 0.72, ease: 'power2.inOut' }, 0.48);
}

function restartExperience() {
  if (transitioning || restarting) return;
  restarting = true;
  lightbox.close();
  scenes[0]?.reset?.();
  scenes[4]?.reset?.();
  const memoriesSwiper = $('#memory-swiper')?.swiper;
  memoriesSwiper?.slideTo(0, 0);
  resetScroll($('#scene-memories'));
  resetScroll($('#scene-letter'));
  window.setTimeout(() => {
    restarting = false;
    goTo(0, { direction: -1, source: 'restart' });
  }, 60);
}

const hidePreloader = () => {
  if (!preloader) return;
  preloader.classList.add('is-hidden');
  gsap.to(preloader, {
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    onComplete: () => preloader.remove(),
  });
};

const boot = async () => {
  sceneEls.forEach((sceneEl, index) => {
    if (index !== 0) {
      sceneEl.setAttribute('aria-hidden', 'true');
      sceneEl.inert = true;
    }
  });

  scenes.forEach((scene) => scene.init?.());
  navigation.init();
  setTheme(0);

  // Give the browser a moment to paint the preloader, then reveal the first
  // scene. The intro animation also starts under the last frames of the
  // preloader fade so the recipient never stares at a static screen.
  const minimumWait = wait(480);
  const fontWait = document.fonts?.ready ?? Promise.resolve();
  await Promise.race([Promise.all([minimumWait, fontWait]), wait(1100)]);
  hidePreloader();
  await wait(160);

  startScene();
};

const startScene = () => {
  if (started) return;
  started = true;
  document.body.classList.remove('is-loading');
  sceneEls[0].classList.add('is-active');
  sceneEls[0].setAttribute('aria-hidden', 'false');
  sceneEls[0].inert = false;
  scenes[0]?.enter?.({ initial: true });
  navigation.update(0);
};

// Allow QA / the sender to jump to a specific chapter without touching internals.
window.__bloom = {
  goTo,
  restart: restartExperience,
  get current() {
    return current;
  },
  get transitioning() {
    return transitioning;
  },
  scenes,
  config: siteConfig,
  music,
  lightbox,
};

boot().catch((error) => {
  console.error('[Bloom] Boot failed:', error);
  hidePreloader();
  startScene();
});

// Recompute scrollable heights after an orientation change settles.
let orientationTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(orientationTimer);
  orientationTimer = window.setTimeout(() => {
    if (current === 1) scenes[1]?.onResize?.();
  }, 180);
});
