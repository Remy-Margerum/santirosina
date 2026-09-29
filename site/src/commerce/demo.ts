// The DEMO provider (2026-09-29): the catalog from src/data/site-feed.json (scripts/demo-feed.mjs), no commerce engine
// behind it. Its slots are hidden (`visible`); with SHOP_DEMO=1 each renders its button and a press says the shop is
// not open yet (shop-demo.js). No provider
// route exists, so there is no /cart/, /checkout/ or /profile/ page to reach. A Commerce7 provider (margerum-site's
// src/commerce/c7.ts + shop-c7.js) replaces this file when Santi Rosina has a tenant; no page changes.
import feedJson from '../data/site-feed.json';
import type { Provider, SiteFeed } from './provider';
const feed = feedJson as unknown as SiteFeed;
export const demo: Provider = {
  name: 'demo',
  live: false,
  // hidden (Remy, 2026-09-29: "just hide the add to cart buttons, login, and cart for now"); SHOP_DEMO=1 at build
  // brings back the inert buttons for a look at where the shop will sit
  visible: process.env.SHOP_DEMO === '1',
  routes: [],
  catalog: () => feed.products,
  groups: () => feed.groups,
  clubs: () => feed.clubs,
};
