// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, SITE_BASE, PREVIEW } from './src/site.mjs';

// The public storefront for Santi Rosina, on margerum-site's structure: a static build, every indexable page complete
// HTML, JS opt-in per component. The host and the base path are ONE switch (src/site.mjs): the GitHub Pages preview
// builds under /santirosina/, the real site at the domain's root.
export default defineConfig({
  site: SITE_URL,
  base: SITE_BASE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // scripts and assets as hashed files (a strict CSP later needs no script hashes); a page's own tiny CSS may inline
  vite: { build: { assetsInlineLimit: (file, content) => /^_astro\/[^/]+\.css$/.test(file) && content.length < 1024 } },
  // the preview is noindex and never lists itself for search engines
  integrations: PREVIEW ? [] : [sitemap()],
});
