// The page schema: what this site can render, declared ONCE (margerum-site's src/cms/schema.mjs, same vocabulary).
// When Santi Rosina's dashboards exist it is pushed to their Web Pages editor, which renders its forms from it; until
// then src/data/content.seed.json holds the pages in the same shape and scripts/seed-content.mjs renders them.
// Field ids are a-z, 0-9 and hyphens; kinds are text | rich | image | images | link | wines | list | bool | select |
// number | blocks. A page is a head of fixed fields plus SECTIONS (`blocks`) of the kinds its type declares, each kind
// drawn by ONE component in src/components/blocks/. Templates read fields only through src/cms/index.ts, and
// tests/content.test.ts fails a template or a seed that uses a field this file does not declare.
// Plain ESM so the scripts, the tests and Astro all import it.

const image = (id, label, hint) => ({ id, kind: 'image', label, hint });
const text = (id, label, max, extra = {}) => ({ id, kind: 'text', label, max, ...extra });
const rich = (id, label, max, extra = {}) => ({ id, kind: 'rich', label, max, ...extra });
const link = (id, label, hint, extra = {}) => ({ id, kind: 'link', label, hint, ...extra });
const bool = (id, label, hint) => ({ id, kind: 'bool', label, hint });
const select = (id, label, options, hint) => ({ id, kind: 'select', label, options, hint });
const list = (id, label, max, of, extra = {}) => ({ id, kind: 'list', label, max, of, ...extra });

// ---- section kinds: `place` flow = in the page's text column, wide = a full-width band of its own ----
const kind = (label, place, fields, extra = {}) => ({ label, place, fields, ...extra });
const K = {
  text: ({ max = 12000 } = {}) => kind('Text', 'flow', [rich('body', 'Text', max, { required: true }), bool('small', 'Small print', 'smaller, quieter type')],
    { max: 20, hint: 'paragraphs at the reading width: ## and ### headings, lists, links' }),
  band: () => kind('Picture + text', 'wide', [
    image('image', 'Picture'), text('eyebrow', 'Eyebrow', 60), text('heading', 'Heading', 80), rich('body', 'Text', 2000), link('link', 'Button'),
    select('side', 'Picture on', ['left', 'right'], 'empty = the other side from the band before'),
  ], { max: 12, needsOne: ['image', 'heading', 'body'], hint: 'a picture beside a heading and a few paragraphs' }),
  statement: () => kind('Statement', 'wide', [
    text('eyebrow', 'Eyebrow', 60), rich('body', 'Words', 1200, { required: true }), image('image', 'Background picture', 'optional: darkened behind the words'),
    select('tone', 'Tone', ['dark', 'light'], 'empty = dark'),
  ], { max: 4, hint: 'a few lines set large, centred on a band of their own' }),
  gallery: () => kind('Gallery', 'wide', [{ id: 'images', kind: 'images', label: 'Photos', max: 12, required: true }], { max: 4, hint: 'photos in a grid' }),
  wines: () => kind('Wines', 'wide', [text('heading', 'Heading', 60), { id: 'wines', kind: 'wines', label: 'Wines', max: 8, required: true, hint: 'in order' }],
    { max: 3, hint: 'a row of wine cards you pick, with their buy buttons' }),
  quote: () => kind('Quote', 'flow', [
    text('quote', 'Quote', 400, { required: true, hint: 'the words alone: the quotation marks are added' }),
    text('cite', 'Who said it', 160), link('link', 'Read it', 'optional: where the words were published'),
  ], { max: 6, hint: 'words worth quoting, credited' }),
  button: () => kind('Button', 'flow', [link('link', 'Button', 'the words on the button and where it goes', { required: true }), bool('outline', 'Outline', 'the quieter, outlined button')],
    { max: 6, hint: 'one button' }),
  questions: () => kind('Questions', 'flow', [
    text('heading', 'Heading', 80, { hint: 'empty = Questions' }),
    list('items', 'Questions', 20, [text('question', 'Question', 160, { required: true }), rich('answer', 'Answer', 800)], { required: true, item: 'Question' }),
  ], { max: 2, hint: 'questions that open to their answers' }),
};
// each type's own content: exactly one per page, movable, never removed (`once`)
const S = {
  collection: kind('The collection', 'wide', [text('heading', 'Heading', 60, { hint: 'empty = The Collection' }), rich('intro', 'Intro', 600)],
    { once: true, hint: 'one card per wine (its bottle, the words the catalog gives it, a link to it in the shop); built from the catalog' }),
  catalog: kind('The wines', 'wide', [], { once: true, hint: 'every wine on sale, grouped by wine with each vintage beneath; built from the catalog' }),
  join: kind('Join the club', 'flow', [text('heading', 'Heading', 60, { hint: 'empty = Join the Club' }), rich('intro', 'Words beside the button', 800)],
    { once: true, hint: 'the club’s join button (the commerce provider’s); always shows' }),
};
const BLOCKS_HINT = 'the page below its title, in order: add, move, duplicate or remove sections';
const blocks = (kinds, extra = {}) => ({ id: 'blocks', kind: 'blocks', label: 'Sections', kinds, ...extra, hint: BLOCKS_HINT });

