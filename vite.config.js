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

export default defineConfig({
  plugins: [copyEditableAssets()],
  base: '/',
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
});
