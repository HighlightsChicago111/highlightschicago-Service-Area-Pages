import type {Metadata} from 'next'
import Link from 'next/link'
import {draftMode} from 'next/headers'
import {SiteFooter, SiteHeader} from '@/components/ds/chrome'
import {Icon} from '@/components/ds/icon'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {getAreaCards, getAreaSettings} from '@/lib/content'
import {telHref} from '@/lib/ds'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Service areas',
  description: 'Highlights Chicago service area pages.',
  // Test project: keep it out of search until the pages go live on the main domain.
  robots: {index: false, follow: false},
}

/** Plain list of published service area pages, one card each. The designed collection page comes later. */
export default async function ServiceAreasPage() {
  const draft = (await draftMode()).isEnabled
  const [areas, co] = await Promise.all([getAreaCards(draft), getAreaSettings(draft)])
  const tel = telHref(co.phoneTel, co.phoneDisplay)

  return (
    <div className="ds">
      {draft && <DisableDraftMode />}
      <SiteHeader co={co} areas={areas} tel={tel} />
      <main id="main" className="ds-band ds-band--grey">
        <div className="ds-wrap ar-coll">
          <h1 className="ds-h2">Service areas</h1>
          {areas.length === 0
            ? <p className="ar-coll-empty">No service area pages are published yet. Publish one in the Studio and it appears here within a minute.</p>
            : <ul className="ar-coll-grid">
              {areas.map((card) => (
                <li key={card.slug}>
                  <Link className="ar-coll-card" href={`/${card.slug}`}>
                    <h2 className="ar-card-title">{card.area}</h2>
                    {card.eyebrow && <p className="ar-coll-desc">{card.eyebrow}</p>}
                    <span className="ar-coll-link">View page<Icon name="arrowRight" size={16} /></span>
                  </Link>
                </li>
              ))}
            </ul>}
        </div>
      </main>
      <SiteFooter co={co} tel={tel} />
    </div>
  )
}
