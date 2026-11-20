import { gsap } from 'gsap';
import { $, prefersReducedMotion } from '../utils.js';

export function createLetterScene(config, { onStartAudio } = {}) {
  const scene = $('#scene-letter');
  const stage = $('#letter-stage');
  const stageScroll = $('.letter-stage__scroll', scene);
  const reader = $('#letter-reader');
  const readerScroll = $('.letter-reader__scroll', scene);
  const paper = $('#letter-paper');
  const envelope = $('#envelope');
  const envelopeTrigger = $('#envelope-trigger');
  const openButton = $('#open-letter');
  const openButtonText = $('.btn__text', openButton);
  const stageHint = $('.letter-stage__bottom .tap-hint', scene);
  const closeButton = $('#close-letter');
  const skipButton = $('#skip-typing');
  const greetingEl = $('#letter-greeting');
  const paragraphsHost = $('#letter-paragraphs');
  const signatureEl = $('#letter-signature');

  let paragraphs = [];
  let totalChars = 0;
  let characterBudget = 0;
  let typing = false;
  let readerOpen = false;
  let opening = false;
  let raf = 0;
  let lastFrame = 0;
  let accumulator = 0;
  let startTimer = 0;
  let autoOpenTimer = 0;
  let openFallbackTimer = 0;
  let timeline = null;
  let openTimeline = null;
  let hasEntered = false;
  let outsidePointer = null;

  const DEFAULT_HINT = 'Một lá thư nhỏ, được viết bằng cả trái tim.';
  const CLOSED_LABEL = 'ĐỌC LẠI LÁ THƯ';
  const CLOSED_HINT = 'Chạm vào phong thư để mở lại';

  const buildLetter = () => {
    greetingEl.textContent = config.letter.greeting;
    signatureEl.textContent = config.letter.signature || config.sender.signature;
    paragraphsHost.innerHTML = '';
    paragraphs = [];
    totalChars = 0;

    config.letter.paragraphs.forEach((text) => {
      const paragraph = document.createElement('p');
      paragraph.className = 'letter-p';
      paragraph.setAttribute('aria-label', text);
      const ghost = document.createElement('span');
      ghost.className = 'letter-p__ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.textContent = text;
      const typed = document.createElement('span');
      typed.className = 'letter-p__typed';
      typed.setAttribute('aria-hidden', 'true');
      paragraph.append(ghost, typed);
      paragraphsHost.appendChild(paragraph);
      paragraphs.push({ text, typed, element: paragraph, start: totalChars });
      totalChars += text.length;
    });
  };

  const renderTyped = () => {
    const budget = Math.floor(characterBudget);
    paragraphs.forEach((paragraph) => {
      const end = Math.min(paragraph.text.length, Math.max(0, budget - paragraph.start));
      const text = paragraph.text.slice(0, end);
      paragraph.typed.textContent = text;
      paragraph.element.classList.toggle(
        'is-current',
        budget >= paragraph.start && budget < paragraph.start + paragraph.text.length,
      );
      if (end > 0 && end < paragraph.text.length) {
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        paragraph.typed.appendChild(cursor);
      }
    });
  };

  const finishTyping = () => {
    typing = false;
    cancelAnimationFrame(raf);
    characterBudget = totalChars;
    renderTyped();
    skipButton.hidden = true;
    skipButton.disabled = true;
  };

  const typeFrame = (now) => {
    if (!typing) return;
    if (!lastFrame) lastFrame = now;
    const delta = Math.min(now - lastFrame, 80);
    lastFrame = now;
    accumulator += delta;
    const speed = 4; // ms per character — still visible, but respects the reader.
    const chars = Math.floor(accumulator / speed);
    if (chars > 0) {
      accumulator -= chars * speed;
      characterBudget = Math.min(totalChars, characterBudget + chars);
      renderTyped();
      if (characterBudget >= totalChars) {
        finishTyping();
        return;
      }
    }
    raf = requestAnimationFrame(typeFrame);
  };

  const startTyping = () => {
    if (typing || !readerOpen) return;
    if (prefersReducedMotion() || characterBudget >= totalChars) {
      finishTyping();
      return;
    }
    typing = true;
    lastFrame = 0;
    accumulator = 0;
    skipButton.hidden = false;
    skipButton.disabled = false;
    skipButton.textContent = 'Hiện toàn bộ';
    raf = requestAnimationFrame(typeFrame);
  };

  const pauseTyping = () => {
    typing = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const resetEnvelopeStage = ({ label = 'MỞ LÁ THƯ', hint = DEFAULT_HINT, focus = false } = {}) => {
    openTimeline?.kill();
    openTimeline = null;
    opening = false;

    gsap.killTweensOf([
      '.envelope__flap',
      '.envelope__seal',
      '.envelope__paper-peek',
      '.envelope',
      '.envelope-scene',
      '.letter-heading',
      '.letter-stage__bottom',
      stage,
    ]);
    gsap.set(stage, { clearProps: 'opacity,visibility' });
    gsap.set(['.envelope__flap', '.envelope__seal', '.envelope__paper-peek', '.envelope', '.envelope-scene'], {
      clearProps: 'opacity,transform',
    });
    gsap.set(['.letter-heading', '.letter-stage__bottom'], { clearProps: 'opacity,transform' });

    envelope.classList.remove('is-opening');
    stage.classList.remove('is-opening', 'is-hidden');
    stage.removeAttribute('aria-hidden');
    openButton.disabled = false;
    openButtonText.textContent = label;
    stageHint.textContent = hint;
    stageScroll.scrollTop = 0;

    if (focus) {
      envelopeTrigger.focus({ preventScroll: true });
    }
  };

  const showReader = () => {
    if (readerOpen) return;
    readerOpen = true;
    opening = false;
    window.clearTimeout(autoOpenTimer);
    window.clearTimeout(startTimer);
    window.clearTimeout(openFallbackTimer);

    stage.classList.add('is-hidden');
    stage.setAttribute('aria-hidden', 'true');
    reader.classList.add('is-open');
    reader.setAttribute('aria-hidden', 'false');
    envelopeTrigger.setAttribute('aria-expanded', 'true');
    readerScroll.scrollTop = 0;

    skipButton.hidden = characterBudget >= totalChars;
    skipButton.disabled = characterBudget >= totalChars;

    if (!prefersReducedMotion()) {
      gsap.fromTo(
        paper,
        { opacity: 0, y: 42, scale: 0.975 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' },
      );
      gsap.fromTo(
        '.letter-paper__top, .letter-paper__greeting, .letter-paper__signature, .letter-paper__bottom',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, delay: 0.25 },
      );
    }

    reader.focus?.({ preventScroll: true });
    startTimer = window.setTimeout(startTyping, prefersReducedMotion() ? 0 : 800);
  };

  const openLetter = ({ auto = false } = {}) => {
    if (readerOpen || opening) return;
    opening = true;
    window.clearTimeout(autoOpenTimer);
    window.clearTimeout(startTimer);
    timeline?.kill();
    timeline = null;

    if (!auto) onStartAudio?.();
    openButton.disabled = true;
    openButtonText.textContent = 'ĐANG MỞ...';
    stageHint.textContent = 'Lá thư đang được mở...';
    envelope.classList.add('is-opening');
    stage.classList.add('is-opening');

    if (prefersReducedMotion()) {
      showReader();
      return;
    }

    // Safety net for a stalled animation loop on a very weak device.
    window.clearTimeout(openFallbackTimer);
    openFallbackTimer = window.setTimeout(() => {
      opening = false;
      showReader();
    }, 4800);

    openTimeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        opening = false;
        showReader();
      },
    });

    openTimeline
      .to('.envelope__seal', { opacity: 0, scale: 0.6, duration: 0.5 }, 0)
      .to('.envelope', { rotationX: 1, y: -3, duration: 0.6 }, 0)
      .to(
        '.envelope__flap',
        { rotationX: -168, duration: 1.55, ease: 'power2.inOut' },
        0.35,
      )
      .to('.envelope__paper-peek', { y: '-20%', duration: 1.15, ease: 'power2.inOut' }, 0.95)
      .to('.letter-heading, .letter-stage__bottom', { opacity: 0.18, duration: 0.7 }, 0.55)
      .to('.envelope-scene', { y: -10, scale: 1.03, duration: 1.3 }, 0.4)
      .to('.letter-stage', { opacity: 0, duration: 0.8, delay: 0.25 }, 1.35);
  };

  const closeReader = ({ focus = true } = {}) => {
    if (!readerOpen) return;
    readerOpen = false;
    opening = false;
    pauseTyping();
    window.clearTimeout(startTimer);
    window.clearTimeout(autoOpenTimer);
    window.clearTimeout(openFallbackTimer);
    openTimeline?.kill();
    openTimeline = null;

    reader.classList.remove('is-open');
    reader.setAttribute('aria-hidden', 'true');
    envelopeTrigger.setAttribute('aria-expanded', 'false');
    resetEnvelopeStage({ label: CLOSED_LABEL, hint: CLOSED_HINT, focus });
  };

  const animateStage = (initial) => {
    if (timeline) timeline.kill();
    if (prefersReducedMotion()) {
      gsap.set(['.letter-heading', '.envelope-scene', '.letter-stage__bottom'], {
        opacity: 1,
        y: 0,
      });
      return;
    }
    timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .fromTo(
        '.letter-heading .eyebrow',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.65 },
        initial ? 0 : 0.05,
      )
      .fromTo(
        '.letter-heading__title',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.95 },
        initial ? 0.12 : 0.08,
      )
      .fromTo(
        '.letter-heading__sub',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7 },
        initial ? 0.3 : 0.16,
      )
      .fromTo(
        '.envelope-scene',
        { opacity: 0, y: 28, scale: 0.94, rotateX: 9 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.1 },
        initial ? 0.4 : 0.2,
      )
      .fromTo(
        '.letter-stage__bottom',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.75 },
        initial ? 0.82 : 0.45,
      );
  };

  const scheduleAutoOpen = () => {
    window.clearTimeout(autoOpenTimer);
    autoOpenTimer = window.setTimeout(
      () => {
        if (
          scene.classList.contains('is-active') &&
          document.visibilityState === 'visible' &&
          !readerOpen &&
          !opening
        ) {
          openLetter({ auto: true });
        }
      },
      prefersReducedMotion() ? 420 : 1750,
    );
  };

  const onReaderPointerDown = (event) => {
    if (!readerOpen || event.target.closest('.letter-paper')) {
      outsidePointer = null;
      return;
    }
    outsidePointer = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  };

  const onReaderPointerUp = (event) => {
    if (!readerOpen || !outsidePointer) return;
    const dx = event.clientX - outsidePointer.x;
    const dy = event.clientY - outsidePointer.y;
    const elapsed = performance.now() - outsidePointer.time;
    outsidePointer = null;
    if (event.target.closest('.letter-paper') || Math.hypot(dx, dy) > 14 || elapsed > 700) {
      return;
    }
    closeReader();
  };

  const onReaderPointerCancel = () => {
    outsidePointer = null;
  };

  const onDocumentKeydown = (event) => {
    if (event.key === 'Escape' && readerOpen && scene.classList.contains('is-active')) {
      event.preventDefault();
      closeReader();
    }
  };

  const handleOpenClick = () => openLetter();
  const handleCloseClick = () => closeReader();

  const handleEnvelopeKeydown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLetter();
    }
  };

  const init = () => {
    buildLetter();
    openButton.addEventListener('click', handleOpenClick);
    skipButton.addEventListener('click', finishTyping);
    closeButton.addEventListener('click', handleCloseClick);
    envelopeTrigger.addEventListener('click', handleOpenClick);
    envelopeTrigger.addEventListener('keydown', handleEnvelopeKeydown);
    reader.addEventListener('pointerdown', onReaderPointerDown, { passive: true });
    reader.addEventListener('pointerup', onReaderPointerUp, { passive: true });
    reader.addEventListener('pointercancel', onReaderPointerCancel);
    document.addEventListener('keydown', onDocumentKeydown);
  };

  const enter = () => {
    scene.classList.add('is-entered');
    if (readerOpen) {
      stage.classList.add('is-hidden');
      stage.setAttribute('aria-hidden', 'true');
      reader.classList.add('is-open');
      reader.setAttribute('aria-hidden', 'false');
      startTyping();
      return;
    }

    resetEnvelopeStage({ label: 'MỞ LÁ THƯ', hint: DEFAULT_HINT, focus: false });
    animateStage(!hasEntered);
    hasEntered = true;
    stageScroll.scrollTop = 0;
    // Let the scene fade in, then slowly open the envelope by itself. The
    // recipient can tap the envelope/button at any time to open it sooner.
    scheduleAutoOpen();
  };

  const leave = () => {
    scene.classList.remove('is-entered');
    pauseTyping();
    window.clearTimeout(startTimer);
    window.clearTimeout(autoOpenTimer);
    window.clearTimeout(openFallbackTimer);
    timeline?.kill();
    timeline = null;

    if (!readerOpen) {
      openTimeline?.kill();
      openTimeline = null;
      opening = false;
      resetEnvelopeStage({ label: 'MỞ LÁ THƯ', hint: DEFAULT_HINT, focus: false });
    }
  };

  const reset = () => {
    pauseTyping();
    window.clearTimeout(startTimer);
    window.clearTimeout(autoOpenTimer);
    window.clearTimeout(openFallbackTimer);
    openTimeline?.kill();
    openTimeline = null;
    timeline?.kill();
    timeline = null;
    readerOpen = false;
    opening = false;
    characterBudget = 0;
    accumulator = 0;
    outsidePointer = null;

    stage.classList.remove('is-hidden');
    stage.removeAttribute('aria-hidden');
    reader.classList.remove('is-open');
    reader.setAttribute('aria-hidden', 'true');
    envelopeTrigger.setAttribute('aria-expanded', 'false');
    skipButton.hidden = false;
    skipButton.disabled = false;
    skipButton.textContent = 'Hiện toàn bộ';
    resetEnvelopeStage({ focus: false });
    gsap.set(
      [paper, '.letter-paper__top', '.letter-paper__greeting', '.letter-paper__signature', '.letter-paper__bottom'],
      { clearProps: 'opacity,transform' },
    );
    paragraphs.forEach((paragraph) => {
      paragraph.typed.textContent = '';
      paragraph.element.classList.remove('is-current');
    });
  };

  const destroy = () => {
    pauseTyping();
    window.clearTimeout(startTimer);
    window.clearTimeout(autoOpenTimer);
    window.clearTimeout(openFallbackTimer);
    openTimeline?.kill();
    timeline?.kill();
    openButton.removeEventListener('click', handleOpenClick);
    skipButton.removeEventListener('click', finishTyping);
    closeButton.removeEventListener('click', handleCloseClick);
    envelopeTrigger.removeEventListener('click', handleOpenClick);
    envelopeTrigger.removeEventListener('keydown', handleEnvelopeKeydown);
    reader.removeEventListener('pointerdown', onReaderPointerDown);
    reader.removeEventListener('pointerup', onReaderPointerUp);
    reader.removeEventListener('pointercancel', onReaderPointerCancel);
    document.removeEventListener('keydown', onDocumentKeydown);
  };

  return {
    init,
    enter,
    leave,
    reset,
    destroy,
    isOpen: () => readerOpen,
    __debug: { finishTyping, closeReader },
  };
}
