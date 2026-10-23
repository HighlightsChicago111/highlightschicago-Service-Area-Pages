/* eslint-disable @next/next/no-img-element -- Hero and card photos are plain images from /public or Sanity. */
import type {Metadata} from 'next'
import Link from 'next/link'
import {draftMode} from 'next/headers'
import {SiteFooter, SiteHeader} from '@/components/ds/chrome'
import {DisableDraftMode} from '@/components/disable-draft-mode'
import {Icon} from '@/components/ds/icon'
import {cardImageFor, cardRegionFor, cardSummaryFor} from '@/lib/area/card-photos'
import {isChicago} from '@/lib/area/copy'
import {getAreaCards, getAreaSettings} from '@/lib/content'
import {PHOTOS, telHref} from '@/lib/ds'
import {BASE_PATH, PUBLIC_SITE_ORIGIN, absoluteUrl} from '@/lib/urls'
import type {AreaCard} from '@/types/area'
import {ReviewRatings} from '@/components/ds/review-ratings'

export const revalidate = 60
const TITLE = 'Electrician service areas in Chicago'
const DESCRIPTION = 'The Chicago neighbourhoods and nearby suburbs Highlights Chicago electricians serve, each with its own page.'
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {canonical: `${PUBLIC_SITE_ORIGIN}${BASE_PATH}`},
  openGraph: {
    type: 'website', locale: 'en_US', siteName: 'Highlights Chicago', url: `${PUBLIC_SITE_ORIGIN}${BASE_PATH}`, title: TITLE, description: DESCRIPTION,
    images: [{url: absoluteUrl(PHOTOS.van.src), alt: PHOTOS.van.alt}],
  },
  twitter: {card: 'summary_large_image'},
}

const PIN = <svg className="ar-cc-pin" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>

const regionOf = (card: AreaCard) => cardRegionFor(card) || (isChicago(card) ? 'Chicago' : `${card.city}, IL`)

/** /service-areas: photo hero with the area count, then one dark card per published area page. */
export default async function ServiceAreasPage() {
  const draft = (await draftMode()).isEnabled
  const [areas, co] = await Promise.all([getAreaCards(draft), getAreaSettings(draft)])
  const tel = telHref(co.phoneTel, co.phoneDisplay)
  const cards = areas.map((card) => ({...card, cardImage: cardImageFor(card), cardSummary: cardSummaryFor(card)}))
  const credited = cards.filter((card) => card.cardImage?.url && card.cardImage.credit)

  return (
    <div className="ds">
      {draft && <DisableDraftMode />}
      <SiteHeader co={co} tel={tel} current="areas" />
      <main id="main">
        <section className="ar-ch" aria-labelledby="areas-hero-title">
          <img className="ar-ch-bg" src={PHOTOS.van.src} alt="" fetchPriority="high" decoding="async" />
          <div className="ds-wrap ar-ch-inner">
            <nav className="ar-ch-crumbs" aria-label="Breadcrumb">
              <ol><li><a href={co.site || PUBLIC_SITE_ORIGIN}>Home</a></li><li aria-current="page">Service areas</li></ol>
            </nav>
            <div className="ar-ch-grid">
              <div>
                <p className="ar-ch-kicker">Licensed Chicago electricians</p>
                <ReviewRatings googleRating={co.googleRating} googleCount={co.googleReviews} />
                <h1 id="areas-hero-title">Service areas across Chicago and nearby suburbs</h1>
                <p className="ar-ch-lede">From our shop at {co.address?.street || '5766 N Lincoln Ave'}, Highlights Chicago electricians work across the North and Northwest Sides and the suburbs around the city. Find your area below.</p>
                <div className="ar-ch-actions">
                  <a href="#service-areas-title">See service areas</a>
                  <a href={`${PUBLIC_SITE_ORIGIN}/contact-us`}>Contact us</a>
                </div>
              </div>
              <div className="ar-ch-panel">
                <span>Service areas</span>
                <strong>{areas.length}</strong>
                <p>{areas.length === 1 ? 'Area' : 'Chicago neighbourhoods and nearby suburbs'} with a page of its own</p>
                <a href={tel}>Talk with an electrician <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </div>
        </section>

        <section className="ar-cd" aria-labelledby="service-areas-title">
          <div className="ds-wrap">
            <div className="ar-cd-head">
              <div><p className="ar-cd-kicker">Where we work</p><h2 id="service-areas-title">Find your area</h2></div>
              <p>Our licensed electricians cover every area below, for the full range of electrical services, from panel upgrades to lighting and EV chargers.</p>
            </div>
            {areas.length === 0
              ? <p className="ar-cd-empty">No service area pages are published yet. Publish one in the Studio and it appears here within a minute.</p>
              : <ul className="ar-cc-grid">
                {cards.map((card) => (
                  <li key={card.slug}>
                    <Link className="ar-cc" href={`/${card.slug}`} aria-label={`Electricians ${card.areaIn}`}>
                      <span className={card.cardImage?.url ? 'ar-cc-media' : 'ar-cc-media ar-cc-media--empty'}>
                        {card.cardImage?.url ? <img src={card.cardImage.url} alt={card.cardImage.alt || ''} loading="lazy" decoding="async" /> : <span aria-hidden="true">{card.area.charAt(0)}</span>}
                      </span>
                      <span className="ar-cc-body">
                        <span className="ar-cc-label">Service area</span>
                        <strong>{card.area}</strong>
                        <span className="ar-cc-desc">{card.cardSummary}</span>
                        <span className="ar-cc-region">{PIN}{regionOf(card)}<span className="ar-cc-arrow"><Icon name="arrowUpRight" size={18} /></span></span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>}
            {credited.length > 0 && <details className="ar-cd-credits">
              <summary>Photo credits</summary>
              <ul>{credited.map((card) => <li key={card.slug}>{card.area}: {card.cardImage?.creditUrl ? <a href={card.cardImage.creditUrl}>{card.cardImage.credit}</a> : card.cardImage?.credit}</li>)}</ul>
            </details>}
          </div>
        </section>

        <section className="ar-ct" aria-label="Why Highlights Chicago">
          <div className="ds-wrap">
            <p>Why Highlights Chicago</p>
            <div><strong>12+</strong><span>Years serving Chicagoland</span></div>
            <div><strong>{co.permitsCitywide}</strong><span>City of Chicago permits since {co.permitsSince}</span></div>
            <div><strong>{co.googleRating}</strong><span>From {co.googleReviews} Google reviews</span></div>
            <a href={`${PUBLIC_SITE_ORIGIN}/about-us`}>Meet the company <span aria-hidden="true">→</span></a>
          </div>
        </section>
      </main>
      <SiteFooter co={co} tel={tel} />
    </div>
  )
}
