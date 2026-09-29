# Where the site's material came from (2026-09-29)

| What | Source | In the repo |
|---|---|---|
| Body copy | "Santi Rosina Approved Copy.docx" — Brooks's email "Website", 2026-09-11; Drive *SAN - Santi Rosina / Brand Documents* | `docs/APPROVED-COPY.md` → `site/src/data/content.seed.json` |
| Copy rules | "Santi Rosina Style Guide - Copywriting.docx", same folder | `docs/COPY-STYLE-GUIDE.md` |
| Logo | The label designers (Evan Backes, Tom Adler): "SantiRosina-Wordmark-Flower-v2.pdf" (Doug's forward, 2026-09-02); the chosen layout, option 4 (stacked, rose beneath) = Drive "SANTI-ROSINA-LOGO-2026.jpg" | `brand/logo/`; the wordmark's outlines and the rose (lifted off its white) in `site/src/components/brand/marks.json`, `site/public/brand/rose.*` |
| Type | "Santi Rosina Style Guide - Wordmark & Type.pdf" (Bembo MT Pro, Regular; caps with open spacing for titles; sentence case, open leading for text; ink #231F20) | `brand/`; the site sets Cardo until Bembo is licensed for the web |
| Palette | "Final Style Guide for Photo Shoot.png", Drive *SAN - Santi Rosina / Social Media* (ivory, cream, blush, rose, terracotta, olive / sage, warm gold) | `site/src/styles/tokens.css` |
| Photographs | Brooks's image bank (same email): Dropbox "Full batch with talent" (275 photos, "Day 1 - Round 2") and "Vineyard round 1" (51) — 21 chosen; never Vines-21 (its block sign names another winery) | `site/public/media/` (made by `site/scripts/assets/build_assets.py`) |
| Bottle shots | Drive *SAN - Santi Rosina / Bottle Images* — `SAN_*nv_1200.png` (front label, no vintage on it) | `site/public/art/bottles/` |
| The nine wines | Margerum's Product Master, program SAN (mSKU, mLot Code, vintage); none is in Commerce7 | `site/scripts/demo-feed.mjs` → `site/src/data/site-feed.json` |
| Prices (examples) | "2026-05-13 Wholesale Price List - Santi Rosina", third column (bottle, retail) | same |
| Tasting notes, vineyard, cellar, lab figures | The tech sheets in Drive *SAN - Santi Rosina / Tech Sheets* (2025 Sauvignon Blanc, 2024 Sangiovese, 2024 Nebbiolo, 2024 Cabernet Sauvignon revised 2026-08-14, 2022 Nebbiolo) | same |
| Reference site | braveandmaiden.com — the client's pick, "elegant but inviting, premium without being cold" (Brooks, 2026-08-14) | the header, the hero, the bands |

Never on the site (private or unapproved): the estate's street address and the business address (Drive "Vineyard
Facts"), the owners' names, Doug's working positioning notes, anything in "Santi Rosina Passwords + Data" (not opened).
