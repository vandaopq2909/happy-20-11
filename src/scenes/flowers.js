import { gsap } from 'gsap';
import { PetalField } from '../components/petal-system.js';
import { GlowParticles } from '../components/particle-system.js';
import { $, isLowPowerDevice, prefersReducedMotion } from '../utils.js';

export function createFlowersScene() {
  const scene = $('#scene-flowers');
  const canvas = $('#flower-petals');
  const fireflyHost = $('#flower-fireflies');
  const wrap = $('#sakura-wrap');
  const scroll = $('.flowers__scroll', scene);
  const petals = new PetalField(canvas, {
    count: isLowPowerDevice() ? 14 : 26,
    speed: 0.95,
  });
  const fireflies = new GlowParticles(fireflyHost, {
    count: isLowPowerDevice() ? 8 : 16,
  });

  let timeline = null;
  let entered = false;
  let pointerX = 0;
  let pointerY = 0;
  let scrollY = 0;
  let quickX = null;
  let quickY = null;
  let raf = 0;
  let bound = false;

  const applyParallax = () => {
    raf = 0;
    if (!quickX || !quickY) return;
    quickX(pointerX * 10);
    quickY(pointerY * -7 + scrollY);
  };

  const scheduleParallax = () => {
    if (raf) return;
    raf = requestAnimationFrame(applyParallax);
  };

  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    scheduleParallax();
  };

  const onPointerLeave = () => {
    pointerX = 0;
    pointerY = 0;
    scheduleParallax();
  };

  const onScroll = () => {
    scrollY = Math.min(scroll?.scrollTop || 0, 260) * -0.07;
    scheduleParallax();
  };

  const bind = () => {
    if (bound) return;
    bound = true;
    if (prefersReducedMotion()) return;
    gsap.set(wrap, { xPercent: -50 });
    quickX = gsap.quickTo(wrap, 'x', { duration: 1.1, ease: 'power2.out' });
    quickY = gsap.quickTo(wrap, 'y', { duration: 1.1, ease: 'power2.out' });
    scene.addEventListener('pointermove', onPointerMove, { passive: true });
    scene.addEventListener('pointerleave', onPointerLeave, { passive: true });
    scroll?.addEventListener('scroll', onScroll, { passive: true });
  };

  const init = () => {
    petals.init();
    fireflies.init();
    bind();
  };

  const animateCopy = () => {
    if (timeline) timeline.kill();
    if (prefersReducedMotion()) {
      gsap.set(
        ['.flowers__head', '.flowers__message', '.flowers__bottom'],
        { opacity: 1, y: 0 },
      );
      return;
    }
    timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo(
        '.flowers__head .eyebrow',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7 },
      )
      .fromTo(
        '.flowers__line',
        { opacity: 0, y: 36, rotateX: -12 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.05, stagger: 0.12 },
        0.1,
      )
      .fromTo(
        '.flowers__date',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.55,
      )
      .fromTo(
        '.flowers__message',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.9 },
        0.72,
      )
      .fromTo(
        '.flowers__bottom',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.88,
      );
  };

  const enter = () => {
    scene.classList.add('is-entered');
    petals.setActive(true);
    fireflies.setActive(true);
    if (!entered) {
      entered = true;
      onScroll();
    }
    animateCopy();
  };

  const leave = () => {
    petals.setActive(false);
    fireflies.setActive(false);
    scene.classList.remove('is-entered');
    timeline?.kill();
    timeline = null;
  };

  const destroy = () => {
    petals.destroy();
    fireflies.destroy();
    scene.removeEventListener('pointermove', onPointerMove);
    scene.removeEventListener('pointerleave', onPointerLeave);
    scroll?.removeEventListener('scroll', onScroll);
    timeline?.kill();
  };

  return { init, enter, leave, destroy };
}
