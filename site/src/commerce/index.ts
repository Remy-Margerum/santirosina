// The provider the site is built with: the feed names it. Today only the demo exists (src/commerce/demo.ts).
import { demo } from './demo';
import type { CatalogItem, Group, Provider } from './provider';
import { u } from '../lib/url';
export const provider: Provider = demo;

/** the wines in the approved copy's order (the feed's groups), each with its vintages newest first */
export function wineGroups(): (Group & { items: CatalogItem[] })[] {
  const all = provider.catalog();
  return provider.groups().map((g) => ({ ...g, items: all.filter((p) => p.group === g.key).sort((a, b) => (b.vintage ?? 0) - (a.vintage ?? 0)) }))
    .filter((g) => g.items.length);
}
export const bySlug = (slug: string) => provider.catalog().find((p) => p.slug === slug) ?? null;
export const byKey = (key: string) => provider.catalog().find((p) => p.key === key) ?? null;
/** the bottle shot's files (scripts/assets/build_assets.py): one canvas for every wine, so bottles stand alike */
export function bottleOf(p: CatalogItem) {
  const k = p.art.bottle;
  if (!k) return null;
  return { webp: [[310, u(`/art/bottles/${k}-620.webp`)], [620, u(`/art/bottles/${k}-1240.webp`)]] as [number, string][], png: u(`/art/bottles/${k}.png`), width: 400, height: 1240 };
}
/** "$40" — whole dollars show no cents */
export const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
/** "95.5% Nebbiolo, 4.5% Sangiovese" */
export const formatBlend = (b: { grape: string; pct: number }[]) => b.map((x) => `${x.pct % 1 ? x.pct : Math.round(x.pct)}% ${x.grape}`).join(', ');
