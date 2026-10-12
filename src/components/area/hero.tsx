/* eslint-disable @next/next/no-img-element -- Full-bleed hero photo; native img keeps it crawlable and lets it load eagerly. */
import Link from 'next/link'
import {Button, Copy, Eyebrow, GoogleG, Stars} from '@/components/ds/atoms'
import {AreaQuoteForm} from '@/components/ds/area-quote-form'
import {Icon} from '@/components/ds/icon'
import {capitalise} from '@/lib/area/copy'
import {focus, pad2, PHOTOS, type Photo} from '@/lib/ds'
import type {AreaCtx} from './types'

/** Hero: photo band, credentials, call and book buttons, "On this page" and the request form. */
export function AreaHero({ctx}: {ctx: AreaCtx}) {
  const {page, co, editorial, tel, totalServices} = ctx
  const hl = page.permits?.highlights
  const permitLine = hl?.count ? `${hl.count} City permits ${page.areaIn} since ${hl.firstYear || '2012'}` : `${co.permitsCitywide} City permits across Chicago`
  const custom = page.teamPhoto?.resolvedUrl
  const hero: Photo = custom ? {src: custom, alt: page.teamPhoto?.alt || `Highlights Chicago ${page.areaIn}`} : PHOTOS.hero
  const toc = [
    ['services', `All ${totalServices} services`], ['who', "Who you're calling"], ['value', 'What clients say'], ['process', 'What happens when you call'],
    ['scope', 'What changes the price'], ['choosing', 'How to choose an electrician'], ['companies', 'Kinds of electrical company'],
    ['area', `${capitalise(page.areaThe)}, district by district`], ['buildings', 'Your building type'], ['faq', 'Questions'],
  ]

  return (
    <header className="ds-hero" id="top">
      <img className="ds-hero-bg" src={hero.src} alt={hero.alt} loading="eager" fetchPriority="high" decoding="async" style={focus(hero)} />
      <div className="ds-hero-scrim" aria-hidden="true" />
      <div className="ds-wrap ds-hero-grid">
        <div className="ds-hero-copy">
          <nav className="ds-crumbs" aria-label="Breadcrumb">
            <ol>
              <li><a href={co.site}>Home</a></li>
              <li><Link href="/">Service areas</Link></li>
              <li aria-current="page">Electricians {page.areaIn}</li>
            </ol>
          </nav>
          {page.eyebrow && <Eyebrow className="ds-eyebrow--light">{page.eyebrow}</Eyebrow>}
          <h1 className="ds-h1">{page.h1 || `Electricians ${page.areaIn}, Chicago`}</h1>
          <Copy value={page.heroLede} show={editorial} className="ds-hero-lede" />
          <ul className="ds-trust-chips" aria-label="Credentials">
            <li><Icon name="shieldCheck" size={16} />City of Chicago Electrical Contractor {co.licence}</li>
            <li><Icon name="users" size={16} />Family-owned, founder-led</li>
            <li><Icon name="fileCheck" size={16} />{permitLine}</li>
            <li className="ds-trust-chip--google"><GoogleG size={20} /><b>{co.googleRating}</b><span className="ds-out">/5</span><Stars size={14} /><span>{co.googleReviews} Google reviews</span></li>
          </ul>
          <div className="ds-cta-row">
            <Button href={tel} tone="light" icon="phone">Call {co.phoneDisplay}</Button>
            <Button href="#quote" tone="outline-light" trailing="arrowRight">Book a walkthrough</Button>
          </div>
          <nav className="ar-toc" aria-label="On this page">
            <div className="ar-toc-head"><p>On this page</p><span>{toc.length} sections</span></div>
            <ol>{toc.map(([id, label], index) => <li key={id}><a href={`#${id}`}><span>{pad2(index + 1)}</span>{label}</a></li>)}</ol>
          </nav>
        </div>
        <AreaQuoteForm
          area={page.area}
          areaIn={page.areaIn}
          districts={page.formDistricts?.length ? page.formDistricts : (page.districts || []).map((d) => d.name)}
          buildings={page.formBuildingTypes?.length ? page.formBuildingTypes : (page.buildings || []).map((b) => b.title)}
          addressPlaceholder={page.addressPlaceholder}
          rulesQuestion={page.formRulesQuestion}
        />
      </div>
      {hero.illustrative && <span className="ds-pill-caption ds-hero-pill">Illustrative photo</span>}
    </header>
  )
}
