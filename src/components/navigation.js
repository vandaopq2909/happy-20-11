import { $, $$, clamp } from '../utils.js';

/**
 * Central navigation: progress dots, back button, data-next buttons, swipe and
 * keyboard shortcuts. Scene transitions themselves live in main.js.
 */
export class Navigation {
  constructor(options) {
    this.sceneIds = options.sceneIds;
    this.onNavigate = options.onNavigate;
    this.canNavigate = options.canNavigate ?? (() => true);
    this.onUserNavigate = options.onUserNavigate ?? (() => {});
    this.index = 0;
    this.dots = $$('.journey__dot');
    this.backButton = $('#back-btn');
    this.stage = $('#stage');
    this.touchStart = null;
    this.swipeBound = false;
  }

  init() {
    this.dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const target = Number(dot.dataset.goto);
        if (Number.isNaN(target) || target === this.index) return;
        this.onUserNavigate(target);
        this.onNavigate(target, { source: 'progress' });
      });
    });

    this.backButton?.addEventListener('click', () => {
      if (this.index <= 0) return;
      this.onNavigate(this.index - 1, { direction: -1, source: 'back' });
    });

    $$('[data-goto]').forEach((element) => {
      if (element.classList.contains('journey__dot')) return;
      element.addEventListener('click', (event) => {
        const target = Number(element.dataset.goto);
        if (Number.isNaN(target) || target === this.index) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        this.onNavigate(target, { source: 'brand' });
      });
    });

    $$('[data-next]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.next;
        const target = this.sceneIds.indexOf(id);
        if (target >= 0) {
          this.onUserNavigate(target);
          this.onNavigate(target, { direction: 1, source: 'next' });
        }
      });
    });

    this.bindKeyboard();
    this.bindSwipe();
    this.update(0);
  }

  bindKeyboard() {
    document.addEventListener('keydown', (event) => {
      const active = document.activeElement;
      if (
        active?.matches('input, textarea, select, [contenteditable="true"]') ||
        $('.lightbox.is-open') ||
        $('.letter-reader.is-open') ||
        !this.canNavigate()
      ) {
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.onNavigate(clamp(this.index + 1, 0, this.sceneIds.length - 1), {
          direction: 1,
          source: 'keyboard',
        });
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.onNavigate(clamp(this.index - 1, 0, this.sceneIds.length - 1), {
          direction: -1,
          source: 'keyboard',
        });
      }
    });
  }

  bindSwipe() {
    if (!this.stage || this.swipeBound) return;
    const excluded = [
      '.swiper',
      '.lightbox',
      'button',
      'a',
      'input',
      'textarea',
      '.chapters',
      '.letter-reader',
      '.music-dock',
      '.journey',
      '[data-no-swipe]',
    ].join(',');

    const reset = () => {
      this.touchStart = null;
    };

    this.stage.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length !== 1 || !this.canNavigate()) return;
        if (event.target.closest?.(excluded)) return;
        const touch = event.touches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY, time: performance.now() };
      },
      { passive: true },
    );

    this.stage.addEventListener(
      'touchmove',
      (event) => {
        if (!this.touchStart || event.touches.length !== 1) return;
        const dx = event.touches[0].clientX - this.touchStart.x;
        const dy = event.touches[0].clientY - this.touchStart.y;
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          this.touchStart.locked = true;
        }
      },
      { passive: true },
    );

    this.stage.addEventListener(
      'touchend',
      (event) => {
        if (!this.touchStart) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        const elapsed = performance.now() - this.touchStart.time;
        const threshold = Math.min(86, window.innerWidth * 0.18);
        const shouldMove =
          this.touchStart.locked &&
          elapsed < 750 &&
          Math.abs(dx) > threshold &&
          Math.abs(dx) > Math.abs(dy) * 1.25;
        reset();
        if (!shouldMove) return;
        const direction = dx < 0 ? 1 : -1;
        const target = clamp(this.index + direction, 0, this.sceneIds.length - 1);
        if (target !== this.index) {
          this.onNavigate(target, { direction, source: 'swipe' });
        }
      },
      { passive: true },
    );

    this.stage.addEventListener('touchcancel', reset, { passive: true });
    this.swipeBound = true;
  }

  update(index) {
    this.index = index;
    this.dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      if (active) {
        dot.setAttribute('aria-current', 'step');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    if (this.backButton) {
      this.backButton.hidden = index === 0;
    }
  }

  destroy() {
    // The experience is single-page and lives for the entire session; no teardown
    // is needed beyond releasing references if ever embedded elsewhere.
    this.dots = [];
  }
}
