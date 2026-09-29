// Writes src/data/content.json — the file every template reads through src/cms/index.ts — from the committed seed
// (src/data/content.seed.json) and the committed media manifest (src/data/media.json), in exactly the shape
// margerum-site's pull writes from its CMS: `pages` (type, fields, rendered, seo) and `media`. Rich fields are rendered
// by the CMS's own renderer (src/cms/rich.mjs, vendored), section ids assigned by the CMS's rule where the seed gives
// none. Run by `npm run build` (prebuild). When Santi Rosina's Web Pages editor exists, a pull replaces this script.
//
// Refuses a seed that names a field or a section kind the schema does not declare, a media id the manifest lacks,
// or a rich field the CMS would refuse: what builds here must be what the editor would accept.
import { readFileSync, writeFileSync } from 'node:fs';
import { types } from '../src/cms/schema.mjs';
import { renderRich } from '../src/cms/rich.mjs';
import { fnv, BLOCK_ID_RE } from '../src/cms/blocks.mjs';

const seed = JSON.parse(readFileSync('src/data/content.seed.json', 'utf8'));
const { media: library } = JSON.parse(readFileSync('src/data/media.json', 'utf8'));
const errors = [];
const used = new Set();

// the CMS's own refusals for a rich field (site-core.js richProblems, the same rules)
function richProblems(md) {
  const out = [], s = String(md || '');
  if (/<[a-z!/][^>]*>/i.test(s)) out.push('HTML tags are not allowed');
  if (/^#{4,}\s/m.test(s) || /^#\s/m.test(s)) out.push('only ## and ### headings are allowed');
  if (/\]\((?!https?:\/\/|\/|mailto:|tel:)/.test(s)) out.push('a link must be https://, a site route, mailto: or tel:');
  return out;
}
function renderField(spec, v, where) {
  if (v === undefined || v === null) return v;
  switch (spec.kind) {
    case 'rich': { const p = richProblems(v); if (p.length) errors.push(`${where}: ${p.join('; ')}`); return renderRich(v); }
    case 'image': if (v && v.id) { if (!library[v.id]) errors.push(`${where}: media ${v.id} is not in src/data/media.json`); used.add(v.id); } return v;
    case 'images': for (const r of v || []) { if (!library[r.id]) errors.push(`${where}: media ${r.id} is not in src/data/media.json`); used.add(r.id); } return v;
    case 'list': return (v || []).map((item, i) => renderAll(spec.of, item, `${where}[${i}]`));
    default: return v;
  }
}
function renderAll(specs, values, where) {
  const out = {};
  for (const [k, v] of Object.entries(values || {})) {
    if (k === 'kind' || k === 'id') { out[k] = v; continue; }
    const spec = specs.find((s) => s.id === k);
    if (!spec) { errors.push(`${where}: "${k}" is not a declared field`); continue; }
    out[k] = renderField(spec, v, `${where}.${k}`);
  }
  return out;
}

const pages = {};
for (const [route, p] of Object.entries(seed.pages)) {
  const type = types[p.type];
  if (!type) { errors.push(`${route}: type "${p.type}" is not declared`); continue; }
  const fields = {}, rendered = {};
  for (const [k, v] of Object.entries(p.fields)) {
    const spec = type.fields.find((f) => f.id === k);
    if (!spec) { errors.push(`${route}: "${k}" is not a field of ${p.type}`); continue; }
    if (spec.kind === 'blocks') {
      fields.blocks = []; rendered.blocks = [];
      v.forEach((b, i) => {
        const ks = spec.kinds[b.kind];
        if (!ks) { errors.push(`${route}: section ${i} is a "${b.kind}", which ${p.type} does not declare`); return; }
        const id = BLOCK_ID_RE.test(b.id || '') ? b.id : 'b' + fnv(`${route}|seed|${i}`);
        fields.blocks.push({ ...b, id });
        rendered.blocks.push({ ...renderAll(ks.fields, b, `${route} section ${i} (${b.kind})`), id });
      });
      continue;
    }
    fields[k] = v;
    rendered[k] = renderField(spec, v, `${route}.${k}`);
  }
  if (p.seo?.ogImage) used.add(p.seo.ogImage);
  pages[route] = { type: p.type, version: 1, publishedAt: '2026-09-29T00:00:00Z', fields, rendered, seo: p.seo || {} };
}
if (errors.length) { console.error('content seed refused:\n  ' + errors.join('\n  ')); process.exit(1); }
const media = Object.fromEntries([...used].sort().map((id) => [id, library[id]]));
writeFileSync('src/data/content.json', JSON.stringify({ schemaVersion: seed.schemaVersion, side: 'seed', pulledAt: new Date().toISOString(), pages, media }, null, 1));
console.log(`content.json: ${Object.keys(pages).length} pages, ${Object.keys(media).length} photos`);
