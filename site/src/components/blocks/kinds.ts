// kind → component: one per section kind the schema declares (tests/content.test.ts pins the pairing)
import BandBlock from './BandBlock.astro';
import TextBlock from './TextBlock.astro';
import StatementBlock from './StatementBlock.astro';
import GalleryBlock from './GalleryBlock.astro';
import WinesBlock from './WinesBlock.astro';
import QuoteBlock from './QuoteBlock.astro';
import ButtonBlock from './ButtonBlock.astro';
import QuestionsBlock from './QuestionsBlock.astro';
import CollectionBlock from './CollectionBlock.astro';
import CatalogBlock from './CatalogBlock.astro';
import JoinBlock from './JoinBlock.astro';
export const KINDS = {
  band: BandBlock, text: TextBlock, statement: StatementBlock, gallery: GalleryBlock, wines: WinesBlock, quote: QuoteBlock,
  button: ButtonBlock, questions: QuestionsBlock, collection: CollectionBlock, catalog: CatalogBlock, join: JoinBlock,
} as const;
