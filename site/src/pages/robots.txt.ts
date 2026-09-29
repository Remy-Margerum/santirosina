import type { APIRoute } from 'astro';
import { SITE_URL, PREVIEW } from '../site.mjs';
// a preview is never crawled; the real site lists its sitemap
export const GET: APIRoute = () => new Response(PREVIEW
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
