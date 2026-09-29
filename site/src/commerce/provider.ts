// Provider-neutral records the site is built from (margerum-site's src/commerce/provider.ts). Nothing outside
// src/commerce/ imports anything but this file, index.ts and the components that render slots: a page never knows
// which commerce engine sells the wine. Keys are the Product Master's identifiers (mSKU, mLot Code), never a provider id.
export interface BlendPart { grape: string; pct: number }

export interface CatalogItem {
  key: string;            // mSKU (Product Master) — the join to everything we know
  mlot: string | null;    // mLot Code (Product Master)
  slug: string;           // OUR permanent slug: /wines/<slug>/
  name: string;           // the wine: "Nebbiolo"
  fullName: string;       // "2024 Santi Rosina Nebbiolo"
  displayName: string;    // what a customer reads: "2024 Nebbiolo"
  label: string;
  program: string | null;
  group: string;          // the wine across vintages: "nebbiolo"
  groupName: string;
  vintage: number | null;
  varietal: string | null;
  wineType: string | null;
  appellation: string | null;
  blend: BlendPart[];     // largest first; [] = not published
  abv: number | null; ph: number | null; ta: number | null;
  sizeMl: number | null; pack: number | null;
  case: { count: number | null; sizeMl: number | null } | null;
  sellable: boolean;
  inStock: boolean;
  price: number | null;   // integer cents; null = not priced (the demo's 2026 wines have none)
  comparePrice: number | null;
  exampleCodes?: boolean; // key / mlot minted in the Product Master's convention before the Product Master has the record
  images: { src: string; width: number | null; height: number | null }[];
  art: { front: string | null; back: string | null; bottle: string | null };   // bottle = the key of our bottle shot
  copy: { lead: string | null; notes: string | null; vineyard: string | null; winemaking: string | null };
  facts: { bottled: string | null; cases: number | null };
  seo: { title: string | null; description: string | null };
  collections: string[];
  providerRef: { productId: string; variantId: string; slug: string; sku: string };
}
export interface Group { key: string; name: string; wineType: string; lead: string | null }
export interface Club { key: string; title: string; slug: string; html: string | null; image: string | null; providerRef: { id: string; slug: string } }
export interface ProviderRoute { key: string; prefix: string; shell: 'content'; index: boolean; bare: boolean; canonical?: string }

export interface SiteFeed {
  version: 0;
  generatedAt: string;
  provider: { name: string; tenant: string; routes: Record<string, string> };
  groups: Group[];
  products: CatalogItem[];
  collections: unknown[];
  clubs: Club[];
  content: Record<string, unknown>;
  redirects: { from: string; to: string; status: 301 | 302 }[];
}

export interface Provider {
  name: string;
  /** false = nothing can be bought: every slot renders its button and says the shop is not open */
  live: boolean;
  /** false = no shop slot renders at all (no Add to cart, Log in, cart or Join button) and no price is shown: the site
   *  reads as a brochure */
  visible: boolean;
  routes: ProviderRoute[];
  catalog(): CatalogItem[];
  groups(): Group[];
  clubs(): Club[];
}
