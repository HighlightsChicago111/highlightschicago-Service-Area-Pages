import type {ComponentType} from 'react'
import {SiteFooter, SiteHeader} from '@/components/ds/chrome'
import {Icon} from '@/components/ds/icon'
import {genericFaqs, mergeFaqs, type Faq} from '@/lib/area/copy'
import {categoriesFor, SERVICES_URL, type Category} from '@/lib/area/library'
import {hasConfirm, telHref} from '@/lib/ds'
import {BASE_PATH, PUBLIC_SITE_ORIGIN, areaPageUrl} from '@/lib/urls'
import type {AreaCard, AreaPage, AreaSettings} from '@/types/area'
import {BuildingsBlock} from './buildings'
import {ChoosingBlock} from './choosing'
import {ClosingBlock} from './closing'
import {CompaniesBlock} from './companies'
import {DistrictsBlock} from './districts'
import {FaqBlock} from './faq'
import {AreaHead} from './head'
import {AreaHero} from './hero'
import {NearbyBlock} from './nearby'
import {PermitsBlock} from './permits'
import {ProcessBlock} from './process'
import {ScopeBlock} from './scope'
import {ServicesTabs} from './services'
import type {AreaCtx} from './types'
import {ValueBlock} from './value'
import {WhoBlock} from './who'

function ServicesBlock({ctx}: {ctx: AreaCtx}) {
  return (
    <div className="ds-wrap">
      <AreaHead id="services-title" eyebrow={`All services · ${ctx.totalServices} in ${ctx.cats.length} groups`} title={`Every electrical service we offer ${ctx.page.areaIn}`} editorial={ctx.editorial}
        lede={`${ctx.totalServices} services in eight groups. Pick a group to see its services. Each linked service has its own page with the detail.`} />
      <ServicesTabs cats={ctx.cats} />
    </div>
  )
}

type Band = 'white' | 'grey' | 'navy' | 'photo'
/** Section order and surfaces as in the approved design. */
const BLOCKS: Array<{id: string; band: Band; Block: ComponentType<{ctx: AreaCtx}>}> = [
  {id: 'services', band: 'grey', Block: ServicesBlock},
  {id: 'who', band: 'navy', Block: WhoBlock},
  {id: 'value', band: 'white', Block: ValueBlock},
  {id: 'process', band: 'grey', Block: ProcessBlock},
  {id: 'scope', band: 'white', Block: ScopeBlock},
  {id: 'choosing', band: 'grey', Block: ChoosingBlock},
  {id: 'companies', band: 'white', Block: CompaniesBlock},
  {id: 'area', band: 'navy', Block: DistrictsBlock},
  {id: 'buildings', band: 'grey', Block: BuildingsBlock},
  {id: 'nearby', band: 'white', Block: NearbyBlock},
  {id: 'permit-record', band: 'grey', Block: PermitsBlock},
  {id: 'faq', band: 'white', Block: FaqBlock},
  {id: 'closing', band: 'photo', Block: ClosingBlock},
]

function JsonLd({page, co, faqs, cats}: {page: AreaPage; co: AreaSettings; faqs: Faq[]; cats: Category[]}) {
  const site = co.site.replace(/\/$/, '')
  const business = {
    '@type': 'Electrician', '@id': `${site}/#business`, name: co.name, telephone: co.phoneSchema || co.phoneTel, url: `${site}/`,
    address: {'@type': 'PostalAddress', streetAddress: co.address?.street, addressLocality: co.address?.city, addressRegion: co.address?.region, postalCode: co.address?.zip, addressCountry: 'US'},
  }
  const place: Record<string, unknown> = {'@type': 'Place', name: `${page.area}, Chicago`, containedInPlace: {'@type': 'City', name: 'Chicago'}}
  if (page.zips?.length) place.address = {'@type': 'PostalAddress', addressLocality: 'Chicago', addressRegion: 'IL', postalCode: page.zips[0]}
  const catalogue = {
    '@type': 'OfferCatalog', name: `Electrical services ${page.areaIn}`,
    itemListElement: cats.map((cat) => ({'@type': 'OfferCatalog', name: cat.title, itemListElement: cat.items.map((item) => ({'@type': 'Offer', itemOffered: {'@type': 'Service', name: item.name, ...(item.slug ? {url: `${SERVICES_URL}${item.slug}`} : {})}}))})),
  }
  const graph = [
    business,
    {'@type': 'Service', name: `Electrical services ${page.areaIn}, Chicago`, serviceType: 'Electrician', provider: {'@id': business['@id']}, areaServed: place, hasOfferCatalog: catalogue},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: `${site}/`},
      {'@type': 'ListItem', position: 2, name: 'Service areas', item: `${PUBLIC_SITE_ORIGIN}${BASE_PATH}`},
      {'@type': 'ListItem', position: 3, name: `Electricians ${page.areaIn}`, item: areaPageUrl(page.slug)},
    ]},
    // Answers that still hold a [CONFIRM] placeholder stay out of the FAQ schema.
    {'@type': 'FAQPage', mainEntity: faqs.filter((faq) => !hasConfirm(faq.answer) && !hasConfirm(faq.question)).map((faq) => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}}))},
  ]
  const json = JSON.stringify({'@context': 'https://schema.org', '@graph': graph}).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />
}

/** The service area landing page, in the Design System v3 look. */
export function AreaLandingPage({page, co, areas, draft}: {page: AreaPage; co: AreaSettings; areas: AreaCard[]; draft: boolean}) {
  const cats = categoriesFor(page.serviceOverrides)
  const faqs = mergeFaqs((page.faq || []).map((faq, i) => ({key: faq.key || `faq-area-${i + 1}`, question: faq.question, answer: faq.answer})), genericFaqs(page, co))
  const ctx: AreaCtx = {
    page, co, areas, cats, faqs,
    totalServices: cats.reduce((sum, cat) => sum + cat.items.length, 0),
    editorial: draft || process.env.NODE_ENV !== 'production',
    tel: telHref(co.phoneTel, co.phoneDisplay),
  }

  return (
    <div className="ds">
      <a className="ds-skip" href="#main">Skip to content</a>
      <SiteHeader co={co} areas={areas} tel={ctx.tel} />
      <main id="main">
        <AreaHero ctx={ctx} />
        {BLOCKS.map(({id, band, Block}) => (
          <section className={`ds-band ds-band--${band} ar-band--${id}`} id={id} aria-labelledby={`${id}-title`} key={id}>
            <Block ctx={ctx} />
          </section>
        ))}
      </main>
      <SiteFooter co={co} tel={ctx.tel} />
      <div className="ds-callbar">
        <a className="ds-btn ds-btn--primary" href={ctx.tel}><Icon name="phone" size={18} /><span>Call</span></a>
        <a className="ds-btn ds-btn--secondary" href="#quote"><span>Book a walkthrough</span></a>
      </div>
      <JsonLd page={page} co={co} faqs={faqs} cats={cats} />
    </div>
  )
}
