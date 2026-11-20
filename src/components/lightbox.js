import { galleryPhotos, getGroup } from '../data/gallery.js';
import { $, preloadImage } from '../utils.js';

/**
 * Accessible full-screen album lightbox with swipe + keyboard navigation.
 */
export class Lightbox {
  constructor(options = {}) {
    this.photos = options.photos ?? galleryPhotos;
    this.index = 0;
    this.isOpen = false;
    this.lastFocused = null;
    this.root = null;
    this.img = null;
    this.caption = null;
    this.count = null;
    this.groupLabel = null;
    this.touchStart = null;
    this.onKeydown = this.onKeydown.bind(this);
  }

  init() {
    const wrapper = document.createElement('div');
    wrapper.className = 'lightbox';
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-modal', 'true');
    wrapper.setAttribute('aria-label', 'Xem ảnh kỷ niệm');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.inert = true;
    wrapper.innerHTML = `
      <div class="lightbox__top">
        <div class="lightbox__eyebrow">
          <span id="lightbox-group">The Sensei</span>
          <span id="lightbox-credit">Ảnh: CLB Võ thuật HUIT</span>
        </div>
        <button class="round-btn lightbox__close" type="button" aria-label="Đóng ảnh">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="lightbox__stage">
        <figure class="lightbox__figure">
          <div class="lightbox__image-wrap">
            <img class="lightbox__img" alt="" decoding="async" />
          </div>
          <figcaption class="lightbox__caption"></figcaption>
        </figure>
      </div>
      <div class="lightbox__bottom">
        <span class="lightbox__count"><b>01</b> / ${String(this.photos.length).padStart(2, '0')}</span>
        <div class="lightbox__nav">
          <button class="round-btn" type="button" data-lightbox-prev aria-label="Ảnh trước">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>
          </button>
          <button class="round-btn" type="button" data-lightbox-next aria-label="Ảnh tiếp theo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <span class="lightbox__credit">CLB VÕ THUẬT HUIT · 20.11.2026</span>
    `;

    (document.querySelector('#app') ?? document.body).appendChild(wrapper);
    this.root = wrapper;
    this.img = $('.lightbox__img', wrapper);
    this.caption = $('.lightbox__caption', wrapper);
    this.count = $('.lightbox__count b', wrapper);
    this.groupLabel = $('#lightbox-group', wrapper);

    $('.lightbox__close', wrapper).addEventListener('click', () => this.close());
    $('[data-lightbox-prev]', wrapper).addEventListener('click', () => this.step(-1));
    $('[data-lightbox-next]', wrapper).addEventListener('click', () => this.step(1));

    wrapper.addEventListener('click', (event) => {
      if (event.target === wrapper || event.target.classList.contains('lightbox__stage')) {
        this.close();
      }
    });

    const stage = $('.lightbox__stage', wrapper);
    stage.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      this.touchStart = { x: event.clientX, y: event.clientY, t: performance.now() };
    });
    stage.addEventListener('pointerup', (event) => {
      if (!this.touchStart) return;
      const dx = event.clientX - this.touchStart.x;
      const dy = event.clientY - this.touchStart.y;
      const elapsed = performance.now() - this.touchStart.t;
      this.touchStart = null;
      if (elapsed > 700 || Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      this.step(dx < 0 ? 1 : -1);
    });
    stage.addEventListener('pointercancel', () => {
      this.touchStart = null;
    });

    this.img.addEventListener('load', () => {
      this.img.style.opacity = '1';
    });
  }

  setPhoto(index) {
    const total = this.photos.length;
    this.index = (index + total) % total;
    const photo = this.photos[this.index];
    const group = getGroup(photo.group);

    this.img.style.opacity = '0';
    this.img.alt = photo.alt;
    this.img.src = photo.src;

    if (this.img.complete) {
      requestAnimationFrame(() => {
        this.img.style.opacity = '1';
      });
    }

    this.caption.textContent = photo.caption;
    this.count.textContent = String(this.index + 1).padStart(2, '0');
    this.groupLabel.textContent = `${group.number} · ${group.label} — ${group.vi}`;

    const previous = this.photos[(this.index - 1 + total) % total];
    const next = this.photos[(this.index + 1) % total];
    preloadImage(previous.src).catch(() => {});
    preloadImage(next.src).catch(() => {});
  }

  step(direction) {
    if (!this.isOpen) return;
    this.setPhoto(this.index + direction);
  }

  open(index) {
    if (!this.root) return;
    this.lastFocused = document.activeElement;
    this.isOpen = true;
    this.root.classList.add('is-open');
    this.root.setAttribute('aria-hidden', 'false');
    this.root.inert = false;
    this.setPhoto(index);
    document.addEventListener('keydown', this.onKeydown);
    window.setTimeout(() => $('.lightbox__close', this.root)?.focus(), 80);
  }

  close() {
    if (!this.root || !this.isOpen) return;
    this.isOpen = false;
    this.root.classList.remove('is-open');
    this.root.setAttribute('aria-hidden', 'true');
    this.root.inert = true;
    document.removeEventListener('keydown', this.onKeydown);
    if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
      this.lastFocused.focus({ preventScroll: true });
    }
  }

  onKeydown(event) {
    if (!this.isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.step(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.step(-1);
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      this.root.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  destroy() {
    this.close();
    this.root?.remove();
    this.root = null;
  }
}
