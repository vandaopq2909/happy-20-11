import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The editable content lives in /assets (outside /public) so the folder
 * structure stays friendly for the sender. Copy it verbatim on build; Vite's
 * dev server serves root files directly, so the same /assets URLs work in dev.
 */
function copyEditableAssets() {
  return {
    name: 'bloom-copy-editable-assets',
    apply: 'build',
    closeBundle() {
      const source = resolve(process.cwd(), 'assets');
      const target = resolve(process.cwd(), 'dist', 'assets');
      if (!existsSync(source)) return;
      cpSync(source, target, { recursive: true });
    },
  };
}

/**
 * GitHub Pages can serve this project from a sub-path (`/<repo>/`) or from a
 * custom domain. The relative build base makes bundled assets path-independent;
 * SITE_URL is used for absolute canonical / Open Graph URLs and is filled by
 * the GitHub Actions workflow (or manually for another host).
 */
function injectSiteUrl() {
  const raw = process.env.SITE_URL || 'http://localhost:5173/';
  const siteUrl = `${raw.replace(/\/+$/, '')}/`;
  return {
    name: 'bloom-inject-site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl);
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [copyEditableAssets(), injectSiteUrl()],
  base: command === 'build' ? './' : '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'safari14',
    cssTarget: 'safari14',
    outDir: 'dist',
    assetsDir: 'build',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          swiper: ['swiper'],
          gsap: ['gsap'],
        },
      },
    },
  },
}));
