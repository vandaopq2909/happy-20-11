import { clamp, prefersReducedMotion } from '../utils.js';

/**
 * Lightweight Canvas 2D petal field.
 * - DPR capped at 2
 * - pauses off-screen / in hidden tabs
 * - static fallback under prefers-reduced-motion
 */
export class PetalField {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d', { alpha: true });
    this.options = {
      count: 22,
      colors: ['#f8cedd', '#f3aec8', '#ffe4e8', '#e8c77a', '#dfa8c5'],
      minSize: 5,
      maxSize: 13,
      speed: 1,
      ...options,
    };
    this.petals = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.running = false;
    this.active = false;
    this.raf = 0;
    this.last = 0;
    this.time = 0;
    this.reduced = prefersReducedMotion();
    this.onResize = this.onResize.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.tick = this.tick.bind(this);
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.build();
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.renderStatic();
  }

  build() {
    const areaScale = clamp((this.width * this.height) / (414 * 896), 0.6, 2);
    const count = Math.round(
      (this.reduced ? 6 : this.options.count) *
        areaScale *
        (window.matchMedia('(max-width: 374px)').matches ? 0.8 : 1),
    );

    this.petals = Array.from({ length: count }, () => this.makePetal(true));
  }

  makePetal(anywhere = false) {
    const size = this.options.minSize + Math.random() * (this.options.maxSize - this.options.minSize);
    return {
      x: Math.random() * this.width,
      y: anywhere ? Math.random() * this.height : -30 - Math.random() * 120,
      size,
      speed: (24 + Math.random() * 46) * this.options.speed,
      sway: 8 + Math.random() * 24,
      swaySpeed: 0.35 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.7,
      alpha: 0.18 + Math.random() * 0.5,
      color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
    };
  }

  onResize() {
    this.resize();
    this.build();
    this.renderStatic();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width || window.innerWidth);
    this.height = Math.max(1, rect.height || window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setActive(active) {
    this.active = active;
    if (!this.canvas) return;
    if (active && !this.reduced) {
      this.start();
    } else {
      this.stop();
      if (active) this.renderStatic();
    }
  }

  start() {
    if (this.running || !this.active || document.visibilityState === 'hidden') return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  onVisibility() {
    if (document.visibilityState === 'hidden') {
      this.stop();
    } else if (this.active && !this.reduced) {
      this.start();
    }
  }

  tick(timestamp) {
    if (!this.running) return;
    const delta = this.last ? Math.min((timestamp - this.last) / 1000, 0.045) : 0.016;
    this.last = timestamp;
    this.time += delta;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();

    for (const petal of this.petals) {
      petal.y += petal.speed * delta;
      petal.x += Math.sin(this.time * petal.swaySpeed + petal.phase) * petal.sway * delta;
      petal.rotation += petal.spin * delta;

      if (petal.y > this.height + 40) {
        Object.assign(petal, this.makePetal(false));
      }
      if (petal.x < -30) petal.x = this.width + 20;
      if (petal.x > this.width + 30) petal.x = -20;

      this.drawPetal(ctx, petal, false);
    }

    ctx.restore();
    this.raf = requestAnimationFrame(this.tick);
  }

  renderStatic() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    this.petals.slice(0, 9).forEach((petal, index) => {
      petal.x = ((index * 149) % Math.max(1, this.width - 30)) + 15;
      petal.y = 50 + ((index * 211) % Math.max(1, this.height - 120));
      petal.rotation = index * 0.7;
      this.drawPetal(ctx, petal, true);
    });
    ctx.restore();
  }

  drawPetal(ctx, petal, staticMode) {
    const { size, color, alpha, rotation } = petal;
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha * (staticMode ? 0.65 : 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.92, -size * 0.26, size * 0.7, size * 0.62, 0, size);
    ctx.bezierCurveTo(-size * 0.7, size * 0.62, -size * 0.92, -size * 0.26, 0, -size);
    ctx.fill();
    ctx.globalAlpha *= 0.6;
    ctx.strokeStyle = 'rgba(255, 247, 250, 0.55)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.75);
    ctx.lineTo(0, size * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.petals = [];
  }
}

export function createPetalField(canvas, options) {
  const field = new PetalField(canvas, options);
  field.init();
  return field;
}
