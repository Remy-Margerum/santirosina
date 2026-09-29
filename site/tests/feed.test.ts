// The demo catalog: nine example wines keyed by Margerum's Product Master (program SAN), priced from the client's
// May 2026 wholesale price list, each with its bottle shot on disk.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { feed } from './helpers';

describe('the demo catalog', () => {
  const products: any[] = feed.products;
  it('holds nine wines, one provider: the demo', () => {
    expect(products).toHaveLength(9);
    expect(feed.provider.name).toBe('demo');
  });
  it('keys every wine by its Product Master record (mSKU + mLot Code)', () => {
    expect(new Set(products.map((p) => p.key)).size).toBe(9);
    for (const p of products) {
      expect(p.key).toMatch(/^\d{2}ZSR[A-Z]+$/);
      expect(p.mlot).toMatch(/^CG-SAN-\d{2}-[A-Z]+$/);
      expect(p.key.slice(0, 2)).toBe(String(p.vintage).slice(2));
    }
  });
  it('gives every wine a permanent slug of its own', () => {
    expect(new Set(products.map((p) => p.slug)).size).toBe(9);
    for (const p of products) expect(p.slug).toMatch(/^\d{4}-[a-z]+(-[a-z]+)*$/);
  });
  it('prices in whole cents, marked as examples', () => {
    for (const p of products) { expect(Number.isInteger(p.price)).toBe(true); expect(p.price).toBeGreaterThan(0); expect(p.examplePrice).toBe(true); }
  });
  it('puts every wine in one of the four wines of the approved copy, in its order', () => {
    expect(feed.groups.map((g: any) => g.name)).toEqual(['Sauvignon Blanc', 'Cabernet Sauvignon', 'Nebbiolo', 'Sangiovese']);
    for (const p of products) expect(feed.groups.some((g: any) => g.key === p.group)).toBe(true);
  });
  it('has a bottle shot on disk for every wine', () => {
    for (const p of products) for (const h of [620, 1240]) expect(existsSync(`public/art/bottles/${p.art.bottle}-${h}.webp`)).toBe(true);
  });
  it('never publishes a lab figure the lab could not have measured', () => {
    for (const p of products) {
      if (p.abv != null) expect(p.abv).toBeGreaterThan(8);
      if (p.ph != null) expect(p.ph).toBeGreaterThan(2.5);
      if (p.ta != null) expect(p.ta).toBeGreaterThan(0);
      const sum = p.blend.reduce((a: number, b: any) => a + b.pct, 0);
      if (p.blend.length) expect(Math.round(sum * 10) / 10).toBe(100);
    }
  });
});
