import { gsap } from 'gsap';
import { $, isLowPowerDevice, prefersReducedMotion, wait } from '../utils.js';

export function createIntroScene({ onOpenComplete, onStartAudio }) {
  const scene = $('#scene-intro');
  const button = $('#open-gift');
  const canvasHost = $('#gift-canvas');
  const fallback = $('#gift-fallback');
  const stage = $('#gift-stage');
  const heading = $('.intro__heading', scene);
  const bottom = $('.intro__bottom', scene);
  const buttonText = $('.btn__text', button);
  const primeAudio = () => onStartAudio?.();
  const primeAudioFromKeyboard = (event) => {
    if (event.key === 'Enter' || event.key === ' ') primeAudio();
  };

  let gift = null;
  let giftPromise = null;
  let busy = false;
  let opened = false;
  let hasEntered = false;
  let disposed = false;
  let disposeTimer = 0;

  const initGift = () => {
    if (gift || giftPromise || disposed) return giftPromise;
    if (!window.WebGLRenderingContext) {
      showFallback();
      return Promise.resolve(null);
    }
    giftPromise = import('./gift-three.js')
      .then(({ createGiftScene }) => {
        if (disposed) return null;
        gift = createGiftScene(canvasHost, {
          lowPower: isLowPowerDevice(),
          reducedMotion: prefersReducedMotion(),
        });
        canvasHost.hidden = false;
        gsap.to(fallback, {
          opacity: 0,
          duration: 0.55,
          ease: 'power2.out',
          onComplete: () => {
            fallback.hidden = true;
            gsap.set(fallback, { clearProps: 'opacity' });
          },
        });
        return gift;
      })
      .catch((error) => {
        console.warn('[Bloom] WebGL gift unavailable — using the illustrated fallback.', error);
        showFallback();
        return null;
      });
    return giftPromise;
  };

  const showFallback = () => {
    fallback.hidden = false;
    fallback.classList.remove('is-open');
    gsap.set(fallback, { clearProps: 'opacity' });
    canvasHost.hidden = true;
  };

  const animateEnter = (initial = false) => {
    const reduced = prefersReducedMotion();
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (reduced) {
      gsap.set([heading, stage, bottom], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    timeline
      .fromTo(
        $('.intro__eyebrow', scene),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8 },
        initial ? 0.15 : 0,
      )
      .fromTo(
        $('.intro__title', scene),
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 1.15, ease: 'power4.out' },
        initial ? 0.26 : 0.05,
      )
      .fromTo(
        $('.intro__subtitle', scene),
        { opacity: 0, y: 13 },
        { opacity: 1, y: 0, duration: 0.8 },
        initial ? 0.55 : 0.2,
      )
      .fromTo(
        $('.intro__from', scene),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.75 },
        initial ? 0.68 : 0.28,
      )
      .fromTo(
        stage,
        { opacity: 0, y: 24, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.25, ease: 'power3.out' },
        initial ? 0.4 : 0.1,
      )
      .fromTo(
        $('.gift-stage__orbit span', scene),
        { opacity: 0, scale: 0 },
        { opacity: 0.6, scale: 1, duration: 0.8, stagger: 0.08 },
        initial ? 0.9 : 0.4,
      )
      .fromTo(
        bottom,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.9 },
        initial ? 0.72 : 0.3,
      );
  };

  const animateFallbackOpen = () =>
    new Promise((resolve) => {
      fallback.classList.add('is-open');
      gsap.to(fallback, {
        scale: 1.06,
        duration: 1.4,
        ease: 'power2.out',
      });
      window.setTimeout(resolve, 1700);
    });

  const restore = () => {
    busy = false;
    opened = false;
    scene.classList.remove('is-opening');
    fallback.classList.remove('is-open');
    button.disabled = false;
    buttonText.textContent = 'MỞ MÓN QUÀ';
    gsap.set([heading, bottom], { clearProps: 'opacity' });
    gsap.set(fallback, { clearProps: 'transform' });
    gift?.reset();
  };

  const openGift = async () => {
    if (busy || opened) return;
    busy = true;
    opened = true;
    onStartAudio?.();

    scene.classList.add('is-opening');
    button.disabled = true;
    buttonText.textContent = 'ĐANG MỞ...';

    const giftInstance = await initGift();
    let timedOut = false;
    const opening = giftInstance
      ? giftInstance.open().catch((error) => {
          console.warn('[Bloom] Gift animation failed; continuing.', error);
        })
      : animateFallbackOpen();

    // The experience must never trap the recipient on the first scene if a
    // browser throttles the animation loop or loses the WebGL context.
    await Promise.race([
      opening,
      wait(6000).then(() => {
        timedOut = true;
      }),
    ]);
    if (timedOut) {
      console.warn('[Bloom] Gift opening animation timed out; moving on.');
    }

    if (disposed) return;
    await wait(140);
    onOpenComplete?.();
  };

  const init = () => {
    button?.addEventListener('click', openGift);
    // Prime the audio inside the actual touch/click gesture. This matters on
    // iOS Safari, where waiting for the 3D opening animation would lose the
    // user-activation flag and block YouTube / audio playback.
    button?.addEventListener('pointerdown', primeAudio, { passive: true });
    button?.addEventListener('keydown', primeAudioFromKeyboard);
    // The illustrated gift is visible immediately, then crossfades into the
    // real 3D box as soon as the Three chunk is ready.
    showFallback();
    const schedule = window.requestIdleCallback
      ? window.requestIdleCallback(() => initGift(), { timeout: 1800 })
      : window.setTimeout(() => initGift(), 800);
    return schedule;
  };

  const enter = (options = {}) => {
    window.clearTimeout(disposeTimer);
    scene.classList.add('is-entered');
    if (!gift) showFallback();
    gift?.setActive(true);
    if (!giftPromise) initGift();
    animateEnter(!hasEntered || options.initial);
    hasEntered = true;
  };

  const leave = () => {
    gift?.setActive(false);
    // Release the WebGL context once the scene has faded out; a later return
    // re-creates it and starts from a closed gift.
    if (gift || giftPromise) {
      window.clearTimeout(disposeTimer);
      disposeTimer = window.setTimeout(() => {
        if (!scene.classList.contains('is-active')) {
          gift?.dispose();
          gift = null;
          giftPromise = null;
          restore();
        }
      }, 700);
    }
  };

  const reset = () => {
    gift?.dispose();
    gift = null;
    giftPromise = null;
    disposed = false;
    restore();
    showFallback();
  };

  const destroy = () => {
    disposed = true;
    window.clearTimeout(disposeTimer);
    button?.removeEventListener('click', openGift);
    button?.removeEventListener('pointerdown', primeAudio);
    button?.removeEventListener('keydown', primeAudioFromKeyboard);
    gift?.dispose();
    gift = null;
  };

  return { init, enter, leave, reset, destroy };
}
