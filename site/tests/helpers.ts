import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
/** the built page for a route ('/', '/wines/2024-nebbiolo/'); dist/ is laid out at its root whatever the base */
export const built = (route: string) => `dist${route}index.html`;
export const hasBuild = () => existsSync('dist/index.html');
export const html = (route: string) => readFileSync(built(route), 'utf8');
export const doc = (route: string) => new JSDOM(html(route)).window.document;
export const feed = JSON.parse(readFileSync('src/data/site-feed.json', 'utf8'));
export const seed = JSON.parse(readFileSync('src/data/content.seed.json', 'utf8'));
