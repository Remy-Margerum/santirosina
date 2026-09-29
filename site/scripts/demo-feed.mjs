// Writes src/data/site-feed.json: the catalog the site is built from, in margerum-site's feed shape (docs/FEED.md
// there), for the DEMO provider — no commerce engine behind it (Remy, 2026-09-29: "a non-working, i.e. no checkout
// links work"). When Santi Rosina has a Commerce7 tenant, a feed-from-c7 script writes the same file from the live
// catalog and this script retires.
//
// THE NINE WINES are the 2026 program (Remy, 2026-09-29: "i also need these 9 wines to be the skus", with the program
// table: Chardonnay, Sauvignon Blanc, Rhône White Blend, Rhône Red Blend, Cabernet Blend, Sangiovese, Barbera,
// Cabernet Franc, Estate Cabernet), in his table's order and under his names. The vintage is 2026: the table is the
// 2026 custom crush program (Drive, SAN - Santi Rosina / Contract, "2026-07-29 Custom Crush Program Summary", and
// the 2026 harvest orders, program SAN, in Margerum's production page).
//
// Where each fact comes from:
//   key / mlot       MINTED HERE in the Product Master's convention (mSKU <YY>ZSR<stem>, mLot CG-SAN-<YY>-<stem>):
//                    the Product Master holds no 2026 SAN record yet. When Margerum creates them (Product Master →
//                    New product…), the records' own codes replace these. `exampleCodes` says so on every wine.
//   lead             "Santi Rosina Approved Copy" (Brooks, 2026-09-11): the collection's line for Sauvignon Blanc,
//                    Sangiovese and Cabernet Sauvignon (the Estate Cabernet is the estate's Cabernet Sauvignon). The
//                    other six have no approved words: they show their name and nothing invented.
//   bottle shot      Drive "Bottle Images" (SAN_*nv_1200.png: the front label, no vintage on it) for the same three;
//                    the others have no label yet and show the wordmark and their name (WineArt.astro).
//   price            NONE. The table's per-case figures are Margerum's program cost, not a price, and prices are
//                    hidden anyway (Remy, 2026-09-29: "also lets hide the price anyways"). The planned case counts
//                    are not published either: a plan, not a bottling.
// Tasting notes, lab figures and cellar notes come from a vintage's tech sheet; 2026 has none yet.
import { writeFileSync } from 'node:fs';

const VINTAGE = 2026;
const APPELLATION = 'Happy Canyon of Santa Barbara';
const LEAD = {
  'sauvignon-blanc': 'Vibrant and textured, balancing citrus, tropical fruit, minerality, and freshness with a style reminiscent of the great white wines of Bordeaux and Friuli.',
  sangiovese: 'Bright, energetic, and food-driven, offering notes of cherry, dried herbs, and Tuscan-like vibrancy with exceptional balance and age-worthiness.',
  'cabernet-sauvignon': 'Powerful yet refined, with layered dark fruit, graphite, and polished tannins that speak to the pedigree of the vineyard site.',
};
// Remy's table, in its order: [slug stem, name, wine type, mSKU stem, mLot stem, varietal (null = a blend), lead, bottle shot]
const WINES = [
  ['chardonnay', 'Chardonnay', 'White', 'CH', 'CH', 'Chardonnay', null, null],
  ['sauvignon-blanc', 'Sauvignon Blanc', 'White', 'SB', 'SB', 'Sauvignon Blanc', LEAD['sauvignon-blanc'], 'sauvignon-blanc'],
  ['rhone-white-blend', 'Rhône White Blend', 'White', 'RW', 'RHONE-WHITE', null, null, null],
  ['rhone-red-blend', 'Rhône Red Blend', 'Red', 'RR', 'RHONE-RED', null, null, null],
  ['cabernet-blend', 'Cabernet Blend', 'Red', 'CB', 'CS-BLEND', null, null, null],
  ['sangiovese', 'Sangiovese', 'Red', 'S', 'SANGIO', 'Sangiovese', LEAD.sangiovese, 'sangiovese'],
  ['barbera', 'Barbera', 'Red', 'BAR', 'BARBERA', 'Barbera', null, null],
  ['cabernet-franc', 'Cabernet Franc', 'Red', 'CF', 'CF', 'Cabernet Franc', null, null],
  ['estate-cabernet', 'Estate Cabernet', 'Red', 'CS', 'CS', 'Cabernet Sauvignon', LEAD['cabernet-sauvignon'], 'cabernet-sauvignon'],
];

const yy = String(VINTAGE).slice(2);
const products = WINES.map(([stem, name, wineType, skuStem, lotStem, varietal, lead, bottle]) => {
  const displayName = `${VINTAGE} ${name}`;
  const key = `${yy}ZSR${skuStem}`;
  return {
    key, mlot: `CG-SAN-${yy}-${lotStem}`, slug: `${VINTAGE}-${stem}`, name,
    fullName: `${VINTAGE} Santi Rosina ${name}`, displayName,
    label: 'Santi Rosina', program: 'SAN', group: stem, groupName: name,
    vintage: VINTAGE, varietal, wineType, appellation: APPELLATION,
    blend: [], abv: null, ph: null, ta: null, sizeMl: 750, pack: 12, case: null,
    sellable: true, inStock: true, price: null, comparePrice: null, exampleCodes: true,
    images: [], art: { front: null, back: null, bottle },
    copy: { lead, notes: null, vineyard: null, winemaking: null },
    facts: { bottled: null, cases: null },
    seo: { title: `${displayName} · Santi Rosina`, description: [`${displayName} from ${APPELLATION}.`, lead].filter(Boolean).join(' ') },
    collections: [], providerRef: { productId: '', variantId: '', slug: '', sku: key },
  };
});
const feed = {
  version: 0, generatedAt: '2026-09-29T00:00:00Z',
  provider: { name: 'demo', tenant: '', routes: {} },
  groups: products.map((p) => ({ key: p.group, name: p.name, wineType: p.wineType, lead: p.copy.lead })),
  products, collections: [],
  clubs: [{ key: 'wine-club', title: 'Santi Rosina Wine Club', slug: 'wine-club', html: null, image: null, providerRef: { id: '', slug: '' } }],
  content: {}, redirects: [],
};
writeFileSync('src/data/site-feed.json', JSON.stringify(feed, null, 1) + '\n');
console.log(`site-feed.json: ${products.length} wines, ${VINTAGE} (demo provider)`);
