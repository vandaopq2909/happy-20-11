import { gsap } from 'gsap';
import Swiper from 'swiper';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { galleryGroups, galleryMeta, galleryPhotos, getGroup } from '../data/gallery.js';
import { $, $$, prefersReducedMotion } from '../utils.js';

export function createMemoriesScene({ lightbox }) {
  const scene = $('#scene-memories');
  const slidesHost = $('#memory-slides');
  const chaptersHost = $('#gallery-chapters');
  const swiperEl = $('#memory-swiper');
  const currentEl = $('#album-current');
  const totalEl = $('#album-total');
  const chapterEl = $('#album-chapter');
  const prevButton = $('#album-prev');
  const nextButton = $('#album-next');

  let swiper = null;
  let swiperStarting = false;
  let timeline = null;
  let built = false;

  const buildSlides = () => {
    if (built) return;
    built = true;
    const fragment = document.createDocumentFragment();

    galleryPhotos.forEach((photo, index) => {
      const group = getGroup(photo.group);
      const slide = document.createElement('div');
      slide.className = 'swiper-slide memory-slide';
      slide.innerHTML = `
        <article class="memory-card" role="button" tabindex="0"
          aria-label="Mở ảnh ${index + 1}: ${group.label} — ${group.vi}">
          <div class="memory-card__photo">
            <img class="memory-card__img" src="${photo.src}" alt="${photo.alt}"
              style="object-position:${photo.position || '50% 50%'}"
              width="1200" height="1500" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async" />
            <span class="memory-card__group">${group.number} · ${group.label}</span>
            <span class="memory-card__num">${String(index + 1).padStart(2, '0')}</span>
            <div class="memory-card__text">
              <span class="memory-card__vi">${group.vi}</span>
              <p class="memory-card__caption">${photo.caption}</p>
            </div>
          </div>
          <div class="memory-card__footer">
            <span>HUIT KARATE · 20.11.2026</span>
            <span>${index + 1} / ${galleryPhotos.length}</span>
          </div>
        </article>
      `;

      const card = $('.memory-card', slide);
      const open = () => lightbox.open(index);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      fragment.appendChild(slide);
    });

    slidesHost.appendChild(fragment);
    totalEl.textContent = String(galleryPhotos.length).padStart(2, '0');
  };

  const buildChapters = () => {
    if (chaptersHost.childElementCount) return;
    const fragment = document.createDocumentFragment();
    galleryGroups.forEach((group) => {
      const button = document.createElement('button');
      button.className = 'chapter';
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('aria-controls', 'memory-swiper');
      button.dataset.group = group.id;
      button.innerHTML = `<span>${group.number}</span>${group.tab || group.label}`;
      button.addEventListener('click', () => {
        if (!swiper) return;
        const index = galleryPhotos.findIndex((photo) => photo.group === group.id);
        if (index >= 0) swiper.slideTo(index);
      });
      fragment.appendChild(button);
    });
    chaptersHost.appendChild(fragment);
  };

  const updateChapter = (index) => {
    const photo = galleryPhotos[index];
    if (!photo) return;
    const group = getGroup(photo.group);
    currentEl.textContent = String(index + 1).padStart(2, '0');
    chapterEl.textContent = `${group.label} · ${group.vi}`;
    $$('.chapter', chaptersHost).forEach((button) => {
      const active = button.dataset.group === group.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      if (active) {
        const left = button.offsetLeft - chaptersHost.clientWidth / 2 + button.clientWidth / 2;
        chaptersHost.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    });
  };

  const initSwiper = () => {
    if (swiper || swiperStarting) return;
    swiperStarting = true;
    swiper = new Swiper(swiperEl, {
      modules: [EffectCoverflow],
      effect: prefersReducedMotion() ? 'slide' : 'coverflow',
      speed: prefersReducedMotion() ? 0 : 700,
      slidesPerView: 1.1,
      centeredSlides: true,
      spaceBetween: 14,
      grabCursor: true,
      watchSlidesProgress: true,
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 80,
        modifier: 1.4,
        slideShadows: false,
      },
      breakpoints: {
        390: { slidesPerView: 1.12, spaceBetween: 16 },
        430: { slidesPerView: 1.14, spaceBetween: 18 },
        768: { slidesPerView: 1.62, spaceBetween: 26 },
        1024: { slidesPerView: 1.82, spaceBetween: 34 },
      },
      on: {
        init(instance) {
          updateChapter(instance.activeIndex);
        },
        slideChange(instance) {
          updateChapter(instance.activeIndex);
        },
      },
      a11y: {
        enabled: true,
        containerMessage: 'Album ảnh kỷ niệm CLB Võ thuật HUIT',
      },
    });
    swiperStarting = false;
  };

  const animate = () => {
    if (timeline) timeline.kill();
    if (prefersReducedMotion()) {
      gsap.set(['.memories__head', '.chapters', '.album', '.album__controls', '.memories__bottom'], {
        opacity: 1,
        y: 0,
      });
      return;
    }
    timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo('.memories__head', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9 })
      .fromTo(
        '.chapters .chapter',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.05 },
        0.18,
      )
      .fromTo(
        '.album',
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' },
        0.25,
      )
      .fromTo(
        '.album__controls',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.55,
      )
      .fromTo(
        '.memories__bottom',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.65,
      );
  };

  const init = () => {
    buildSlides();
    buildChapters();
    prevButton.addEventListener('click', () => swiper?.slidePrev());
    nextButton.addEventListener('click', () => swiper?.slideNext());
    lightbox.init();
  };

  const enter = () => {
    scene.classList.add('is-entered');
    requestAnimationFrame(() => {
      initSwiper();
      swiper?.update();
      animate();
    });
  };

  const leave = () => {
    scene.classList.remove('is-entered');
    timeline?.kill();
    timeline = null;
    if (lightbox.isOpen) lightbox.close();
  };

  const destroy = () => {
    timeline?.kill();
    swiper?.destroy(true, true);
    swiper = null;
    lightbox.destroy();
  };

  return { init, enter, leave, destroy, meta: galleryMeta };
}
