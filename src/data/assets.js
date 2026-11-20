/**
 * Resolve a file in `assets/` against Vite's configured public base.
 *
 * GitHub Pages project sites live under `/<repo>/`; Vite's relative build base
 * keeps the same URLs working at the domain root, under a sub-path, or behind
 * a custom domain.
 */
export const assetUrl = (path) => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${String(path).replace(/^\/+/, '')}`;
};
