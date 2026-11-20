import { gsap } from 'gsap';
import { $, $$, prefersReducedMotion, showToast, splitChars } from '../utils.js';

export function createSenseiScene(config) {
  const scene = $('#scene-sensei');
  const portrait = $('#portrait-tilt');
  const frame = $('.portrait__frame', scene);
  const image = $('#sensei-portrait');
  const badge = $('#portrait-badge');
  const nameEl = $('#sensei-name');
  let chars = [];
  let timeline = null;
  let quickRotateX = null;
  let quickRotateY = null;
  let bound = false;

  const setPortrait = () => {
    const info = config.recipient.portrait;
    image.src = info.src;
    image.alt = info.alt;
    image.width = 1200;
    image.height = 1500;
    badge.hidden = !info.isPlaceholder;
    badge.textContent = info.placeholderLabel || 'ẢNH MINH HOẠ';
    image.addEventListener(
      'error',
      () => {
        badge.hidden = false;
        badge.textContent = 'CHƯA CÓ ẢNH';
        showToast('Không tìm thấy ảnh chân dung. Hãy kiểm tra lại đường dẫn trong config.js.');
      },
      { once: true },
    );
  };

  const bindTilt = () => {
    if (bound || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }
    bound = true;
    gsap.set(frame, { transformPerspective: 1000, transformOrigin: '50% 50%' });
    quickRotateX = gsap.quickTo(frame, 'rotationX', { duration: 0.7, ease: 'power2.out' });
    quickRotateY = gsap.quickTo(frame, 'rotationY', { duration: 0.7, ease: 'power2.out' });
    portrait.addEventListener('pointermove', (event) => {
      const rect = portrait.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      quickRotateY(x * 9);
      quickRotateX(y * -7);
    });
    portrait.addEventListener('pointerleave', () => {
      quickRotateY(-2);
      quickRotateX(1);
    });
  };

  const animate = () => {
    if (timeline) timeline.kill();
    if (prefersReducedMotion()) {
      gsap.set([frame, '.sensei__info > *'], { opacity: 1, y: 0, scale: 1 });
      return;
    }
    timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo(
        frame,
        { opacity: 0, scale: 0.86, y: 26, rotateY: -7 },
        { opacity: 1, scale: 1, y: 0, rotateY: 0, duration: 1.25, ease: 'power4.out' },
        0.1,
      )
      .fromTo(
        '.portrait__caption',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.55,
      )
      .fromTo(
        '.sensei__index',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6 },
        0.2,
      )
      .fromTo(
        chars,
        { opacity: 0, y: 22, rotateX: -35 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.032 },
        0.3,
      )
      .fromTo(
        '.sensei__title',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.75,
      )
      .fromTo(
        '.sensei__rule',
        { opacity: 0, scaleX: 0.6 },
        { opacity: 1, scaleX: 1, duration: 0.7 },
        0.8,
      )
      .fromTo(
        '.sensei__roles li',
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.7, stagger: 0.08 },
        0.85,
      )
      .fromTo(
        '.sensei__quote',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8 },
        1.05,
      )
      .fromTo(
        '.sensei__actions',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8 },
        1.15,
      );
  };

  const init = () => {
    setPortrait();
    chars = splitChars(nameEl);
    bindTilt();
  };

  const enter = () => {
    scene.classList.add('is-entered');
    animate();
  };

  const leave = () => {
    scene.classList.remove('is-entered');
    timeline?.kill();
    timeline = null;
  };

  const destroy = () => {
    timeline?.kill();
  };

  return { init, enter, leave, destroy };
}
