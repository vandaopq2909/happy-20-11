import { clamp, prefersReducedMotion } from '../utils.js';

/**
 * DOM-based glow particles for the garden. DOM keeps this nearly free while
 * the canvas handles falling petals; both pause when the scene is inactive.
 */
export class GlowParticles {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { count: 14, ...options };
    this.spans = [];
    this.reduced = prefersReducedMotion();
  }

  init() {
    if (!this.container) return;
    const viewportScale = clamp(window.innerWidth / 414, 0.75, 1.8);
    const count = Math.round((this.reduced ? 4 : this.options.count) * viewportScale);
    this.container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < count; index += 1) {
      const span = document.createElement('span');
      span.style.left = `${6 + Math.random() * 88}%`;
      span.style.top = `${28 + Math.random() * 60}%`;
      span.style.animationDelay = `${-Math.random() * 8}s`;
      span.style.animationDuration = `${5 + Math.random() * 5}s`;
      span.style.transform = `scale(${0.6 + Math.random() * 1.1})`;
      fragment.appendChild(span);
      this.spans.push(span);
    }

    this.container.appendChild(fragment);
  }

  setActive(active) {
    this.container?.classList.toggle('is-active', Boolean(active));
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.spans = [];
  }
}

export function createGlowParticles(container, options) {
  const particles = new GlowParticles(container, options);
  particles.init();
  return particles;
}
