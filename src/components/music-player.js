import { Howl, Howler } from 'howler';
import { $, clamp, showToast } from '../utils.js';

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;
const YT_BUFFERING = 3;
const YT_API_SRC = 'https://www.youtube.com/iframe_api';
const YT_WATCHDOG_MS = 8000;

/**
 * One persistent background player.
 *
 * Primary source: the official YouTube embed (streamed, not downloaded).
 * If YouTube cannot be reached / embedded, the locally generated fallback
 * track is used. `play()` must be called from a user gesture on mobile.
 */
export class MusicPlayer {
  constructor(config) {
    this.config = config;
    this.dock = $('#music-dock');
    this.button = $('#music-toggle');
    this.slider = $('#music-volume');
    this.status = $('#music-status');

    this.level = clamp(Number(config?.volume ?? 0.38), 0, 1);
    this.mode = config?.youtubeId ? 'youtube' : 'local';
    this.available = true;
    this.started = false;
    this.playing = false;
    this.pendingPlay = false;

    this.yt = null;
    this.ytHost = null;
    this.ytReady = false;
    this.ytWatchdog = 0;
    this.volumeTimer = 0;
    this.pauseTimer = 0;
    this.apiPromise = null;

    this.local = null;
    this.localStarted = false;

    this.unlockAudio = () => {
      // Howler's audio context may need to be resumed by a real gesture on iOS.
      try {
        if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
      } catch {
        /* no-op */
      }
    };
  }

  init() {
    if (this.slider) {
      this.slider.value = String(Math.round(this.level * 100));
      this.slider.addEventListener('input', () => {
        this.level = clamp(Number(this.slider.value) / 100, 0, 1);
        this.applyVolume();
      });
    }

    this.button?.addEventListener('click', () => this.toggle());
    this.createLocalPlayer();

    if (this.mode === 'youtube') this.initYouTube();
  }

  /* ------------------------------------------------------------------ */
  /* YouTube                                                             */
  /* ------------------------------------------------------------------ */

  loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve();
    if (this.apiPromise) return this.apiPromise;

