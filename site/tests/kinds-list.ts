// the section kinds src/components/blocks/kinds.ts maps (read from its source, so the test needs no Astro loader)
import { readFileSync } from 'node:fs';
const src = readFileSync('src/components/blocks/kinds.ts', 'utf8');
const body = src.slice(src.indexOf('export const KINDS = {'));
export const KIND_NAMES = [...body.matchAll(/([a-z]+): [A-Z][A-Za-z]+Block/g)].map((m) => m[1]);
