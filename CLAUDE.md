# santirosina — project conventions

The website of Santi Rosina (santirosina.com), built on margerum-site's structure, and — next — Santi Rosina's own
dashboards (Web Pages CMS, Product Master, Content Master). README.md is the brief. `docs/` holds the approved copy,
the copy rules and where every asset came from. The two repos this one learns from are only READ, never changed:
`margerum-site` (the storefront pattern) and `Margerum` (the dashboards).

## Non-negotiables
- **Words**: only the approved copy (`docs/APPROVED-COPY.md`) without Kathryn Paul's written approval; anything else is
  listed in `site/src/data/content.seed.json` → `unapproved`. The copy guide's *Don't use* list never appears
  (tests/content.test.ts). Never name the owners; never publish the estate's or the business's address.
- `site/src/commerce/` is the ONLY code that knows a commerce engine. Pages use `ShopSlot`; the demo provider takes
  no orders by design (Remy, 2026-09-29: "a non-working, i.e. no checkout links work").
- Every internal URL goes through `u()` / `withBase()` (`site/src/lib/url.ts`): the preview lives under /santirosina/.
- No inline script, no `style=` attribute (a strict CSP later needs none; tests/build.test.ts).
- The label's look: one serif (Bembo; Cardo stands in), titles in open-spaced capitals, the label's ink #231F20, the
  client's photo-shoot palette. The watercolour rose only on light grounds.
- Secrets never enter the repo. No model identifiers in commits, code or docs.

