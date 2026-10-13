/** a row of wine cards: four side by side when the catalog holds four (2026-10-13, Nebbiolo the fourth), else three to
 *  a row; a phone takes two across either way (base.css) */
export const wineGrid = (n: number) => ['wine-grid', n === 4 ? 'wine-grid--four' : 'wine-grid--three'];
