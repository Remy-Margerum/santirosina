// The CMS contract: what the seed stores and what the templates read are what the schema declares, every section kind
// has its one component, and the words are the approved copy's (Brooks, 2026-09-11) — the copywriting guide's
// "Don't use" list never appears.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { types, routes } from '../src/cms/schema.mjs';
import { KIND_NAMES } from './kinds-list';
import { seed } from './helpers';

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

describe('the schema and the seed', () => {
  it('declares a type for every route and every seeded page', () => {
    for (const r of routes) expect(types[r.type], r.route).toBeTruthy();
    for (const [route, p] of Object.entries<any>(seed.pages)) {
      expect(routes.some((r) => r.route === route), route).toBe(true);
      expect(types[p.type], route).toBeTruthy();
    }
  });
  it('seeds only declared fields and section kinds', () => {
    for (const [route, p] of Object.entries<any>(seed.pages)) {
      const t = types[p.type];
      for (const k of Object.keys(p.fields)) expect(t.fields.some((f: any) => f.id === k), `${route}.${k}`).toBe(true);
      const blocksField = t.fields.find((f: any) => f.kind === 'blocks');
      for (const b of p.fields.blocks || []) {
        const ks = blocksField.kinds[b.kind];
        expect(ks, `${route}: ${b.kind}`).toBeTruthy();
        for (const k of Object.keys(b)) if (k !== 'kind' && k !== 'id') expect(ks.fields.some((f: any) => f.id === k), `${route} ${b.kind}.${k}`).toBe(true);
      }
    }
  });
  it('pairs every section kind the schema declares with one component', () => {
    const declared = new Set(Object.values<any>(types).flatMap((t) => (t.fields.find((f: any) => f.kind === 'blocks') ? Object.keys(t.fields.find((f: any) => f.kind === 'blocks').kinds) : [])));
    expect([...declared].sort()).toEqual([...KIND_NAMES].sort());
  });
  it('reads only declared fields in the templates', () => {
    const files = walk('src/pages').filter((f) => f.endsWith('.astro'));
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      const R = src.match(/const R = '([^']+)'/)?.[1];
      if (!R) continue;
      const type = types[routes.find((r) => r.route === R)!.type];
      for (const m of src.matchAll(/(?:field|html|link)\(R, '([a-z0-9-]+)'/g)) expect(type.fields.some((x: any) => x.id === m[1]), `${f}: ${m[1]}`).toBe(true);
    }
  });
});

describe('the words', () => {
  const home = seed.pages['/'].fields;
  it('carries the approved headline and subtext word for word', () => {
    expect(home.headline).toBe('Rooted in Italy. Grown in Santa Barbara.');
    expect(home.lede).toBe('Limited-production estate wines from Happy Canyon of Santa Barbara, inspired by generations of tradition.');
  });
  it('never uses a word the copywriting guide forbids', () => {
    const DONT = ['rare opportunity', 'truly exceptional', 'acquire', 'luxury wine landscape', 'vertical collections', 'unwavering commitment',
      'world-class', 'curated', 'bespoke', 'exclusive access', 'unparalleled', 'nestled'];
    const text = JSON.stringify(seed.pages).toLowerCase() + readFileSync('src/data/site-feed.json', 'utf8').toLowerCase();
    for (const w of DONT) expect(text.includes(w), w).toBe(false);
  });
  it('never names the owners (the guide: "Use the family")', () => {
    const text = JSON.stringify(seed.pages) + readFileSync('src/data/site-feed.json', 'utf8');
    expect(text).not.toMatch(/College Ranch|Embarcadero/);
  });
});
