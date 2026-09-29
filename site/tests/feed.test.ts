// The demo catalog: the 2026 program's nine wines (Remy, 2026-09-29: "i also need these 9 wines to be the skus"), keyed
// in the Product Master's convention, unpriced, each with a bottle shot on disk where it has one.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { feed } from './helpers';

const approved = readFileSync('../docs/APPROVED-COPY.md', 'utf8').replace(/\s+/g, ' ');

describe('the demo catalog', () => {
  const products: any[] = feed.products;
  it('holds the nine wines of the 2026 program, in Remy\'s order, one provider: the demo', () => {
    expect(products.map((p) => p.name)).toEqual(['Chardonnay', 'Sauvignon Blanc', 'Rhône White Blend', 'Rhône Red Blend',
      'Cabernet Blend', 'Sangiovese', 'Barbera', 'Cabernet Franc', 'Estate Cabernet']);
    for (const p of products) expect(p.vintage).toBe(2026);
    expect(feed.provider.name).toBe('demo');
  });
  it('keys every wine in the Product Master\'s convention (mSKU + mLot Code), flagged as minted here', () => {
    expect(new Set(products.map((p) => p.key)).size).toBe(9);
    expect(new Set(products.map((p) => p.mlot)).size).toBe(9);
    for (const p of products) {
      expect(p.key).toMatch(/^26ZSR[A-Z]+$/);
      expect(p.mlot).toMatch(/^CG-SAN-26-[A-Z]+(-[A-Z]+)*$/);
      expect(p.exampleCodes).toBe(true);
    }
  });
  it('gives every wine a permanent slug of its own', () => {
    expect(new Set(products.map((p) => p.slug)).size).toBe(9);
    for (const p of products) expect(p.slug).toMatch(/^2026-[a-z]+(-[a-z]+)*$/);
  });
  it('carries no price and no planned case count: the program table\'s figures are costs and a plan, and prices are hidden', () => {
    for (const p of products) { expect(p.price).toBeNull(); expect(p.comparePrice).toBeNull(); expect(p.facts.cases).toBeNull(); }
    expect(JSON.stringify(feed)).not.toMatch(/\$\s?\d/);
  });
  it('puts only approved words on a wine: the collection\'s lines for Sauvignon Blanc, Sangiovese and the estate\'s Cabernet', () => {
    const withLead = products.filter((p) => p.copy.lead).map((p) => p.name);
    expect(withLead).toEqual(['Sauvignon Blanc', 'Sangiovese', 'Estate Cabernet']);
    for (const p of products) {
      if (p.copy.lead) expect(approved.toLowerCase()).toContain(p.copy.lead.toLowerCase().replace(/’/g, "'"));
      expect([p.copy.notes, p.copy.vineyard, p.copy.winemaking]).toEqual([null, null, null]);
    }
  });
  it('shows a bottle shot on disk for the three wines that have one, and no borrowed bottle for the others', () => {
    const shots = Object.fromEntries(products.map((p) => [p.name, p.art.bottle]));
    expect(shots).toMatchObject({ 'Sauvignon Blanc': 'sauvignon-blanc', Sangiovese: 'sangiovese', 'Estate Cabernet': 'cabernet-sauvignon' });
    expect(products.filter((p) => p.art.bottle)).toHaveLength(3);
    for (const p of products.filter((x) => x.art.bottle))
      for (const h of [620, 1240]) expect(existsSync(`public/art/bottles/${p.art.bottle}-${h}.webp`)).toBe(true);
  });
  it('publishes no lab figure or blend for a vintage with no tech sheet', () => {
    for (const p of products) { expect([p.abv, p.ph, p.ta]).toEqual([null, null, null]); expect(p.blend).toEqual([]); }
  });
});