## People
Remy Margerum (decisions); Brooks Van Wingerden (Margerum's GM, runs the Santi Rosina launch); Kathryn Paul (approves
Santi Rosina's copy); Evan Backes and Tom Adler (label designers); Jully Manalaysay (he/him). Use they/them for anyone
whose pronouns are not recorded here.

## Working here
1. `cd site && npm install && npm run build && npx vitest run`.
2. Verify in Chromium before saying it works: `node scripts/page-check.mjs` (390 with touch AND 1400; it fails on
   sideways scroll, a broken image, a shop button that navigates). Look at the screenshots.
3. For the Pages path: `SITE_BASE=/santirosina/ npm run build` and the same check with `SITE_BASE` set.
4. Log it below: a dated bullet with what Remy asked (quoted), what changed, how it was verified, what is left.

## Log
- 2026-08-17 — First hand-built placeholder site (GitHub Pages) and a self-made style guide (Bodoni + Jost, an SR
  roundel, Unsplash photographs). Superseded 2026-09-29; the guide is kept in `brand/archive/`.
- 2026-09-29 — **The storefront on margerum-site's structure, non-working** (Remy: "a new site for Santi Rosina, using
  the margerum-site concept and structure", then "a non-working, i.e. no checkout links work with an example 9 SKUs live
  and use the approved copy and images that brooks sent me … then check in", and "use the google drive to see if there
  are other santi-rosina labels and bottles"). Astro in `site/`: the schema (home, listing, club, standard, legal,
  product; sections from the start), the CMS's own Markdown renderer vendored, the readers, one component per section
  kind, the demo provider (buttons that say the shop is not open; no cart / checkout / account route exists), nine
  wines keyed by Margerum's Product Master SAN records (2025 + 2023 Sauvignon Blanc, 2024 / 2022 / 2021 Cabernet
  Sauvignon, 2024 + 2022 Nebbiolo, 2024 + 2022 Sangiovese) priced from the May 2026 wholesale list (examples), notes and
  figures from the client's tech sheets. Brand: the designers' 2026 logo (stacked, rose beneath) drawn from their
  vector outlines; the rose lifted off its white (the PDF's soft mask was solid); the photo-shoot palette; Cardo for
  Bembo. Pictures: 21 of Brooks's 326 (Dropbox), the client's standardized bottle shots from Drive. Verified: 21 tests,
  the Chromium check at 390 and 1400 at the root AND under /santirosina/. Hard-won: a global `body.site img
  {height:auto}` outranks a plain `.page-banner img {height:100%}` — every banner showed the top of its photo; a
  `<picture>` set to `display: contents` must hide its `<source>`s or a grid gains empty cells (margerum-site knew
  both). Chromium in a session needs the proxy's CA as a `CACertificates` policy in /etc/chromium/policies/managed
  (TLS stays verified). The client folder on the Box-migration shared drive is readable by the session's service
  account (Drive API, drive.readonly scope, signed in Node — the system Python's `cryptography` is broken).
- 2026-09-29 (later) — **Live** (Remy: "please merge to main id like to see it live"): main fast-forwarded to the branch,
  the Pages workflow built, tested (21) and deployed it: https://remy-margerum.github.io/santirosina/ (noindex, the
  preview bar). Checked on the live URL in Chromium at 1400 and 390: all 14 pages 200, every picture and the font
  loaded, no sideways scroll, Add to cart shows the note and stays. santirosina.com (Cloudflare's Coming Soon page) is
  untouched. Left to Remy: the check-in's questions (web prices, copy for Kathryn, the real email address, the Bembo
  licence, publishing case counts and lab figures), then the dashboards phase and its config.
- 2026-09-29 (later) — **Shop hidden; ready to replace Coming Soon** (Remy: "just hide the add to cart buttons, login,
  and cart for now, i also do want to replace the coming soon page"). The demo provider carries `visible`
  (`SHOP_DEMO=1` only): ShopSlot draws nothing for cart / account / buy / club-join (so the club page's Join button
  went too) and ShopLoader loads no shop script; tests and page-check follow the flag. `deploy.yml` runs
  configure-pages FIRST and builds from its outputs: no custom domain → /santirosina/ + PREVIEW; a custom domain → /,
  SITE_URL = its origin, PREVIEW=0 (indexable, sitemap, no bar). Verified: 22 tests + the Chromium check hidden at the
  root, PREVIEW=0 at the root, and SHOP_DEMO=1 under /santirosina/. The switch is Remy's: Settings → Pages → Custom
  domain `www.santirosina.com`; Cloudflare: take santirosina.com / www off whatever serves Coming Soon, then DNS-only
  A @ → 185.199.108.153 / .109.153 / .110.153 / .111.153 and CNAME www → remy-margerum.github.io (MX / TXT untouched);
  Enforce HTTPS once the certificate issues; re-run the workflow. Left to Remy: the placeholder email
  (hello@santirosina.com), the example prices and the unapproved lines go public with it.
- 2026-09-29 (later) — **The menu split round the wordmark** (Remy: "can you move our story and contact us to the right
  of the logo and rename Shop to the Wines"). The schema's `menu` is `'left' | 'right'`; the header draws The Wines +
  Wine Club left of the wordmark and Our Story + Contact Us in a `.right-nav` on its right (the shop's pieces would
  follow them when shown). On a phone the burger's drop-down lists all four and the right half hides; on desktop the
  drop-down's right items hide — each link exposed once at any width. The route's title is "The Wines" (header,
  footer). The collection's per-wine "Shop" links on the home page were not asked about and stay. Verified: 23 tests,
  the Chromium check at the root and under /santirosina/, the phone menu opened by a tap (four links, right half hidden).
- 2026-09-29 (later) — **The 2026 program's nine wines; no prices** (Remy: "i also need these 9 wines to be the skus",
  with his program table — Chardonnay, Sauvignon Blanc, Rhône White Blend, Rhône Red Blend, Cabernet Blend, Sangiovese,
  Barbera, Cabernet Franc, Estate Cabernet — then "also lets hide the price anyways"). The table is the 2026 custom crush
  program (Drive, SAN / Contract, "2026-07-29 Custom Crush Program Summary"; the 2026 harvest orders, program SAN), so
  every wine is 2026, in his order and under his names. The Product Master has no 2026 SAN record: mSKU / mLot Code are
  minted in its convention (26ZSR…, CG-SAN-26-…) and flagged `exampleCodes` — the records' own codes replace them when
  Margerum creates them. No price (`price: null`, and `priceOf()` shows one only when the shop is visible), no planned
  case counts, no cost: the table's per-case figures are Margerum's cost and never enter the repo. Approved words only:
  the collection's lines for Sauvignon Blanc, Sangiovese and Cabernet Sauvignon (on the Estate Cabernet); Nebbiolo's
  line leaves the site with Nebbiolo. Pictures: those three have bottle shots; the six with no label show the stacked
  wordmark, its rose and the wine's name at a bottle's height (`WineArt.astro`), never another wine's bottle. The shop
  is by colour (White Wines, Red Wines — two headings added to `unapproved`); the home collection is the nine cards,
  three to a row (the approved lines moved to the wine pages: under three of nine cards they stood the row unevenly;
  the per-wine "Shop" links went with them — a card's name links to its wine).
  Hard-won: the bottle rules (`.wine-card__art img`, `.wine-art img`) never applied — `body.site img {height:auto}`
  outranked them, as it had the banners — so a bottle stood at whatever height its srcset gave it; they carry
  `body.site` now, and page-check fails a row of cards whose pictures differ in height. Verified: 25 tests and the
  Chromium check at the root, under /santirosina/, with SHOP_DEMO=1 and with PREVIEW=0. Left to Remy: the vintage
  (2026 — or the current bottled vintage for the three that exist: 2025 Sauvignon Blanc and Sangiovese, 2024 Cabernet,
  each with a tech sheet), approved words for the six new wines, and their labels.
- 2026-09-30 — **2026 confirmed; Box's bottle photos checked** (Remy: "Bottle photos for some are in box, I believe 4 of
  them, and yeah should be 2026"). Box, *MWC Office › Santi Rosina › Bottle Images*, holds four wines' fronts (and backs):
  Sauvignon Blanc, Sangiovese, Cabernet Sauvignon and Nebbiolo — the same files, sha1 for sha1, as the Drive copies the
  site already draws (Sauvignon Blanc, Sangiovese, and Cabernet Sauvignon on the Estate Cabernet); the fourth, Nebbiolo,
  is not one of the nine. No other Santi Rosina bottle or label image exists in Box (the 2026 folder, *Contracts ›
  Private Label Contracts*, holds one contract per 2026 wine, which also confirms the vintage). The site is unchanged:
  every wine was already 2026. Left to Remy: photos (and labels) for Chardonnay, the two Rhône blends, the Cabernet
  Blend, Barbera and Cabernet Franc; approved words for them.
- 2026-10-02 — **Our Team; the harvest photos; no photo twice** (Remy: "This is the link to the most recent harvest
  photos", "We need to add Our Team page" with the bios, "Please fix these", "There are several duplicates of photos we
  need to remove"). `/team/` = a new `team` page type (margerum-site's) whose `people` section (once) lists each person
  — name in the label's capitals and title beside the bio, a portrait above the name when there is one (none yet), the
  anchor /team/#their-name — then a Picture + text band for the Vineyard Team with the crew photo WHOLE (a new band
  option `whole`: a group photo's edges matter). In the header right of the wordmark after Our Story, and in the footer.
  The bios: Remy's words with the fixes listed in `docs/TEAM-BIOS.md` (grammar; the copy guide's meticulous → patient
  and no "exceptional"/"unique" for Juve; "to its present size" out of Robert's Winc line, Winc having gone bankrupt in
  2022), all in `unapproved`. Harvest photos: the Dropbox folder (88, 2 GB) holds 11 duplicates — eight shots also
  delivered in black and white, three one-second bursts — none used (`build_assets.py` refuses them); five used, no
  frame with a readable label, no camera data published. The site's own duplicates: the pizza oven was on / and
  /about/, the lavender settings on /wine-club/ and /about/, the Wine Club's toast a second shot of the home band's —
  Our Story's gallery is the harvest now, the Wine Club's first photo the table with the wine; a test fails any
  photograph shown on two pages. Also: /wines/'s search description still named Nebbiolo (rewritten for the 2026
  wines). Hard-won: three links right of the wordmark broke "Contact Us" onto two lines at 900 px — nav links never
  wrap now and tighten their spacing below 1100 px (gaps checked at 900–1400). Verified: 27 tests, the Chromium check
  at 390 and 1400 (11 pages) at the root and under /santirosina/, the header at nine widths. Left to Remy: Kathryn's
  approval of the page; portraits if wanted; whether Robert's Winc line stays.
