// The ONE switch for where the site lives (margerum-site's src/site.mjs): canonicals, og:url, robots.txt and every
// internal link read it. Plain ESM so astro.config.mjs, the scripts and the tests can import it.
//   SITE_URL   the canonical origin (the real domain even on a preview: canonicals point at the site to be)
//   SITE_BASE  the path the build is served under: '/' on the domain, '/santirosina/' on the GitHub Pages preview
//   PREVIEW    '1' = a preview build: noindex everywhere, robots.txt disallows all, the preview bar shows
export const SITE_URL = (process.env.SITE_URL || 'https://www.santirosina.com').replace(/\/+$/, '');
export const SITE_BASE = ((process.env.SITE_BASE || '/').replace(/\/*$/, '/')).replace(/^([^/])/, '/$1');
export const PREVIEW = process.env.PREVIEW !== '0';   // on unless a production build says otherwise (the shop is not open)
