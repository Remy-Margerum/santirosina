// Writes src/data/site-feed.json: the catalog the site is built from, in margerum-site's feed shape (docs/FEED.md
// there), for the DEMO provider — nine example wines, no commerce engine behind them (Remy, 2026-09-29: "a
// non-working, i.e. no checkout links work, with an example 9 SKUs live"). When Santi Rosina has a Commerce7 tenant,
// a feed-from-c7 script writes the same file from the live catalog and this script retires.
//
// Where each fact comes from:
//   key / mlot / group / vintage  Margerum's Product Master, program SAN (records CG-SAN-*; the "Z " private-label
//                                  prefix of their Full Wine Names dropped: it is Margerum's code, not the wine's name)
//   price                          "2026-05-13 Wholesale Price List - Santi Rosina" (Drive, SAN - Santi Rosina / Tech
//                                  Sheets): its third column, the bottle price at retail — EXAMPLE prices until the shop
//                                  is priced
//   lead                           "Santi Rosina Approved Copy" (Brooks, 2026-09-11): the collection's line per wine
//   notes / vineyard / winemaking  the tech sheets in the same folder (2025 Sauvignon Blanc, 2024 Sangiovese, 2024
//   blend / abv / ph / ta /        Nebbiolo, 2024 Cabernet Sauvignon revised 2026-08-14; the 2022 Nebbiolo sheet's
//   bottled / cases                notes). A wine with no tech sheet shows the approved line alone.
//   bottle shot                    Drive "Bottle Images" (SAN_*nv_1200.png: the front label, no vintage on it, so one
//                                  picture serves every vintage of the wine)
import { writeFileSync } from 'node:fs';

const APPELLATION = 'Happy Canyon of Santa Barbara';
// the approved copy's order: Sauvignon Blanc, Cabernet Sauvignon, Nebbiolo, Sangiovese
const WINES = {
  'sauvignon-blanc': { varietal: 'Sauvignon Blanc', wineType: 'White',
    lead: 'Vibrant and textured, balancing citrus, tropical fruit, minerality, and freshness with a style reminiscent of the great white wines of Bordeaux and Friuli.' },
  'cabernet-sauvignon': { varietal: 'Cabernet Sauvignon', wineType: 'Red',
    lead: 'Powerful yet refined, with layered dark fruit, graphite, and polished tannins that speak to the pedigree of the vineyard site.' },
  nebbiolo: { varietal: 'Nebbiolo', wineType: 'Red',
    lead: 'One of California’s rarest and most compelling expressions of the varietal, showing rose petals, wild strawberry, tar, and savory earth in a style inspired by the Langhe hills of Piedmont.' },
  sangiovese: { varietal: 'Sangiovese', wineType: 'Red',
    lead: 'Bright, energetic, and food-driven, offering notes of cherry, dried herbs, and Tuscan-like vibrancy with exceptional balance and age-worthiness.' },
};
const SKUS = [
  { key: '25ZSRSB', mlot: 'CG-SAN-25-SB', wine: 'sauvignon-blanc', vintage: 2025, price: 3000,
    blend: [['Sauvignon Blanc', 100]], abv: 13.2, ph: 3.2, ta: 6.9, bottled: '2026-04-27', cases: 34,
    notes: 'Ripe citrus, white peach, and guava open into subtle notes of lemongrass and fresh herbs. The palate is generous but balanced, with bright acidity, a smooth texture, and a clean, refreshing finish.',
    vineyard: 'Santa Ynez Vineyard, Block 24, Clone 1',
    winemaking: 'Picked 9/5/25 and taken direct to press, then cold settled and racked off the gross lees. Fermented cold in stainless steel (55–60°F) with a partial, natural malolactic fermentation. Barreled down 10/27/25 into 100% neutral French oak, then racked, sterile filtered, and bottled with high, natural dissolved CO2.' },
  { key: '23ZSRSB', mlot: 'CG-SAN-23-SB', wine: 'sauvignon-blanc', vintage: 2023, price: 3600 },
  { key: '24ZSRCS', mlot: 'CG-SAN-24-CS', wine: 'cabernet-sauvignon', vintage: 2024, price: 8000,
    blend: [['Cabernet Sauvignon', 100]], abv: 13.4, ph: 3.99, ta: 5.5, bottled: '2026-04-27', cases: 29,
    notes: 'Fresh blackberry and blackcurrant with graphite, tobacco leaf, and wild herbs. Medium-bodied and precise, the palate shows polished tannins, good acidity, and a cool, lingering finish.',
    vineyard: 'Santa Ynez Vineyard, Block 3, Clone 169',
    winemaking: 'Picked 10/9/24 and fermented in a 1.5-ton open-top bin with twice-daily punch downs (0% whole cluster). Drained and pressed 11/6/24, then barreled down 12/11/24 into 25% new French barriques for a natural, slow secondary fermentation.' },
  { key: '22ZSRCS', mlot: 'CG-SAN-22-CS', wine: 'cabernet-sauvignon', vintage: 2022, price: 9600 },
  { key: '21ZSRCS', mlot: 'CG-SAN-21-CS', wine: 'cabernet-sauvignon', vintage: 2021, price: 10400 },
  { key: '24ZSRN', mlot: 'CG-SAN-24-NEBB', wine: 'nebbiolo', vintage: 2024, price: 4000,
    blend: [['Nebbiolo', 95.5], ['Sangiovese', 4.5]], abv: 12.1, ph: 3.78, ta: 4.9, bottled: '2025-09-04', cases: 24,
    notes: 'Aromas of rose petals, wild strawberry, dried cherry, blood orange, and subtle alpine herbs lead to a supple, refined palate with fine tannins and vibrant acidity.',
    vineyard: 'Santa Ynez Vineyard: Nebbiolo from Block 5, Clone 11; Sangiovese from Block 10, Clone 19',
    winemaking: 'Picked 9/18/24 and fermented in a 1.5-ton open-top bin with twice-daily punch downs (0% whole cluster). Drained and pressed 10/5/24, then barreled down 10/20/24 into neutral French barriques for a natural, slow secondary fermentation.' },
  { key: '22ZSRN', mlot: 'CG-SAN-22-NEBB', wine: 'nebbiolo', vintage: 2022, price: 4800,
    notes: 'Inspired by the traditions of Langhe Nebbiolo, the wine is elegant, restrained, and beautifully balanced. Aromas of rose petals, wild strawberry, dried cherry, blood orange, and subtle alpine herbs lead to a supple, refined palate with fine tannins and vibrant acidity.' },
  { key: '24ZSRS', mlot: 'CG-SAN-24-SANGIO', wine: 'sangiovese', vintage: 2024, price: 4000,
    blend: [['Sangiovese', 95], ['Nebbiolo', 5]], abv: 12.8, ph: 3.7, ta: 5.1, bottled: '2025-09-03', cases: 27,
    notes: 'Sour cherry and red plum lead into dried rose, orange peel, and subtle savory herbs. The palate is refined and energetic, with fine-grained tannins, fresh acidity, and a persistent finish.',
    vineyard: 'Santa Ynez Vineyard: Sangiovese from Block 10, Clone 19; Nebbiolo from Block 5, Clone 11',
    winemaking: 'Picked 9/18/24 and fermented in a 1.5-ton open-top bin with twice-daily punch downs (0% whole cluster). Drained and pressed 10/5/24, then barreled down 10/20/24 into neutral French barriques for a natural, slow secondary fermentation.' },
  { key: '22ZSRS', mlot: 'CG-SAN-22-SANGIO', wine: 'sangiovese', vintage: 2022, price: 4800 },
];

