// Every internal URL goes through u(): the build may be served under a base path (the GitHub Pages preview lives at
// /santirosina/), and a root-relative href would leave it. The CMS's words carry root-relative links too, so rendered
// HTML goes through withBase() on its way into a page.
import { SITE_BASE } from '../site.mjs';
const BASE = SITE_BASE.replace(/\/$/, '');
/** a site path ('/wines/') under the base; anything else (https:, mailto:, tel:, #) as it is */
export const u = (path: string) => (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? BASE + path : path);
/** the same for every href / src in a piece of rendered HTML */
export const withBase = (html: string) => (BASE ? html.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${BASE}/`) : html);
