import { gsap } from 'gsap';
import { $, isLowPowerDevice, prefersReducedMotion, splitChars } from '../utils.js';

class CelebrationField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.reduced = prefersReducedMotion();
    this.lowPower = isLowPowerDevice();
    this.petals = [];
    this.sparks = [];
    this.running = false;
    this.active = false;
    this.raf = 0;
    this.last = 0;
    this.elapsed = 0;
    this.nextBurst = 2.5;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.resize = this.resize.bind(this);
    this.visibility = this.visibility.bind(this);
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.build();
    window.addEventListener('resize', this.resize, { passive: true });
    document.addEventListener('visibilitychange', this.visibility);
    this.drawStatic();
  }

  build() {
    const count = this.reduced ? 10 : this.lowPower ? 18 : 26;
    this.petals = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2,
      radius: 1 + (index % 3) * 0.05,
      speed: 0.05 + (index % 5) * 0.008,
      size: 4 + (index % 4) * 1.8,
      wobble: Math.random() * Math.PI * 2,
      color: index % 4 === 0 ? '#e8c77a' : index % 3 === 0 ? '#ffe4ee' : '#f6bfd6',
      alpha: 0.14 + (index % 4) * 0.075,
    }));
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
    if (active && !this.reduced) this.start();
    else {
      this.stop();
      if (active) this.drawStatic();
    }
  }

  start() {
    if (this.running || !this.active) return;
    if (document.visibilityState === 'hidden') return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  visibility() {
    if (document.visibilityState === 'hidden') this.stop();
    else if (this.active && !this.reduced) this.start();
  }

  frame = (timestamp) => {
    if (!this.running) return;
    const delta = this.last ? Math.min((timestamp - this.last) / 1000, 0.05) : 0.016;
    this.last = timestamp;
    this.elapsed += delta;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const centerX = this.width / 2;
    const centerY = this.height * 0.45;
    const radiusX = Math.min(this.width * 0.41, 230);
    const radiusY = radiusX * 0.49;

    this.petals.forEach((petal) => {
      const angle = petal.angle + this.elapsed * petal.speed;
      const wobble = Math.sin(this.elapsed * 0.6 + petal.wobble) * 0.045;
      const x = centerX + Math.cos(angle) * radiusX * (petal.radius + wobble);
      const y = centerY + Math.sin(angle) * radiusY * (petal.radius + wobble);
      const depth = (Math.sin(angle) + 1) / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalAlpha = petal.alpha * (0.55 + depth * 0.45);
      ctx.fillStyle = petal.color;
      const size = petal.size * (0.7 + depth * 0.55);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.9, -size * 0.2, size * 0.65, size * 0.65, 0, size);
      ctx.bezierCurveTo(-size * 0.65, size * 0.65, -size * 0.9, -size * 0.2, 0, -size);
      ctx.fill();
      ctx.restore();
    });

    // Sparse golden light ring.
    ctx.strokeStyle = 'rgba(232,199,122,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX * 1.02, radiusY * 1.02, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (this.elapsed > this.nextBurst) {
      this.spawnBurst();
      this.nextBurst = this.elapsed + (this.lowPower ? 5.6 : 4.2);
    }

    this.sparks = this.sparks.filter((spark) => spark.life > 0);
    this.sparks.forEach((spark) => {
      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      spark.vy += 42 * delta;
      spark.vx *= 0.992;
      spark.life -= delta;
      const alpha = Math.max(0, spark.life / spark.maxLife);
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * (0.4 + alpha), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    this.raf = requestAnimationFrame(this.frame);
  };

  spawnBurst() {
    const count = this.lowPower ? 10 : 18;
    const x = this.width * (0.28 + Math.random() * 0.44);
    const y = this.height * (0.16 + Math.random() * 0.2);
    const palette = ['#ffe3a6', '#f6bfd6', '#fff4de', '#e8c77a'];
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + Math.random() * 0.2;
      const speed = 24 + Math.random() * 42;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.2 + Math.random() * 1.8,
        color: palette[index % palette.length],
        life: 1.1 + Math.random() * 0.8,
        maxLife: 1.9,
      });
    }
  }

  drawStatic() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const centerX = this.width / 2;
    const centerY = this.height * 0.45;
    const radiusX = Math.min(this.width * 0.41, 230);
    const radiusY = radiusX * 0.49;
    ctx.save();
    this.petals.forEach((petal) => {
      const x = centerX + Math.cos(petal.angle) * radiusX;
      const y = centerY + Math.sin(petal.angle) * radiusY;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(petal.angle + Math.PI / 2);
      ctx.globalAlpha = petal.alpha * 0.55;
      ctx.fillStyle = petal.color;
      const size = petal.size * 0.85;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.9, -size * 0.2, size * 0.65, size * 0.65, 0, size);
      ctx.bezierCurveTo(-size * 0.65, size * 0.65, -size * 0.9, -size * 0.2, 0, -size);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}

export function createEndingScene({ onRestart }) {
  const scene = $('#scene-ending');
  const canvas = $('#ending-canvas');
  const nameEl = $('#ending-name');
  const field = new CelebrationField(canvas);
  let chars = [];
  let timeline = null;
  let hasEntered = false;

  const animate = () => {
    if (timeline) timeline.kill();
    if (prefersReducedMotion()) {
      gsap.set(
        ['.ending__small', '.ending__date', '.ending__blossom', '.ending__kham', '.ending__name', '.ending__quote', '.ending__sign', '.ending__actions'],
        { opacity: 1, y: 0 },
      );
      return;
    }
    timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo('.ending__small', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 0)
      .fromTo(
        '.ending__date',
        { opacity: 0, scale: 0.86, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power4.out' },
        0.1,
      )
      .fromTo(
        '.ending__blossom',
        { opacity: 0, scale: 0.4, rotate: -40 },
        { opacity: 1, scale: 1, rotate: 0, duration: 1 },
        0.5,
      )
      .fromTo('.ending__kham', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 0.7)
      .fromTo(
        chars,
        { opacity: 0, y: 26, rotateX: -40 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.9, stagger: 0.03 },
        0.8,
      )
      .fromTo('.ending__rule', { opacity: 0, scaleX: 0.4 }, { opacity: 1, scaleX: 1, duration: 0.7 }, 1.2)
      .fromTo('.ending__quote', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 1.3)
      .fromTo('.ending__sign', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 1.5)
      .fromTo('.ending__actions', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 1.65)
      .fromTo(
        '.ending-bg',
        { scale: 1.035 },
        { scale: 1, duration: 6, ease: 'power2.out', clearProps: 'scale' },
        0,
      );
  };

  const init = () => {
    field.init();
    chars = splitChars(nameEl);
    $('#restart')?.addEventListener('click', () => onRestart?.());
  };

  const enter = () => {
    scene.classList.add('is-entered');
    field.setActive(true);
    animate();
    hasEntered = true;
  };

  const leave = () => {
    scene.classList.remove('is-entered');
    field.setActive(false);
    timeline?.kill();
    timeline = null;
  };

  const destroy = () => {
    field.destroy();
    timeline?.kill();
  };

  return { init, enter, leave, destroy, hasEntered: () => hasEntered };
}
