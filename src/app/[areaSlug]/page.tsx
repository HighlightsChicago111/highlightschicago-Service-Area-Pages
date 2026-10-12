import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {AreaLandingPage} from '@/components/area/area-page'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {defaultH1} from '@/lib/area/copy'
import {getAreaCards, getAreaPage} from '@/lib/content'
import {areaPageUrl} from '@/lib/urls'

type Props = {params: Promise<{areaSlug: string}>}

export const revalidate = 60

export async function generateStaticParams() {
  return (await getAreaCards()).map((card) => ({areaSlug: card.slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {areaSlug} = await params
  const {page} = await getAreaPage(areaSlug, (await draftMode()).isEnabled)
  if (!page) return {}
  return {
    // The root layout adds "| Highlights Chicago"; strip it from a stored full title.
    title: (page.title || defaultH1(page)).replace(/\s*\|\s*Highlights Chicago\s*$/i, ''),
    description: page.metaDescription,
    alternates: {canonical: areaPageUrl(page.slug)},
    // Test project: keep it out of search until the pages go live on the main domain.
    robots: {index: false, follow: false},
  }
}

export default async function AreaPageRoute({params}: Props) {
  const {areaSlug} = await params
  const draft = (await draftMode()).isEnabled
  const {page, settings, areas} = await getAreaPage(areaSlug, draft)
  if (!page || !settings) notFound()
  return <>{draft && <DisableDraftMode />}<AreaLandingPage page={page} co={settings} areas={areas} draft={draft} /></>
}