export const types = {
  home: {
    label: 'Home page',
    fields: [
      image('hero', 'Hero image', 'the photograph behind the headline, 2400 × 1350 or larger'),
      text('eyebrow', 'Eyebrow', 60, { hint: 'the tracked small capitals above the headline' }),
      text('headline', 'Headline', 80, { required: true }),
      rich('lede', 'Lede', 400, { hint: 'a sentence under the headline' }),
      link('primary-cta', 'Primary button', 'e.g. Shop the wines → /wines/'),
      link('secondary-cta', 'Secondary button', 'e.g. Join the wine club → /wine-club/'),
      blocks({ collection: S.collection, band: K.band(), statement: K.statement(), text: K.text(), gallery: K.gallery(), wines: K.wines(), quote: K.quote(), button: K.button() }, { max: 16 }),
    ],
  },
  listing: {
    label: 'Wines listing',
    note: 'the wines are built from the catalog; the words around them are yours',
    fields: [image('hero', 'Hero image', 'optional'), text('title', 'Title', 60), rich('intro', 'Intro', 800),
      blocks({ catalog: S.catalog, text: K.text(), band: K.band(), statement: K.statement(), quote: K.quote(), button: K.button(), questions: K.questions() }, { max: 12 })],
  },
  club: {
    label: 'Wine club page',
    note: 'the join button is the commerce provider’s club; everything around it is yours',
    fields: [image('hero', 'Hero image', 'optional'), text('title', 'Title', 60), rich('intro', 'Intro', 800),
      blocks({ join: S.join, text: K.text(), band: K.band(), statement: K.statement(), gallery: K.gallery(), wines: K.wines(), quote: K.quote(), button: K.button(), questions: K.questions() }, { max: 16 })],
  },
  standard: {
    label: 'Standard page',
    fields: [image('hero', 'Hero image', 'optional'), text('title', 'Title', 80, { required: true }), rich('intro', 'Intro', 800, { hint: 'the lede under the title, larger type' }),
      blocks({ text: K.text(), band: K.band(), statement: K.statement(), gallery: K.gallery(), wines: K.wines(), quote: K.quote(), button: K.button(), questions: K.questions() }, { max: 30 })],
  },
  // counsel's text is one document: Text sections only
  legal: {
    label: 'Legal page',
    fields: [text('title', 'Title', 80, { required: true }), blocks({ text: K.text({ max: 60000 }) }, { max: 20, required: true })],
  },
  product: {
    label: 'Wine page',
    generated: true,
    note: 'built from the Product Master, the Content Master and the commerce provider: edited there, never here',
    fields: [],
  },
};

// Our permanent URL space, one route each (Brooks, 2026-08-14: "Landing page, Wine Club, Shop, About, Contact Us").
// A standard or legal route with no content is not built. `menu` = shown in the header, on the wordmark's 'left' or
// 'right' (Remy, 2026-09-29: "move our story and contact us to the right of the logo and rename Shop to the Wines");
// `footer` = the footer group.
export const routes = [
  { route: '/', type: 'home', title: 'Home' },
  { route: '/wines/', type: 'listing', title: 'The Wines', menu: 'left', footer: 'Visit' },
  { route: '/wine-club/', type: 'club', title: 'Wine Club', menu: 'left', footer: 'Visit' },
  { route: '/about/', type: 'standard', title: 'Our Story', menu: 'right', footer: 'Visit' },
  { route: '/contact/', type: 'standard', title: 'Contact Us', menu: 'right', footer: 'Visit' },
  { route: '/privacy/', type: 'legal', title: 'Privacy Policy', footer: 'Legal' },
  { route: '/terms/', type: 'legal', title: 'Terms of Service', footer: 'Legal' },
  { route: '/wines/*', type: 'product', title: 'Wine pages' },
];

export const schema = () => ({
  version: `${new Date().toISOString().slice(0, 10)}-${process.env.GIT_COMMIT || 'local'}`,
  types, routes,
});
export default schema;
