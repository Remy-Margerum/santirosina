// The CMS's constrained Markdown, rendered: paragraphs, ## and ### headings, bold / italic, links (https://, a site
// route, mailto:, tel:), bullet and numbered lists, a blockquote. VENDORED byte for byte from the dashboards'
// cloud-deploy/transfers-api/site-core.js (`renderRich`, 2026-09-29) so the words render here exactly as the Web
// Pages editor will render them; replace this file's body if that one changes.
const txt = (v) => {
  if (typeof v === 'string') return v;
  try { return String(v); } catch { return ''; }
};
export function renderRich(md) {
  const escape = (t) => txt(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inline = (t) => escape(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:|tel:)[^)\s]+)\)/g, (m, a, h) => `<a href="${h}"${/^https?:/.test(h) ? ' rel="noopener"' : ''}>${a}</a>`);
  const blocks = txt(md || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b) => {
    let m;
    if ((m = b.match(/^(#{2,3})\s+(.*)$/))) return `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    if (/^(?:[-*]\s.*)(?:\n[-*]\s.*)*$/.test(b)) return `<ul>${b.split('\n').map((l) => `<li>${inline(l.replace(/^[-*]\s/, ''))}</li>`).join('')}</ul>`;
    if (/^(?:\d+\.\s.*)(?:\n\d+\.\s.*)*$/.test(b)) return `<ol>${b.split('\n').map((l) => `<li>${inline(l.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>`;
    if (/^>\s?/.test(b)) return `<blockquote><p>${inline(b.replace(/^>\s?/gm, ''))}</p></blockquote>`;
    return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
