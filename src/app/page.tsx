import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {AreaCollection} from '@/components/area/area-collection'
import {getAreaCards} from '@/lib/content'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Electricians across Chicago, by neighbourhood',
  description: 'Highlights Chicago service areas: the buildings, districts and permit record of each Chicago neighbourhood we work in, and every electrical service we offer there.',
  // Test project: keep it out of search until the pages go live on the main domain.
  robots: {index: false, follow: false},
}

export default async function ServiceAreasPage() {
  const draft = (await draftMode()).isEnabled
  const areas = await getAreaCards(draft)
  return (
    <div className="collection-page">
      {draft && <DisableDraftMode />}
      <CollectionHeader />
      <main>
        <section className="collection-hero">
          <div className="collection-wrap area-hero">
            <p className="collection-hero-kicker">Licensed Chicago electricians</p>
            <h1>Electricians in your part of Chicago</h1>
            <p>Lofts, high-rises, two-flats and bungalows each change the job. Pick your neighbourhood to see its buildings, its permit record and every service we offer there.</p>
            <div className="collection-hero-actions">
              <a href="#area-directory-title">Find your area</a>
              <a href="tel:+17732623333">Call (773) 262-3333</a>
            </div>
          </div>
        </section>
        <AreaCollection areas={areas} />
      </main>
      <CollectionFooter />
    </div>
  )
}
