import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {AreaLandingPage} from '@/components/area/area-page'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {defaultH1} from '@/lib/area/copy'
import {getAreaCards, getAreaPage} from '@/lib/content'
import {cardImageFor} from '@/lib/area/card-photos'
import {absoluteUrl, areaPageUrl} from '@/lib/urls'

type Props = {params: Promise<{areaSlug: string}>}

export const revalidate = 60

export async function generateStaticParams() {
  return (await getAreaCards()).map((card) => ({areaSlug: card.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {areaSlug} = await params
  const {page, areas} = await getAreaPage(areaSlug, (await draftMode()).isEnabled)
  if (!page) return {}
  // The root layout adds "| Highlights Chicago"; strip it from a stored full title.
  const title = (page.title || defaultH1(page)).replace(/\s*\|\s*Highlights Chicago\s*$/i, '')
  const url = areaPageUrl(page.slug)
  const card = areas.find((area) => area.slug === page.slug)
  const image = card && cardImageFor(card)
  return {
    title,
    description: page.metaDescription,
    alternates: {canonical: url},
    openGraph: {
      type: 'website', locale: 'en_US', siteName: 'Highlights Chicago', url, title, description: page.metaDescription,
      images: image?.url ? [{url: absoluteUrl(image.url), alt: image.alt}] : undefined,
    },
    twitter: {card: image?.url ? 'summary_large_image' : 'summary'},
  }
}

export default async function AreaPageRoute({params}: Props) {
  const {areaSlug} = await params
  const draft = (await draftMode()).isEnabled
  const {page, settings, areas} = await getAreaPage(areaSlug, draft)
  if (!page || !settings) notFound()
  return <>{draft && <DisableDraftMode />}<AreaLandingPage page={page} co={settings} areas={areas} draft={draft} /></>
}
