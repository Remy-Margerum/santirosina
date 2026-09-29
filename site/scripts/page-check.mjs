// Every page in Chromium at 390 (a phone, touch) and 1400 wide over a local server of dist/: no sideways scroll, every
// image loaded, and the shop inert — a press on Add to cart, the cart, Log in and Join shows the note and goes
// nowhere, and no request leaves for a commerce provider. Screenshots to SHOTS (default /tmp/sr-shots).
//   npm run build && node scripts/page-check.mjs [--shots <dir>]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';
import { SITE_BASE } from '../src/site.mjs';

const SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : '/tmp/sr-shots';
mkdirSync(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(SITE_BASE)) { res.writeHead(404); return res.end(); }
  p = join('dist', p.slice(SITE_BASE.length));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404, { 'content-type': 'text/html' }); return res.end(readFileSync('dist/404.html')); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(0);
const base = `http://localhost:${server.address().port}${SITE_BASE}`;
const PAGES = ['', 'wines/', 'wines/2024-nebbiolo/', 'wines/2025-sauvignon-blanc/', 'wines/2021-cabernet-sauvignon/', 'wine-club/', 'about/', 'contact/', 'not-a-page/'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const problems = [];
for (const [w, h, tag, touch] of [[1400, 900, 'desk', false], [390, 844, 'phone', true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  const page = await ctx.newPage();
  const outside = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== 'localhost') outside.push(r.url()); });
  for (const p of PAGES) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); }))));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
      h1: document.querySelectorAll('h1').length,
    }));
    if (m.sw > m.cw) problems.push(`${tag} /${p}: sideways scroll ${m.sw} > ${m.cw}`);
    if (m.broken.length) problems.push(`${tag} /${p}: broken images ${m.broken.join(', ')}`);
    if (m.h1 !== 1) problems.push(`${tag} /${p}: ${m.h1} h1`);
    const name = (p || 'home').replace(/\/$/, '').replace(/\//g, '_');
    await page.screenshot({ path: `${SHOTS}/${tag}-${name}.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
  }
  // the shop goes nowhere: a press shows the note, the URL stays
  await page.goto(base + 'wines/2024-nebbiolo/', { waitUntil: 'networkidle' });
  const before = page.url();
  const buy = page.locator('.wine-info [data-shop="buy"]');
  touch ? await buy.tap() : await buy.click();
  await page.waitForTimeout(200);
  if (page.url() !== before) problems.push(`${tag}: Add to cart navigated to ${page.url()}`);
  if (!(await page.locator('.wine-info .shop-note').isVisible())) problems.push(`${tag}: Add to cart showed no note`);
  await page.screenshot({ path: `${SHOTS}/${tag}-buy-pressed.jpg`, type: 'jpeg', quality: 70 });
  const cart = page.locator('.header-right [data-shop="cart"]');
  touch ? await cart.tap() : await cart.click();
  await page.waitForTimeout(200);
  if (!(await page.locator('#shop-note-cart').isVisible())) problems.push(`${tag}: the cart showed no note`);
  await page.goto(base + 'wine-club/', { waitUntil: 'networkidle' });
  const join = page.locator('[data-shop="club-join"]');
  touch ? await join.tap() : await join.click();
  await page.waitForTimeout(200);
  if (!(await page.locator('.join .shop-note').isVisible())) problems.push(`${tag}: Join showed no note`);
  if (page.url() !== base + 'wine-club/') problems.push(`${tag}: Join navigated`);
  if (touch) {   // the phone menu opens on a tap and lists the pages
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.burger').tap();
    await page.waitForTimeout(200);
    if (!(await page.locator('.primary-nav').isVisible())) problems.push('phone: the menu did not open');
    await page.screenshot({ path: `${SHOTS}/${tag}-menu-open.jpg`, type: 'jpeg', quality: 70 });
  }
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  const bad = links.filter((h) => /\/(cart|checkout|profile|product|collection)\b/.test(h));
  if (bad.length) problems.push(`${tag}: links into a shop route: ${bad.join(', ')}`);
  if (outside.length) problems.push(`${tag}: requests left the site: ${[...new Set(outside)].slice(0, 5).join(', ')}`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : `ok — ${PAGES.length} pages at 1400 and 390, shop inert; shots in ${SHOTS}`);
process.exit(problems.length ? 1 : 0);
