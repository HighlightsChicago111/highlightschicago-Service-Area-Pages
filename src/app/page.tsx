/* eslint-disable @next/next/no-img-element -- Full-bleed hero photo from /public. */
import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {notFound} from 'next/navigation'
import {Button, Eyebrow, GoogleG, Stars} from '@/components/ds/atoms'
import {SiteFooter, SiteHeader} from '@/components/ds/chrome'
import {Icon} from '@/components/ds/icon'
import {AreaCollection} from '@/components/area/area-collection'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {getAreaCards, getAreaSettings} from '@/lib/content'
import {PHOTOS, telHref} from '@/lib/ds'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Electricians across Chicago, by neighbourhood',
  description: 'Highlights Chicago service areas: the buildings, districts and permit record of each Chicago neighbourhood we work in, and every electrical service we offer there.',
  // Test project: keep it out of search until the pages go live on the main domain.
  robots: {index: false, follow: false},
}

export default async function ServiceAreasPage() {
  const draft = (await draftMode()).isEnabled
  const [areas, co] = await Promise.all([getAreaCards(draft), getAreaSettings(draft)])
  if (!co) notFound()
  const tel = telHref(co.phoneTel, co.phoneDisplay)

  return (
    <div className="ds">
      {draft && <DisableDraftMode />}
      <a className="ds-skip" href="#main">Skip to content</a>
      <SiteHeader co={co} areas={areas} tel={tel} />
      <main id="main">
        <header className="ds-hero ar-coll-hero">
          <img className="ds-hero-bg" src={PHOTOS.van.src} alt="" loading="eager" fetchPriority="high" decoding="async" />
          <div className="ds-hero-scrim" aria-hidden="true" />
          <div className="ds-wrap ar-coll-hero-copy">
            <Eyebrow className="ds-eyebrow--light">Service areas · Chicago and nearby suburbs</Eyebrow>
            <h1 className="ds-h1">Electricians in your part of Chicago</h1>
            <p className="ds-hero-lede">Lofts, high-rises, two-flats and bungalows each change the job. Pick your neighbourhood to see its buildings, its permit record and every service we offer there.</p>
            <ul className="ds-trust-chips" aria-label="Credentials">
              <li><Icon name="shieldCheck" size={16} />City of Chicago Electrical Contractor {co.licence}</li>
              <li><Icon name="users" size={16} />Family-owned, founder-led</li>
              <li className="ds-trust-chip--google"><GoogleG size={20} /><b>{co.googleRating}</b><span className="ds-out">/5</span><Stars size={14} /><span>{co.googleReviews} Google reviews</span></li>
            </ul>
            <div className="ds-cta-row">
              <Button href="#areas" tone="light" trailing="arrowRight">Find your area</Button>
              <Button href={tel} tone="outline-light" icon="phone">Call {co.phoneDisplay}</Button>
            </div>
          </div>
        </header>
        <section className="ds-band ds-band--grey" id="areas" aria-labelledby="areas-title">
          <div className="ds-wrap">
            <div className="ar-head ar-head--side">
              <div className="ar-head-main"><Eyebrow>All service areas · {areas.length}</Eyebrow><h2 className="ds-h2" id="areas-title">Find your neighbourhood</h2></div>
              <p className="ds-lede ar-head-lede">Each page covers the buildings, districts and permit record of one part of Chicago, and every service we offer there.</p>
            </div>
            <AreaCollection areas={areas} />
          </div>
        </section>
      </main>
      <SiteFooter co={co} tel={tel} />
      <div className="ds-callbar">
        <a className="ds-btn ds-btn--primary" href={tel}><Icon name="phone" size={18} /><span>Call</span></a>
        <a className="ds-btn ds-btn--secondary" href="#areas"><span>Find your area</span></a>
      </div>
    </div>
  )
}
