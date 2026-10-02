// The ONE way a template reads CMS content (margerum-site's src/cms/index.ts): src/data/content.json, written by
// scripts/seed-content.mjs from the committed seed today and by a pull from Santi Rosina's Web Pages editor once it
// exists — the same shape either way. Templates never touch the JSON directly; tests/content.test.ts checks the field
// ids they ask for against src/cms/schema.mjs.
import { readFileSync, existsSync } from 'node:fs';
import { types, routes } from './schema.mjs';
import { blocksOf, type Block } from './blocks.mjs';
import { u, withBase } from '../lib/url';

export interface MediaRef { id: string; alt?: string }
export interface Media { src: string; width: number | null; height: number | null; alt: string; credit?: string; type: string; name?: string; renditions?: Record<string, [number, string][]>; focus?: number }
export interface Page { type: string; version?: number; publishedAt?: string; fields: Record<string, any>; rendered?: Record<string, any>; seo: { title?: string; description?: string; ogImage?: string; noindex?: boolean } }
interface ContentFile { schemaVersion: string; side: string; pulledAt?: string; pages: Record<string, Page>; media: Record<string, Media> }

const readJson = <T>(p: string, dflt: T): T => (existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : dflt);
const data: ContentFile = readJson('src/data/content.json', { schemaVersion: '', side: 'none', pages: {}, media: {} });

export const contentSide = () => data.side;
/** the page's content, or null when nothing is published (the template shows placeholders or is not built) */
export const page = (route: string): Page | null => data.pages[route] ?? null;
export const hasContent = (route: string) => !!data.pages[route];
/** a plain field with a fallback */
export function field<T = any>(route: string, id: string, fallback: T): T {
  const v = page(route)?.fields?.[id];
  return v === undefined || v === null || v === '' ? fallback : (v as T);
}
/** a rich field as HTML (the CMS's one renderer), links kept inside the site's base */
export function html(route: string, id: string, fallback = ''): string {
  const v = page(route)?.rendered?.[id];
  return withBase(typeof v === 'string' && v ? v : fallback);
}
/** a media reference resolved to its file (render a photo through src/components/CmsImage.astro) */
export function image(ref: MediaRef | string | null | undefined, fallbackAlt = ''): (Media & { alt: string }) | null {
  if (!ref) return null;
  const id = typeof ref === 'string' ? ref : ref.id;
  const m = data.media[id];
  if (!m) return null;
  const renditions = m.renditions && Object.fromEntries(Object.entries(m.renditions).map(([t, l]) => [t, l.map(([w, s]) => [w, u(s)] as [number, string])]));
  return { ...m, src: u(m.src), renditions, alt: (typeof ref === 'object' && ref.alt) || m.alt || fallbackAlt };
}
export const images = (refs: (MediaRef | string)[] | undefined) => (refs || []).map((r) => image(r)).filter(Boolean) as (Media & { alt: string })[];
/** a srcset attribute from a rendition ladder */
export const srcset = (list: [number, string][]) => list.map(([w, url]) => `${url} ${w}w`).join(', ');
/** a link value as { label, href } with the href inside the base; null when empty */
export function linkOf(v: any): { label: string; href: string } | null {
  return v && typeof v === 'object' && typeof v.href === 'string' && v.href.trim() ? { label: String(v.label || v.href), href: u(v.href.trim()) } : null;
}
export const link = (route: string, id: string) => linkOf(field<any>(route, id, null));
/** the SEO block, falling back per field */
export function seo(route: string, dflt: { title: string; description?: string }) {
  const s = page(route)?.seo || {};
  const og = s.ogImage ? image(s.ogImage) : null;
  return { title: s.title || dflt.title, description: s.description || dflt.description, image: og ? og.src : null, noindex: !!s.noindex };
}
/** the page's sections in order (src/cms/blocks.mjs is the rule), rich fields' links inside the base */
export function blocks(route: string): Block[] {
  const p = page(route);
  const type = p?.type ?? routes.find((r) => r.route === route)?.type ?? '';
  return blocksOf(type, route, p?.fields ?? {}, p?.rendered ?? {}).map((b) => ({
    ...b, rendered: Object.fromEntries(Object.entries(b.rendered).map(([k, v]) => [k, typeof v === 'string' && /<[a-z]/.test(v) ? withBase(v) : v])),
  }));
}
/** the routes with a static template of their own — [...standard].astro never builds these */
const STATIC = new Set(['/', '/wines/', '/wine-club/']);
/** the content pages that have content: standard, team and legal routes without a static template */
export const contentPages = () => routes.filter((r) => ['standard', 'team', 'legal'].includes(r.type) && !STATIC.has(r.route) && hasContent(r.route));
/** a route the build produces */
export const isBuilt = (r: { route: string; type: string }) => !r.route.includes('*') && (STATIC.has(r.route) || hasContent(r.route));
/** the header's links: the routes marked `menu`, built ones only, in route order */
export const navLinks = () => routes.filter((r) => r.menu && isBuilt(r)).map((r) => ({ title: r.title, href: u(r.route), route: r.route, side: r.menu === 'right' ? 'right' : 'left' }));
/** the footer's groups: every built route with a footer group */
export function footerGroups() {
  const groups = new Map<string, { href: string; title: string }[]>();
  for (const r of routes) {
    if (!r.footer || !isBuilt(r)) continue;
    if (!groups.has(r.footer)) groups.set(r.footer, []);
    groups.get(r.footer)!.push({ href: u(r.route), title: r.title });
  }
  return [...groups.entries()].map(([name, links]) => ({ name, links }));
}
export const routeTitle = (route: string) => routes.find((r) => r.route === route)?.title ?? route;
export const fieldIds = (type: string) => (types as any)[type]?.fields.map((f: any) => f.id) ?? [];
/** the brand facts every page needs (the style guide's identity block once the CMS carries one) */
export const brand = () => ({
  siteName: 'Santi Rosina',
  tagline: 'Happy Canyon of Santa Barbara',
  // PLACEHOLDER: no Santi Rosina mailbox is confirmed yet (the approved copy names none)
  email: 'hello@santirosina.com',
});
