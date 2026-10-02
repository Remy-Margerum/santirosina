# Santi Rosina — santirosina.com

The website of Santi Rosina (Happy Canyon of Santa Barbara), built on **margerum-site's structure**: an Astro static
build, the words and pictures in a CMS-shaped content file, the wines in a product feed keyed by the Product Master,
and every commerce surface behind ONE provider boundary. Today the provider is a **demo**: the 2026 program's nine
wines (Remy's table: Chardonnay, Sauvignon Blanc, Rhône White Blend, Rhône Red Blend, Cabernet Blend, Sangiovese,
Barbera, Cabernet Franc, Estate Cabernet), no checkout — and the shop is HIDDEN (Remy, 2026-09-29: "just hide the add to
cart buttons, login, and cart for now", "also lets hide the price anyways"): no price and no Add to cart, cart, Log in
or Join button is drawn. `SHOP_DEMO=1` at build draws the buttons again as inert ones that say the shop is not open yet.

**Status (2026-09-29): a non-working preview for review.** Copy and pictures are the approved set Brooks sent; see
`docs/APPROVED-COPY.md` for what is approved and what still needs Kathryn Paul's sign-off.

## Layout

```
site/                       the storefront (Astro)
  src/cms/schema.mjs        page types + routes: what the site can render (the CMS contract, margerum-site's vocabulary)
  src/data/content.seed.json  the pages' words and pictures, in the CMS's content shape (the approved copy)
  src/data/site-feed.json   the catalog: the 2026 program's 9 wines, unpriced (scripts/demo-feed.mjs writes it)
  src/data/media.json       the photographs: sizes, alt text, renditions, focal points
  src/cms/                  the readers every template goes through; rich.mjs = the CMS's Markdown renderer
  src/commerce/             the ONLY code that knows a commerce engine: provider.ts, demo.ts, ShopSlot.astro
  src/components/blocks/    one component per section kind
  src/pages/                /, /wines/, /wines/<slug>/, /wine-club/, /about/ + /team/ + /contact/ ([...standard]), 404
  scripts/seed-content.mjs  content.seed.json → content.json (runs before every build)
  scripts/demo-feed.mjs     the nine wines → site-feed.json
  scripts/assets/build_assets.py  one-off: photographs, bottle shots, logo from the sources (output committed)
  scripts/page-check.mjs    Chromium at 390 and 1400: overflow, images, the shop inert, screenshots
  tests/                    vitest: the schema contract, the feed, the built site
brand/                      the label designers' logo and type guide; archive/ = the superseded first draft
docs/                       the approved copy, the copy rules, where every asset came from
.github/workflows/deploy.yml  main → GitHub Pages (the preview)
```

## Working on it

```
cd site
npm install
npm run build            # seeds content.json, builds dist/ (SITE_BASE=/santirosina/ for the Pages path)
npx vitest run           # after a build: the contract, the feed, the built pages
node scripts/page-check.mjs --shots /tmp/shots   # Chromium (PLAYWRIGHT: /opt/pw-browsers/chromium)
npm run dev              # local preview
```

- **Copy** is an edit to `site/src/data/content.seed.json` (Markdown in rich fields; a field the schema does not declare
  is refused). Only approved copy; add anything new to its `unapproved` list.
- **A wine** is an edit to `site/scripts/demo-feed.mjs`, then `npm run feed`.
- **Photos**: rerun `scripts/assets/build_assets.py` with the sources (see its header), or add to `media.json` by hand.

## Hosting

`main` deploys to GitHub Pages, and the workflow reads WHERE from Pages itself (`configure-pages`):
- no custom domain → **https://remy-margerum.github.io/santirosina/**, built under /santirosina/, a preview (noindex,
  the preview bar);
- custom domain `www.santirosina.com` set in the repo's Settings → Pages → built at /, indexable, a sitemap, no bar.
  This replaces Cloudflare's "Coming Soon" page once the DNS points at GitHub (the steps: CLAUDE.md log, 2026-09-29).
The production path (margerum-site's): nginx on Cloud Run behind Cloudflare, built by a job the CMS's Publish starts;
that arrives with Santi Rosina's dashboards (the next phase).
