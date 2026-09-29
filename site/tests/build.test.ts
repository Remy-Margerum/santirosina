// The built site (run after `npm run build`): every page, the shop inert, the preview hidden from search, no inline
// script or style (a strict Content-Security-Policy later needs none).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { hasBuild, html, doc, feed } from './helpers';

const pages = (d = 'dist'): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? pages(p) : p.endsWith('.html') ? [p] : []; });

describe.skipIf(!hasBuild())('the built site', () => {
  it('builds the five pages Brooks asked for, the nine wines and the 404', () => {
    for (const r of ['/', '/wines/', '/wine-club/', '/about/', '/contact/']) expect(html(r)).toContain('<h1');
    for (const p of feed.products) expect(html(`/wines/${p.slug}/`)).toContain(p.name);
    expect(pages().length).toBe(15);
  });
  it('puts the approved headline on the home page', () => {
    expect(doc('/').querySelector('h1')!.textContent).toBe('Rooted in Italy. Grown in Santa Barbara.');
  });
  it('gives every wine page one h1, its price and a buy BUTTON that goes nowhere', () => {
    for (const p of feed.products) {
      const d = doc(`/wines/${p.slug}/`);
      expect(d.querySelectorAll('h1')).toHaveLength(1);
      expect(d.querySelector('.wine-price .price')!.textContent).toBe(`$${p.price / 100}`);
      const buy = d.querySelector('.wine-info [data-shop="buy"]')!;
      expect(buy.tagName).toBe('BUTTON');
      expect(buy.getAttribute('data-sku')).toBe(p.key);
    }
  });
  it('links nowhere a checkout would live', () => {
    for (const f of pages()) {
      const hrefs = [...readFileSync(f, 'utf8').matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(hrefs.filter((h) => /\/(cart|checkout|profile|product|collection)(\/|$)/.test(h)), f).toEqual([]);
    }
  });
  it('keeps the preview out of search: noindex on every page, robots.txt disallows all', () => {
    for (const f of pages()) expect(readFileSync(f, 'utf8'), f).toContain('name="robots" content="noindex');
    expect(readFileSync('dist/robots.txt', 'utf8')).toContain('Disallow: /');
  });
  it('carries no inline script and no style attribute', () => {
    for (const f of pages()) {
      const s = readFileSync(f, 'utf8');
      expect(s.match(/<script(?![^>]*\bsrc=)[^>]*>/g), f).toBeNull();
      expect(s.match(/\sstyle="/g), f).toBeNull();
    }
  });
  it('names every photograph for a screen reader', () => {
    for (const f of pages()) for (const m of readFileSync(f, 'utf8').matchAll(/<img\b[^>]*>/g)) expect(m[0], f).toMatch(/\balt(="|[\s>])/);
  });
});
