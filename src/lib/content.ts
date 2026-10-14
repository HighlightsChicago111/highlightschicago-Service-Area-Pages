import fs from 'node:fs/promises'
import path from 'node:path'
import {BUNDLED_SETTINGS} from '@/lib/area/company-fallback'
import {contentSource} from '@/sanity/env'
import {client, previewClient} from '@/sanity/lib/client'
import {AREA_CARDS_QUERY, AREA_PAGE_QUERY, AREA_SETTINGS_QUERY, AREA_SITEMAP_QUERY} from '@/sanity/lib/queries'
import type {AreaCard, AreaPage, AreaPageData, AreaSettings} from '@/types/area'

type LocalDoc = Record<string, unknown> & {_id: string; _type: string}

const LOCAL_FILE = path.join(process.cwd(), 'data', 'area-documents.json')

async function localDocs(): Promise<LocalDoc[]> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as LocalDoc[]
  } catch {
    return []
  }
}

function fromLocal(doc: LocalDoc): AreaPage {
  const page = {...doc, slug: (doc.slug as {current?: string} | undefined)?.current || ''} as unknown as AreaPage
  if (page.teamPhoto) page.teamPhoto = {...page.teamPhoto, resolvedUrl: page.teamPhoto.src}
  return page
}

const toCard = (page: AreaPage): AreaCard => ({
  slug: page.slug, area: page.area, areaIn: page.areaIn, eyebrow: page.eyebrow, metaDescription: page.metaDescription,
  permitCount: page.permits?.highlights?.count, illus: page.buildings?.[0]?.illus, districtCount: page.districts?.length,
  city: page.city, cardSummary: page.cardSummary, cardRegion: page.cardRegion,
  cardImage: page.cardImage ? {url: page.cardImage.src, alt: page.cardImage.alt, credit: page.cardImage.credit, creditUrl: page.cardImage.creditUrl} : undefined,
})

/** Published area pages; in preview (draft) mode, drafts as well. */
export async function getAreaCards(draft = false): Promise<AreaCard[]> {
  if (contentSource === 'sanity') return (await (draft ? previewClient : client).fetch<AreaCard[]>(AREA_CARDS_QUERY)) || []
  return (await localDocs()).filter((doc) => doc._type === 'areaPage').map(fromLocal).sort((a, b) => a.area.localeCompare(b.area)).map(toCard)
}

export async function getAreaPage(slug: string, draft = false): Promise<AreaPageData> {
  if (contentSource === 'sanity') {
    const data = (await (draft ? previewClient : client).fetch<AreaPageData>(AREA_PAGE_QUERY, {slug})) || {page: null, settings: null, areas: []}
    return {...data, settings: data.settings || BUNDLED_SETTINGS}
  }
  const docs = await localDocs()
  const pages = docs.filter((doc) => doc._type === 'areaPage').map(fromLocal)
  return {
    page: pages.find((page) => page.slug === slug) || null,
    settings: (docs.find((doc) => doc._type === 'areaSettings') as unknown as AreaSettings) || BUNDLED_SETTINGS,
    areas: pages.sort((a, b) => a.area.localeCompare(b.area)).map(toCard),
  }
}

/** Published area slugs with their last edit, for the sitemap. Never includes drafts. */
export async function getSitemapAreas(): Promise<Array<{slug: string; _updatedAt?: string}>> {
  if (contentSource === 'sanity') return (await client.fetch<Array<{slug: string; _updatedAt?: string}>>(AREA_SITEMAP_QUERY)) || []
  return (await localDocs()).filter((doc) => doc._type === 'areaPage').map(fromLocal).map((page) => ({slug: page.slug}))
}

/** Company facts shared by every page: the published Sanity document, else the facts bundled with the build. */
export async function getAreaSettings(draft = false): Promise<AreaSettings> {
  if (contentSource === 'sanity') return (await (draft ? previewClient : client).fetch<AreaSettings | null>(AREA_SETTINGS_QUERY)) || BUNDLED_SETTINGS
  return ((await localDocs()).find((doc) => doc._type === 'areaSettings') as unknown as AreaSettings) || BUNDLED_SETTINGS
}
