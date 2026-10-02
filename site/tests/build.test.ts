// The built site (run after `npm run build`): every page, the shop inert, the preview hidden from search, no inline
// script or style (a strict Content-Security-Policy later needs none).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { hasBuild, html, doc, feed } from './helpers';
import { PREVIEW } from '../src/site.mjs';
const SHOWN = process.env.SHOP_DEMO === '1';

const pages = (d = 'dist'): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? pages(p) : p.endsWith('.html') ? [p] : []; });

describe.skipIf(!hasBuild())('the built site', () => {
  it('builds the five pages Brooks asked for, Our Team, the nine wines and the 404', () => {
    for (const r of ['/', '/wines/', '/wine-club/', '/about/', '/team/', '/contact/']) expect(html(r)).toContain('<h1');
    for (const p of feed.products) expect(html(`/wines/${p.slug}/`)).toContain(p.name);
    expect(pages().length).toBe(16);
  });
  it('puts the approved headline on the home page', () => {
    expect(doc('/').querySelector('h1')!.textContent).toBe('Rooted in Italy. Grown in Santa Barbara.');
  });
  it('gives every wine page one h1 naming its vintage and wine; the shop\'s buttons only when the shop is shown (SHOP_DEMO=1)', () => {
    for (const p of feed.products) {
      const d = doc(`/wines/${p.slug}/`);
      expect(d.querySelectorAll('h1')).toHaveLength(1);
      expect(d.querySelector('h1')!.textContent).toBe(`${p.vintage}${p.name}`);
      const buy = d.querySelector('.wine-info [data-shop="buy"]');
      if (SHOWN) { expect(buy!.tagName).toBe('BUTTON'); expect(buy!.getAttribute('data-sku')).toBe(p.key); }
      else expect(buy).toBeNull();
    }
  });
  it('shows no price anywhere (Remy, 2026-09-29: "also lets hide the price anyways")', () => {
    for (const f of pages()) {
      const t = readFileSync(f, 'utf8');
      expect(t, f).not.toMatch(/class="price"/);
      expect(t.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' '), f).not.toMatch(/\$\s?\d/);
    }
  });
  it('draws a wine with no bottle shot as the wordmark and its name, never another wine\'s bottle', () => {
    for (const p of feed.products) {
      const d = doc(`/wines/${p.slug}/`);
      const img = d.querySelector('.wine-art img');
      if (p.art.bottle) expect(img!.getAttribute('src')).toContain(`/art/bottles/${p.art.bottle}.png`);
      else { expect(img).toBeNull(); expect(d.querySelector('.wine-art .art-mark__name')!.textContent).toBe(p.name); }
    }
    expect(doc('/').querySelectorAll('.collection .wine-card')).toHaveLength(9);
    expect([...doc('/wines/').querySelectorAll('.catalog-group h2')].map((h) => h.textContent)).toEqual(['White Wines', 'Red Wines']);
  });
  it('hides every shop slot while the shop is hidden (Remy, 2026-09-29: "just hide the add to cart buttons, login, and cart")', () => {
    if (SHOWN) return;
    for (const f of pages()) expect(readFileSync(f, 'utf8'), f).not.toMatch(/data-shop=|Add to cart|Log in|nav-cart/);
  });
  it('splits the menu round the wordmark: The Wines and Wine Club left, Our Story, Our Team and Contact Us right (Remy, 2026-09-29 and 10-02)', () => {
    const d = doc('/');
    const names = (sel: string) => [...d.querySelectorAll(sel)].map((a) => a.textContent!.trim());
    expect(names('.primary-nav li:not(.nav-r) a')).toEqual(['The Wines', 'Wine Club']);
    expect(names('.right-nav a')).toEqual(['Our Story', 'Our Team', 'Contact Us']);
    // the phone's drop-down lists all five; the desktop hides its right half (CSS), so each is exposed once
    expect(names('.primary-nav a')).toEqual(['The Wines', 'Wine Club', 'Our Story', 'Our Team', 'Contact Us']);
    expect(names('.footer-nav a')).not.toContain('Shop');
    expect(names('.footer-nav a')).toContain('Our Team');
  });
  it('shows the team, each with an anchor, a title and the bio in paragraphs, then the vineyard crew (Remy, 2026-10-02)', () => {
    const d = doc('/team/');
    expect(d.querySelector('h1')!.textContent).toBe('Our Team');
    const people = [...d.querySelectorAll('.person')].map((p) => ({
      id: p.id, name: p.querySelector('.person-name')!.textContent, role: p.querySelector('.person-role')!.textContent,
      paras: p.querySelectorAll('.person-bio p').length }));
    expect(people).toEqual([
      { id: 'doug-margerum', name: 'Doug Margerum', role: 'Director of Winemaking', paras: 4 },
      { id: 'robert-daugherty', name: 'Robert Daugherty', role: 'Head Winemaker', paras: 2 },
      { id: 'ben-merz', name: 'Ben Merz', role: 'Co-Owner, Coastal Vineyard Care Associates', paras: 3 },
      { id: 'juve-buenrostro', name: 'Juve Buenrostro', role: 'Vineyard Manager', paras: 1 },
    ]);
    expect(d.querySelector('.person-bio em')!.textContent).toBe('Wine Spectator');
    const crew = d.querySelector('.band')!;
    expect(crew.querySelector('h2')!.textContent).toBe('Vineyard Team');
    expect(crew.querySelector('.band-media')!.classList.contains('whole')).toBe(true);   // the group photo uncropped
  });
  it('shows every photograph once across the whole site (Remy, 2026-10-02: "several duplicates of photos we need to remove")', () => {
    const seen = new Map<string, string>();
    for (const f of pages()) {
      const d = new JSDOM(readFileSync(f, 'utf8')).window.document;
      for (const img of d.querySelectorAll('img')) {
        const id = (img.getAttribute('src') || '').match(/\/media\/(m-[0-9a-f]{8})\./)?.[1];
        if (!id) continue;
        expect(seen.get(id), `${id} on ${f} and ${seen.get(id)}`).toBeUndefined();
        seen.set(id, f);
      }
    }
    expect(seen.size).toBeGreaterThan(15);
  });
  it('links nowhere a checkout would live', () => {
    for (const f of pages()) {
      const hrefs = [...readFileSync(f, 'utf8').matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(hrefs.filter((h) => /\/(cart|checkout|profile|product|collection)(\/|$)/.test(h)), f).toEqual([]);
    }
  });
  it('keeps a preview out of search (noindex, robots.txt disallows all); the domain build is indexable with a canonical', () => {
    for (const f of pages().filter((f) => !f.endsWith('404.html'))) {
      const s = readFileSync(f, 'utf8');
      if (PREVIEW) expect(s, f).toContain('name="robots" content="noindex');
      else { expect(s, f).not.toContain('noindex'); expect(s, f).toContain('rel="canonical"'); }
    }
    expect(readFileSync('dist/robots.txt', 'utf8')).toContain(PREVIEW ? 'Disallow: /' : 'Sitemap:');
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
