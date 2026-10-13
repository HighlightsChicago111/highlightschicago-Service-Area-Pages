import library from './card-library.json'
import type {AreaCard, CardImage} from '@/types/area'

/**
 * Collection-card photos and text from the approved collection template, one per area slug, with each photo's
 * Wikimedia Commons credit. Files are in public/images/areas. A card uses its own Sanity photo first, then this
 * library, then a plain placeholder, so an area from the template gets its exact template photo as soon as its page
 * is published.
 */
export type LibraryCard = {area: string; src: string; alt: string; credit: string; creditUrl: string | null; summary: string; region: string}
export const CARD_LIBRARY = library as Record<string, LibraryCard>

export function cardImageFor(card: Pick<AreaCard, 'slug' | 'cardImage'>): CardImage | undefined {
  if (card.cardImage?.url) return card.cardImage
  const entry = CARD_LIBRARY[card.slug]
  return entry ? {url: entry.src, alt: entry.alt, credit: entry.credit, creditUrl: entry.creditUrl || undefined} : undefined
}
export const cardSummaryFor = (card: AreaCard) => card.cardSummary || CARD_LIBRARY[card.slug]?.summary || card.eyebrow
export const cardRegionFor = (card: AreaCard) => card.cardRegion || CARD_LIBRARY[card.slug]?.region
