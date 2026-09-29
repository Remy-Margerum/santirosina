// A page's SECTIONS: the reading rule (margerum-site's src/cms/blocks.mjs, without its conversion window: Santi Rosina's
// pages are sections from the first day). Below its head fields a page is an ordered list of sections of the kinds its
// type declares, stored flat — `{ kind, id, ...fields }` — with the CMS's rendering of each (rich fields as HTML)
// index-aligned in `rendered.blocks`. A type's `once` kinds (the catalog, the collection, the club's join box) are
// always there: a page that does not list one gets it at the end. Nothing here throws on junk.
import { types } from './schema.mjs';

/** FNV-1a 32 over the code points, 8 hex digits: identical to margerum-site's and the dashboards' site-core.js */
export function fnv(s) {
  let h = 0x811c9dc5;
  for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
/** a once section's id (the same rule as the dashboards' onceId) */
export const onceId = (route, kind) => 'b' + fnv(`${route}|${kind}`);
export const BLOCK_ID_RE = /^b[0-9a-f]{8}$/;

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => !!o && typeof o === 'object' && Object.hasOwn(o, k);
/** blank values read as nothing: '', whitespace, null, false, [] and an image / link nobody filled in */
export const blank = (v) => v === undefined || v === null || v === false || (typeof v === 'string' && !/\S/.test(v))
  || (Array.isArray(v) && v.length === 0) || (isObj(v) && 'id' in v && !String(v.id || '').trim() && !('href' in v))
  || (isObj(v) && 'href' in v && !String(v.href || '').trim() && !String(v.label || '').trim());

/** a type's `blocks` field spec, or null */
export function blocksSpec(type) {
  const t = own(types, type) ? types[type] : null;
  return (t && (t.fields || []).find((f) => f.kind === 'blocks')) || null;
}
/** a kind's spec on a type, or null (never a prototype key) */
export function kindSpec(type, kind) {
  const spec = blocksSpec(type);
  return spec && typeof kind === 'string' && own(spec.kinds, kind) ? spec.kinds[kind] : null;
}
/** the kind sits in the text column (flow) rather than a full-width band (wide) */
export const isFlow = (type, kind) => { const k = kindSpec(type, kind); return !k || k.place !== 'wide'; };

/**
 * The page's sections in order: `{ kind, id, unknown, fields, rendered, pos, ord }`. `fields` = the stored values,
 * `rendered` = the same with rich fields as HTML; `pos` = the index on the page, `ord` = the index among the page's
 * Picture + text bands (their pictures alternate sides by it).
 */
export function blocksOf(type, route, fields, rendered) {
  const spec = blocksSpec(type);
  if (!spec) return [];
  const raw = Array.isArray(fields?.blocks) ? fields.blocks : [];
  const ren = Array.isArray(rendered?.blocks) ? rendered.blocks : [];
  const out = [];
  raw.forEach((b, i) => {
    if (!isObj(b) || typeof b.kind !== 'string') return;
    const id = typeof b.id === 'string' && BLOCK_ID_RE.test(b.id) ? b.id : 'b' + fnv(`${route}|${i}`);
    const r = isObj(ren[i]) ? ren[i] : {};
    out.push({ kind: b.kind, id, unknown: !own(spec.kinds, b.kind), fields: b, rendered: { ...b, ...r } });
  });
  for (const [k, ks] of Object.entries(spec.kinds)) {
    if (ks.once && !out.some((b) => b.kind === k)) out.push({ kind: k, id: onceId(route, k), unknown: false, fields: { kind: k }, rendered: { kind: k } });
  }
  let band = 0;
  return out.map((b, pos) => ({ ...b, pos, ord: b.kind === 'band' ? band++ : undefined }));
}
/** a section's stored value, blank as undefined */
export const bf = (b, id) => { const v = b && b.fields ? b.fields[id] : undefined; return blank(v) ? undefined : v; };
/** a section's rendered value (a rich field as HTML), blank as undefined */
export const br = (b, id) => { const v = b && b.rendered ? b.rendered[id] : undefined; return blank(v) ? undefined : v; };