const products = SKUS.map((s) => {
  const w = WINES[s.wine];
  const name = w.varietal;
  const displayName = `${s.vintage} ${name}`;
  return {
    key: s.key, mlot: s.mlot, slug: `${s.vintage}-${s.wine}`, name,
    fullName: `${s.vintage} Santi Rosina ${name}`, displayName,
    label: 'Santi Rosina', program: 'SAN', group: s.wine, groupName: name,
    vintage: s.vintage, varietal: name, wineType: w.wineType, appellation: APPELLATION,
    blend: (s.blend || []).map(([grape, pct]) => ({ grape, pct })),
    abv: s.abv ?? null, ph: s.ph ?? null, ta: s.ta ?? null, sizeMl: 750, pack: 12, case: null,
    sellable: true, inStock: true, price: s.price, comparePrice: null, examplePrice: true,
    images: [], art: { front: null, back: null, bottle: s.wine },
    copy: { lead: w.lead, notes: s.notes ?? null, vineyard: s.vineyard ?? null, winemaking: s.winemaking ?? null },
    facts: { bottled: s.bottled ?? null, cases: s.cases ?? null },
    seo: { title: `${displayName} · Santi Rosina`, description: `${displayName} from ${APPELLATION}. ${w.lead}` },
    collections: [], providerRef: { productId: '', variantId: '', slug: '', sku: s.key },
  };
});
const feed = {
  version: 0, generatedAt: '2026-09-29T00:00:00Z',
  provider: { name: 'demo', tenant: '', routes: {} },
  groups: Object.entries(WINES).map(([key, w]) => ({ key, name: w.varietal, wineType: w.wineType, lead: w.lead })),
  products, collections: [],
  clubs: [{ key: 'wine-club', title: 'Santi Rosina Wine Club', slug: 'wine-club', html: null, image: null, providerRef: { id: '', slug: '' } }],
  content: {}, redirects: [],
};
writeFileSync('src/data/site-feed.json', JSON.stringify(feed, null, 1) + '\n');
console.log(`site-feed.json: ${products.length} wines (demo provider)`);