    this.apiPromise = new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (error) reject(error);
        else resolve();
      };
      const timeout = window.setTimeout(
        () => finish(new Error('YouTube IFrame API timeout')),
        12000,
      );

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        finish();
      };

      let script = document.querySelector(`script[src="${YT_API_SRC}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = YT_API_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('error', () => finish(new Error('YouTube API failed to load')), {
        once: true,
      });
    });

    return this.apiPromise;
  }

  initYouTube() {
    this.loadYouTubeApi()
      .then(() => {
        if (this.mode !== 'youtube') return;
        if (!window.YT?.Player) throw new Error('YouTube Player API unavailable');

        const host = document.createElement('div');
        host.id = 'youtube-audio-player';
        host.setAttribute('aria-hidden', 'true');
        document.body.appendChild(host);
        this.ytHost = host;

        this.yt = new window.YT.Player(host, {
          videoId: this.config.youtubeId,
          host: 'https://www.youtube.com',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            loop: 1,
            modestbranding: 1,
            origin: window.location.origin,
            playlist: this.config.youtubeId,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => this.onYouTubeReady(),
            onStateChange: (event) => this.onYouTubeState(event),
            onError: (event) => this.activateFallback(`YouTube error ${event?.data ?? ''}`),
          },
        });
      })
      .catch((error) => {
        console.warn('[Bloom] YouTube music unavailable:', error);
        this.activateFallback('YouTube API unavailable');
      });
  }

  onYouTubeReady() {
    if (!this.yt || typeof this.yt.setVolume !== 'function') return;
    this.ytReady = true;
    this.yt.setVolume(Math.round(this.level * 100));
    const iframe = this.yt.getIframe?.();
    iframe?.setAttribute('aria-hidden', 'true');
    iframe?.setAttribute('tabindex', '-1');
    if (this.pendingPlay) this.playYouTube();
  }

  onYouTubeState(event) {
    const state = event?.data;
    if (state === YT_PLAYING || state === YT_BUFFERING) {
      this.clearWatchdog();
      this.started = true;
      this.setPlaying(true);
    } else if (state === YT_PAUSED) {
      this.pendingPlay = false;
      this.setPlaying(false);
    } else if (state === YT_ENDED) {
      // `loop` + `playlist` normally handles this; this is a safety net.
      this.yt?.seekTo(0, true);
      this.yt?.playVideo();
    }
  }

  playYouTube() {
    if (this.mode !== 'youtube') return this.playLocal();
    this.pendingPlay = true;
    this.started = true;

    if (!this.ytReady || !this.yt) {
      this.setPlaying(false, 'Đang kết nối nhạc từ YouTube…');
      return true;
    }

    try {
      this.pendingPlay = false;
      this.yt.unMute();
      this.yt.setVolume(0);
      this.yt.playVideo();
      this.rampYouTube(this.level, 1600);
      this.setPlaying(false, 'Đang tải nhạc từ YouTube…');
      this.armWatchdog();
      return true;
    } catch (error) {
      console.warn('[Bloom] YouTube playback failed:', error);
      this.activateFallback('YouTube playback failed');
      return false;
    }
  }

  rampYouTube(target, duration) {
    if (!this.yt || typeof this.yt.setVolume !== 'function') return;
    window.clearInterval(this.volumeTimer);
    const from = Number(this.yt.getVolume?.() ?? 0);
    const to = Math.round(clamp(target, 0, 1) * 100);
    const startedAt = performance.now();

    this.volumeTimer = window.setInterval(() => {
      const progress = clamp((performance.now() - startedAt) / duration, 0, 1);
      const value = Math.round(from + (to - from) * progress);
      this.yt?.setVolume(value);
      if (progress >= 1) window.clearInterval(this.volumeTimer);
    }, 50);
  }

  armWatchdog() {
    this.clearWatchdog();
    this.ytWatchdog = window.setTimeout(() => {
      if (this.mode === 'youtube' && !this.playing) {
        this.activateFallback('YouTube did not start');
      }
    }, YT_WATCHDOG_MS);
  }

  clearWatchdog() {
    window.clearTimeout(this.ytWatchdog);
    this.ytWatchdog = 0;
  }

  /* ------------------------------------------------------------------ */
  /* Local fallback                                                      */
  /* ------------------------------------------------------------------ */

  createLocalPlayer() {
    if (this.local || !this.config?.src) return;
    this.local = new Howl({
      src: [this.config.src],
      loop: true,
      preload: false,
      html5: true,
      pool: 1,
      volume: 0,
      onplay: () => this.setPlaying(true),
      onpause: () => this.setPlaying(false),
      onstop: () => this.setPlaying(false),
      onloaderror: (_id, error) => this.handleLocalError(error),
      onplayerror: () => {
        this.setPlaying(false);
        Howler.once('unlock', () => {
          if (this.mode === 'local' && !this.playing) this.playLocal();
        });
      },
    });
  }

  activateFallback(reason) {
    if (this.mode === 'local') return;
    const wasRequested = this.started || this.pendingPlay;
    this.mode = 'local';
    this.pendingPlay = false;
    this.clearWatchdog();
    window.clearInterval(this.volumeTimer);
    try {
      this.yt?.destroy?.();
    } catch {
      /* no-op */
    }
    this.yt = null;
    this.ytReady = false;
    this.ytHost?.remove();
    this.ytHost = null;
    this.createLocalPlayer();
    this.status && (this.status.textContent = 'Đang dùng nhạc dự phòng.');
    if (wasRequested) {
      this.playLocal();
      showToast('Không phát được nhạc từ YouTube. Đang dùng nhạc dự phòng.');
    }
    console.warn('[Bloom] Switching to fallback music:', reason);
  }

  playLocal() {
    this.createLocalPlayer();
    if (!this.local || !this.available) return false;
    this.unlockAudio();
    this.started = true;
    const id = this.local.play();
    if (typeof id === 'undefined') {
      Howler.once('unlock', () => {
        if (!this.playing) this.playLocal();
      });
      return false;
    }
    this.localStarted = true;
    this.local.volume(0);
    this.local.fade(0, this.level, 1600);
    this.setPlaying(true);
    return true;
  }

  handleLocalError(error) {
    this.available = false;
    this.setPlaying(false);
    if (this.status) this.status.textContent = 'Không tải được nhạc nền.';
    if (this.slider) this.slider.disabled = true;
    showToast('Không tải được nhạc nền. Bạn vẫn có thể tiếp tục xem món quà.');
    console.warn('[Bloom] Fallback audio could not be loaded:', error);
  }

  /* ------------------------------------------------------------------ */
  /* Public controls                                                     */
  /* ------------------------------------------------------------------ */

  play() {
    if (!this.available) return false;
    this.unlockAudio();
    if (this.mode === 'local') return this.playLocal();
    return this.playYouTube();
  }

  pause() {
    this.pendingPlay = false;
    this.clearWatchdog();
    if (this.mode === 'youtube' && this.yt && this.ytReady) {
      this.rampYouTube(0, 280);
      window.clearTimeout(this.pauseTimer);
      this.pauseTimer = window.setTimeout(() => {
        try {
          this.yt?.pauseVideo();
        } catch {
          /* no-op */
        }
      }, 300);
      this.setPlaying(false);
      return;
    }
    if (this.mode === 'local' && this.local) {
      const current = this.local.volume();
      this.local.fade(current, 0, 320);
      window.clearTimeout(this.pauseTimer);
      this.pauseTimer = window.setTimeout(() => this.local?.pause(), 340);
    }
    this.setPlaying(false);
  }

  resume() {
    if (this.mode === 'local') {
      this.createLocalPlayer();
      if (!this.local) return;
      this.unlockAudio();
      if (!this.local.playing()) this.local.play();
      this.local.volume(0);
      this.local.fade(0, this.level, 900);
      this.setPlaying(true);
      return;
    }
    if (!this.ytReady || !this.yt) {
      this.pendingPlay = true;
      this.started = true;
      this.setPlaying(false, 'Đang kết nối nhạc từ YouTube…');
      return;
    }
    try {
      this.yt.unMute();
      this.yt.setVolume(0);
      this.yt.playVideo();
      this.rampYouTube(this.level, 900);
      this.armWatchdog();
    } catch {
      this.activateFallback('YouTube resume failed');
    }
  }

  toggle() {
    if (!this.available) return;
    if (!this.started) {
      this.play();
    } else if (this.playing) {
      this.pause();
    } else {
      this.resume();
    }
  }

  applyVolume() {
    if (this.mode === 'youtube' && this.ytReady && this.yt) {
      if (this.playing) this.yt.setVolume(Math.round(this.level * 100));
      return;
    }
    if (this.local) {
      this.local.volume(this.playing ? this.level : 0);
    }
  }

  setPlaying(playing, statusText) {
    this.playing = Boolean(playing);
    this.dock?.setAttribute('data-playing', String(this.playing));
    this.button?.setAttribute('aria-pressed', String(this.playing));
    this.button?.setAttribute(
      'aria-label',
      this.playing ? 'Tắt nhạc nền' : 'Bật nhạc nền từ YouTube',
    );
    if (this.status) {
      if (statusText) this.status.textContent = statusText;
      else if (this.playing) {
        const via = this.mode === 'local' ? 'nhạc dự phòng' : 'YouTube';
        this.status.textContent = `Nhạc nền đang phát (${via}) · ${this.config?.title ?? 'Người Gieo Mầm Xanh'}.`;
      } else {
        this.status.textContent = 'Nhạc đang tắt';
      }
    }
  }

  isPlaying() {
    return this.playing;
  }

  destroy() {
    this.clearWatchdog();
    window.clearInterval(this.volumeTimer);
    window.clearTimeout(this.pauseTimer);
    try {
      this.yt?.destroy?.();
    } catch {
      /* no-op */
    }
    this.yt = null;
    this.local?.unload();
    this.local = null;
  }
}
