export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => motionQuery.matches;

export const isTouchDevice = () =>
  window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;

export const isLowPowerDevice = () => {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  return cores <= 4 || memory <= 3;
};

export const shouldReduceMotion = () => prefersReducedMotion();

/**
 * Splits a heading into animatable character spans while keeping the accessible
 * name intact. Spaces are preserved so layout and line-breaking still work.
 */
export function splitChars(element) {
  if (!element || element.dataset.split === 'true') {
    return Array.from(element?.querySelectorAll('.char') ?? []);
  }

  const text = element.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  element.setAttribute('aria-label', text);
  element.textContent = '';
  const fragment = document.createDocumentFragment();

  Array.from(text).forEach((character) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = character === ' ' ? '\u00a0' : character;
    fragment.appendChild(span);
  });

  element.appendChild(fragment);
  element.dataset.split = 'true';
  return Array.from(element.querySelectorAll('.char'));
}

export function showToast(message, duration = 2600) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
}

export function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Private browsing — preferences simply won't persist. */
  }
}

export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
