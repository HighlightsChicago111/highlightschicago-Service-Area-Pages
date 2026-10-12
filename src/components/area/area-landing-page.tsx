/* eslint-disable @next/next/no-img-element -- Team photos can be local or Sanity CDN URLs and must stay crawlable. */
import {Fragment, type CSSProperties, type ReactNode} from 'react'
import Link from 'next/link'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'
import {categoriesFor, CATEGORY_ICON, CATEGORY_SHORT, SERVICE_ICON, SERVICES_URL, type Category} from '@/lib/area/library'
import {BASE_PATH, PUBLIC_SITE_ORIGIN, areaPageUrl} from '@/lib/urls'
import type {AreaCard, AreaPage, AreaSettings} from '@/types/area'
import {AreaBehaviours} from './area-behaviours'
import {AreaLeadForm} from './area-lead-form'
import {AreaMap} from './area-map'
import {Icon, Illustration} from './art'
import {capitalise, hasConfirm, Ph, T} from './text'

const BRAND_STYLE = {
  '--brand': '#151f2a', '--brand-dk': '#0f171f', '--brand-lt': '#f4f6f7', '--brand-2': '#82aa24',
  '--accent': '#9ec837', '--accent-dk': '#82aa24', '--footer': '#151f2a',
} as CSSProperties

const DEFAULT_MIX_NOTES: Record<string, string> = {
  'Low voltage, data and communications': 'Cabling for offices, security and AV.',
  'Interior build-outs and alterations': 'Spaces being refitted for new owners or tenants.',
  Lighting: 'The biggest single category of hands-on electrical work.',
  'Outlets and receptacles': 'Kitchen, office and unit remodels.',
  'Work inside a specific unit or condo': 'Condo and apartment owners are a large share of the work.',
  'Fire alarm': 'Larger residential and commercial buildings.',
  'Electrical service': 'New and upgraded services.',
  Panels: 'Panel replacements and upgrades.',
  Restaurants: 'Restaurant fit-outs and changes.',
  'EV charging': 'Chargers added at homes and in garages.',
  Solar: 'Rooftop solar and related electrical work.',
  Generators: 'Standby generators.',
  Signs: 'Business signage.',
}

const DEFAULT_READY = [
  "Your address, and the building management office's contact if there is one",
  'Any contractor requirements: certificate of insurance limits, elevator booking, working hours',
  'A photo of your electrical panel with the door open',
  "Photos of the room or ceiling, and of any fixture you've bought",
  'For a condo: whether the board needs to approve the work',
]

type Faq = {key: string; question: string; answer: string}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** "2026-10-12" -> "October 2026" (long) or "Oct 2026" (short). */
export function monthYear(iso: string, short = false): string {
  const [year, month] = iso.split('-').map(Number)
  const name = MONTHS[(month || 1) - 1]
  return `${short ? name.slice(0, 3) : name} ${year}`
}

const PERMIT_TYPE_WORDS: Record<string, string> = {
  'new construction': 'new construction',
  'renovation/alteration': 'renovations and alterations',
  'express permit program': 'through the Express Permit Program',
  'easy permit process': 'through the Easy Permit Process',
  signs: 'signs',
}
const permitTypeWords = (type: string) => PERMIT_TYPE_WORDS[type.toLowerCase()] || type.toLowerCase()
const andList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] || '')

// Where the seven generic FAQs sit among the area's own (A = area, G = generic), as on the approved page.
const FAQ_PATTERN = 'AAAGGAGGGAGG'
export function mergeFaqs(area: Faq[], generic: Faq[]): Faq[] {
  const queues = {A: [...area], G: [...generic]}
  const merged: Faq[] = []
  for (const slot of FAQ_PATTERN) {
    const next = queues[slot as 'A' | 'G'].shift()
    if (next) merged.push(next)
  }
  return [...merged, ...queues.A, ...queues.G]
}

export function genericFaqs(page: AreaPage, co: AreaSettings): Faq[] {
  return [
    {key: 'faq-handyman', question: 'Can a handyman do electrical work in Chicago?', answer: "Not work that needs a permit. Chicago electrical permits are issued to registered electrical contractors, so a handyman can't pull one. For anything beyond non-electrical tasks, use a registered contractor."},
    {key: 'faq-license', question: "How do I check an electrician's licence in Chicago?", answer: `Ask for their City of Chicago electrical contractor registration and check it with the Department of Buildings. Then search their name in the City's public building permits data to see the work they've actually done. Ours is ${co.licence}.`},
    {key: 'faq-estimate', question: 'Do you charge for estimates?', answer: 'No. Estimates are free, and you get the scope in writing before any work starts.'},
    {key: 'faq-weekend', question: 'Do you work weekends or handle emergencies?', answer: `Our office hours are ${co.officeHours || 'Monday to Friday, 8am to 5pm'}. Reviewers describe same-day Saturday visits and emergency calls where we made the hazard safe, then came back with parts. [CONFIRM: emergency and weekend availability to state here.]`},
    {key: 'faq-owner', question: 'Will I deal with the owner?', answer: `Usually, yes. Boz, the founder, typically does the walkthrough and writes the quote, and more than a third of the ${co.reviewStats?.total ? `${co.reviewStats.total} ` : ''}reviews we analysed mention him by name.`},
    {key: 'faq-union', question: 'Are your electricians union?', answer: '[CONFIRM: answer, since some larger buildings require union labour for certain work.]'},
    {key: 'faq-cost', question: `How much does an electrician cost ${page.areaIn}?`, answer: "It depends on the scope and the building: the access, the construction, the permit route and the working hours. We don't quote an hourly rate for that reason. The walkthrough is free and the quote is written."},
  ]
}

function Section({id, tint, h2, lede, children}: {id: string; tint: boolean; h2: ReactNode; lede?: ReactNode; children: ReactNode}) {
  return (
    <section className={`wrap ${tint ? 'nx-bg-tint' : 'nx-bg-plain'}`} id={id}>
      <h2>{h2}</h2>
      {lede && <p className="lede narrow">{lede}</p>}
      {children}
    </section>
  )
}

function Carousel({children, className = '', label, trackClass = 'nx-gen-track'}: {children: ReactNode; className?: string; label: string; trackClass?: string}) {
  return <div className={`nx-car ${className}`.trim()} role="region" aria-label={label}><div className={`nx-car-track ${trackClass}`} tabIndex={0}>{children}</div></div>
}

function Services({cats}: {cats: Category[]}) {
  return (
    <div className="nx-vtabs" id="svc-tabs">
      <div className="nx-vtabs-list" role="tablist" aria-orientation="vertical" aria-label="Service categories">
        {cats.map((cat, i) => (
          <button type="button" role="tab" id={`${cat.id}-tab`} aria-controls={cat.id} aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1} title={cat.title} key={cat.id}>
            <span className="nx-tic"><Icon name={CATEGORY_ICON[cat.id]} /></span><span className="t">{CATEGORY_SHORT[cat.id]}</span><span className="n">{cat.items.length}</span>
          </button>
        ))}
      </div>
      <div className="nx-vtabs-panels">
        {cats.map((cat) => (
          <section className="nx-cat" id={cat.id} role="tabpanel" aria-labelledby={`${cat.id}-tab`} key={cat.id}>
            <h3><span className="nx-h3ic"><Icon name={CATEGORY_ICON[cat.id]} /></span>{cat.title}</h3>
            <p className="nx-sub">{cat.intro}</p>
            <div className="nx-svc-nav"><span>{cat.items.length} services · swipe</span></div>
            <ul className="nx-svc">
              {cat.items.map((item) => (
                <li key={item.name}>
                  <span className="nx-sic"><Icon name={SERVICE_ICON[item.name]} /></span>
                  <div><h4>{item.slug ? <a href={`${SERVICES_URL}${item.slug}`}>{item.name}</a> : <span className="nx-nolink">{item.name}</span>}</h4><p>{item.line}</p></div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

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
    {'@type': 'FAQPage', mainEntity: faqs.filter((faq) => !hasConfirm(faq.answer)).map((faq) => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}}))},
  ]
  const json = JSON.stringify({'@context': 'https://schema.org', '@graph': graph}).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />
}

export function AreaLandingPage({page, co, areas}: {page: AreaPage; co: AreaSettings; areas: AreaCard[]}) {
  const {area, areaThe: the, areaIn: AIN} = page
  const The = capitalise(the)
  const cats = categoriesFor(page.serviceOverrides)
  const total = cats.reduce((sum, cat) => sum + cat.items.length, 0)
  const hl = page.permits?.highlights
  const recN = hl?.count || 0
  const recSince = hl?.firstYear || '2012'
  const permLine = recN ? `${recN} City permits ${AIN} since ${recSince}` : `${co.permitsCitywide} City permits across Chicago`
  const stats = co.reviewStats
  const nRev = stats?.total || 0
  const pct = (value: number) => (nRev ? Math.round((value * 100) / nRev) : 0)
  const faqs = mergeFaqs((page.faq || []).map((faq, i) => ({key: faq.key || `faq-area-${i + 1}`, question: faq.question, answer: faq.answer})), genericFaqs(page, co))
  const ready = page.ctaReady?.length ? page.ctaReady : DEFAULT_READY
  const team = page.teamPhoto?.resolvedUrl ? page.teamPhoto : null
  const mixNotes = new Map((page.mixNotes || []).map((item) => [item.label, item.note]))
  const mix = (page.permits?.mix || []).filter((item) => item.label !== 'Signs').slice(0, 9)
  const areaLinks = new Map(areas.filter((item) => item.slug !== page.slug).map((item) => [item.area.toLowerCase(), item.slug]))
  const toc = [
    ['services', `All ${total} services`], ['who', "Who you're calling"], ['value', 'What clients say'], ['process', 'What happens when you call'],
    ['scope', 'What changes the price'], ['choosing', 'How to choose an electrician'], ['companies', 'Kinds of electrical company'],
    ['area', `${The}, district by district`], ['buildings', 'Your building type'], ['faq', 'Questions'],
  ]
  const steps: Array<[string, string, ReactNode]> = [
    ['call', 'The office books you in', <>You call or send the form. The office arranges the walkthrough. <Ph>typical wait for a walkthrough</Ph></>],
    ['walk', 'The founder walks the space', "Boz usually comes himself, looks at the panel, the ceilings and the building's rules, and asks what you actually want."],
    ['estimate', 'A written estimate', 'Reviewers describe estimates arriving the same day or the next. For an association, it comes as a proposal the board can read.'],
    ['paperwork', 'Building paperwork and permit', 'Where a building asks for it, a certificate of insurance goes to management, and we pull the City permit where one is needed.'],
    ['install', 'Install day', 'A named crew arrives on time, protects floors and furniture, and checks heights and positions with you before anything is fixed in place.'],
    ['inspect', 'Inspection and closeout', 'The City inspects permitted work and we close the permit. Then we follow up to make sure everything is working.'],
  ]
  const companies: Array<[string, string, string, string, string, boolean]> = [
    ['co-family', 'Family-owned local contractor', 'The owner, or someone who works directly with them', 'A written quote for your actual scope', 'Unit, house, restaurant and small commercial work where you want one accountable person', true],
    ['co-franchise', 'National franchise brand', 'A call centre, then the technician dispatched', 'Often a flat-rate price book, sometimes with membership plans', 'Standard repairs where speed of dispatch matters most', false],
    ['co-leadgen', 'Lead-generation marketplace', 'A website that passes your request to several contractors', 'Whatever each contractor who calls back quotes', "You want several quotes fast and don't mind not choosing who calls", false],
    ['co-commercial', 'Large commercial or union contractor', 'A project manager or estimator', 'Bids against drawings and specifications', 'Tower base-building work and large office floors.', false],
    ['co-handyman', 'Handyman', 'The handyman', 'Hourly or per task', "Non-electrical work. A handyman can't pull a Chicago electrical permit.", false],
  ]
  const criteria: Array<[string, string, string, string]> = [
    ['City of Chicago registration', 'Only a registered electrical contractor can pull a Chicago electrical permit. Building managers ask for it before they let anyone in.', 'The City of Chicago Department of Buildings contractor lookup', `${co.licence}${co.licence2 ? `, also ${co.licence2}` : ''}`],
    ['Permit record in this area', 'Permits are public. They show the work actually done here, not the work claimed.', "Search the contractor's name in the City's building permits data", recN ? `${recN} permits ${AIN} since ${recSince}; ${co.permitsCitywide} citywide since ${co.permitsSince}` : `${co.permitsCitywide} citywide since ${co.permitsSince}`],
    ['Experience with your building type', page.choosingBuildingWhy || 'Different building types are different jobs: how wire is run, who approves the work and what the panel can take all change.', 'Ask for examples in buildings like yours', page.choosingBuildingAnswer || ''],
    ['Building paperwork', page.choosingPaperworkWhy || 'Managed buildings often want a certificate of insurance before work is scheduled.', 'Ask how fast they issue a certificate of insurance', 'Reviewers describe certificates issued the same day they asked'],
    ['Who you deal with', 'Someone has to own the quote, the schedule and the result.', "Ask who walks the job, who quotes it and who's on site", `The founder usually does the walkthrough; ${stats?.owner ?? 0} of ${nRev} reviews we analysed name him`],
    ['How the price is set', 'Flat-rate menus, hourly billing and written scope quotes produce very different bills for the same job.', 'Ask for the scope in writing before work starts', 'Free estimate, written scope, no flat-rate book'],
    ['Reviews: volume, recency, detail', 'Specific reviews about buildings like yours tell you more than a star average.', 'Read the newest reviews, not the top ones', `${co.googleRating} from ${co.googleReviews} Google reviews`],
  ]

  const folds: Array<[string, (tint: boolean) => ReactNode]> = [
    ['services', (tint) => (
      <Section id="services" tint={tint} h2={`Every electrical service we offer ${AIN}`} lede={`${total} services in eight groups. Pick a group to see its services. Each linked service has its own page with the detail.`}>
        <Services cats={cats} />
      </Section>
    )],
    ['who', (tint) => (
      <Section id="who" tint={tint} h2="Who you're actually calling" lede="A family-owned Chicago electrical contracting company on N Lincoln Ave, run by its founder, with salaried electricians in named crews. Nobody sells your phone number on, and nobody earns a commission on what you're quoted.">
        <div className="nx-car nx-car-who nx-car-bar" role="region" aria-label="Who you're calling">
          <div className="nx-car-track nx-gen-track nx-who-track" tabIndex={0}>
            <div className="nx-stat nx-stat-ill"><div className="nx-stat-art"><Illustration name="who-founder" id="ill-60" /></div><b>{co.founderShort}</b><span>{co.founderLine} {co.founderConfirm && <Ph>{co.founderConfirm}</Ph>}</span></div>
            <div className="nx-stat nx-stat-ill"><div className="nx-stat-art"><Illustration name="who-licence" id="ill-61" /></div><b>{co.licence}</b><span>City of Chicago Electrical Contractor{co.licence2 ? `, also ${co.licence2}` : ''}</span></div>
            <div className="nx-stat nx-stat-ill"><div className="nx-stat-art"><Illustration name="who-bbb" id="ill-62" /></div><b>A+</b><span>{co.bbb}</span></div>
            <div className="nx-stat nx-stat-ill"><div className="nx-stat-art"><Illustration name="who-permits" id="ill-63" /></div><b>{co.permitsCitywide}</b><span>City permits on record since {co.permitsSince}, {co.permitsRank}</span></div>
            <div className="nx-block nx-card"><h3>Why family-owned matters on a {area} job</h3><ul className="nx-ticks"><li>You talk to the person who owns the outcome, not a dispatcher reading from a price book.</li><li>The office schedules you, and reviewers name the office staff who did it.</li><li>The crews are salaried and reviewers name them. The same electricians come back for the next job.</li><li>Your request isn&apos;t sold to three other contractors.</li></ul></div>
            <div className="nx-block nx-card"><h3>How we work</h3><dl className="nx-warranty"><dt>Diagnose first, replace second</dt><dd>The fault is rarely where the symptom is. We find it before anyone quotes equipment.</dd><dt>We pull and close the permit</dt><dd>In-house, including the Express Permit route where it fits.</dd><dt>Scope pricing</dt><dd>No flat-rate book, no commissioned adviser, no membership plan. The quote is written against the actual scope.</dd></dl></div>
          </div>
          <div className="nx-bar" aria-hidden="true"><span /></div>
        </div>
      </Section>
    )],
    ['value', (tint) => (
      <Section id="value" tint={tint} h2="What clients say about value" lede={`We don't publish prices, because they depend on the scope. Here is what ${nRev} of our ${co.googleReviews} Google reviews say instead, counted by what reviewers chose to mention.`}>
        <div className="nx-car nx-car-stats nx-car-bar" role="region" aria-label="What reviewers mention">
          <div className="nx-car-track nx-gen-track nx-stat-track" tabIndex={0}>
            {stats && ([
              [stats.owner, 'name the owner, or say they dealt with him directly'],
              [stats.punctual, 'mention punctuality'],
              [stats.fairPrice, 'call the price fair, reasonable or competitive'],
              [stats.clean, 'mention cleanliness or protecting furniture and floors'],
            ] as Array<[number, string]>).map(([value, label]) => <div className="nx-stat" key={label}><b>{value}</b><span>{label} ({pct(value)}%)</span></div>)}
          </div>
          <div className="nx-bar" aria-hidden="true"><span /></div>
        </div>
        <p className="small muted section-note">Counted by keyword matching across the {nRev} reviews Google returns for Highlights (of {co.googleReviews}), so the numbers are approximate. {stats?.fiveStar ?? 0} of those {nRev} reviews are five stars.</p>
        <div className="nx-slider" id="reviews" role="region" aria-roledescription="carousel" aria-label="Client reviews">
          <div className="nx-slider-head"><p>{page.reviewsHeading || 'Reviews from jobs like yours'}</p></div>
          <div className="nx-track" tabIndex={0}>
            {(page.reviews || []).map((review, i) => (
              <figure className="nx-rev" key={review._key || i}>
                <blockquote><p className="nx-clamp" id={`rev-${i + 1}-t`}>{review.text}</p></blockquote>
                <button type="button" className="nx-more" aria-expanded="false" aria-controls={`rev-${i + 1}-t`} hidden>Read more</button>
                <figcaption><b>{review.reviewer}</b>, Google review, {review.year}{review.label ? ` · ${review.label}` : ''} · {review.link && <a href={review.link} rel="nofollow noopener">Read on Google</a>}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Section>
    )],
    ['process', (tint) => (
      <Section id="process" tint={tint} h2="What happens when you call" lede="From the first call to the closed permit, drawn from what reviewers describe.">
        <div className="nx-proc" id="proc">
          <ol className="nx-proc-track" tabIndex={0} aria-label="Steps from first call to closed permit">
            {steps.map(([art, title, body], i) => <li className="nx-proc-step" key={art}><div className="nx-proc-art"><Illustration name={art} id={`ill-${i}`} /></div><span className="nx-proc-n" aria-hidden="true">{i + 1}</span><h3>{title}</h3><p>{body}</p></li>)}
          </ol>
        </div>
      </Section>
    )],
    ['scope', (tint) => (
      <Section id="scope" tint={tint} h2={`What changes the scope and price of electrical work in a ${area} building`} lede={<T>{page.scopeLede || 'The same job on paper can cost very differently from one building to the next. These are the things that change it, and most are settled at the walkthrough.'}</T>}>
        <div className="table-wrap" tabIndex={0} aria-label="Scope and price factors, scroll horizontally to view all columns">
          <table><thead><tr><th>Factor</th><th>Why it changes the work</th><th>Who settles it</th></tr></thead>
            <tbody>{(page.scopeRows || []).map((row, i) => <tr key={row._key || i}><td>{row.factor}</td><td><T>{row.why}</T></td><td>{row.who}</td></tr>)}</tbody></table>
        </div>
        <div className="nx-two">
          <div className="nx-block"><h3>How we price</h3><ul className="nx-ticks"><li>A free walkthrough and estimate.</li><li>A written scope before any work starts.</li><li>No flat-rate price book, no membership plan, no commission.</li><li>Quotes are revised when you change your mind about the scope, and reviewers mention it.</li></ul></div>
          <div className="nx-block"><h3>“What&apos;s your hourly rate?”</h3><p><T>{page.hourlyAnswer || 'We quote by scope, not by the hour, because the hours on a job depend on everything in the table above. The written quote tells you the whole price before you agree to it.'}</T></p></div>
        </div>
      </Section>
    )],
    ['choosing', (tint) => (
      <Section id="choosing" tint={tint} h2={`Who are the best electricians ${AIN}? How to tell for yourself`} lede={`There isn't one best electrician for ${the}. There's the right one for your building and your job. These checks separate them, and every one can be verified without taking anyone's word for it, including ours.`}>
        <div className="table-wrap" tabIndex={0} aria-label="How to check an electrician, scroll horizontally to view all columns">
          <table><thead><tr><th>What to check</th><th>Why it matters {AIN}</th><th>How to verify it</th><th>Highlights Chicago&apos;s answer</th></tr></thead>
            <tbody>{criteria.map(([what, why, verify, answer]) => <tr key={what}><td>{what}</td><td><T>{why}</T></td><td>{verify}</td><td><T>{answer}</T></td></tr>)}</tbody></table>
        </div>
      </Section>
    )],
    ['companies', (tint) => (
      <Section id="companies" tint={tint} h2={`The kinds of electrical company ${AIN}, and when each one fits`} lede="Service businesses can't be compared on features. They differ in how they're run, and that decides who answers the phone and how the price is set.">
        <Carousel label="Kinds of electrical company" trackClass="nx-pics nx-pics-5">
          {companies.map(([art, title, who, price, fits, us], i) => (
            <article className={`nx-pic${us ? ' is-us' : ''}`} key={art}>
              {us && <span className="nx-us">Where Highlights fits</span>}
              <div className="nx-pic-art"><Illustration name={art} id={`ill-${20 + i}`} /></div>
              <h4>{title}</h4>
              <dl><dt>Who you talk to</dt><dd>{who}</dd><dt>How the price is set</dt><dd>{price}</dd><dt>Fits best when</dt><dd>{fits}</dd></dl>
            </article>
          ))}
        </Carousel>
        {page.whereWeFit && <p className="nx-callout"><strong>Where we fit, honestly.</strong> <T>{page.whereWeFit}</T></p>}
      </Section>
    )],
    ['area', (tint) => (
      <Section id="area" tint={tint} h2={`${The}, district by district`} lede={<T>{page.boundaryText}</T>}>
        <dl className="nx-facts">{(page.facts || []).map((fact, i) => <div key={fact._key || i}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        {page.map && (
          <figure className="nx-mapfig">
            <AreaMap page={page} />
            <figcaption>Schematic, not to scale. District edges are approximate, because sources draw them differently. {recN ? `Each green dot is a block where Highlights holds City of Chicago permits (${recN} permits on ${hl?.addresses ?? 0} addresses, ${recSince}–${page.permits?.windowTo.slice(0, 4)}).` : ''}</figcaption>
          </figure>
        )}
        <Carousel className="nx-car-districts" label={`${area} districts`} trackClass="nx-paths nx-dist-track">
          {(page.districts || []).map((district, i) => <article className="nx-path" key={district._key || i}><h3>{district.name}</h3><p>{district.intro}</p><dl><dt>What the electrical work looks like</dt><dd>{district.work}</dd></dl></article>)}
        </Carousel>
      </Section>
    )],
    ['buildings', (tint) => (
      <Section id="buildings" tint={tint} h2="Your building type, and what it means for electrical work" lede="Find your building and jump straight to the services people in it ask for most.">
        <Carousel label={`${area} building types`} trackClass="nx-pics nx-pics-3">
          {(page.buildings || []).map((building, i) => (
            <article className="nx-pic" key={building._key || i}>
              <div className="nx-pic-art"><Illustration name={building.illus} id={`ill-${30 + i}`} /></div>
              <h3>{building.title}</h3><p className="nx-where">{building.where}</p>
              <dl><dt>What changes the work</dt><dd><T>{building.changes}</T></dd><dt>Most-asked services</dt>
                <dd className="nx-links">{(building.services || []).map((service, j) => <span key={service._key || j}>{j > 0 && ', '}<a href={`#${service.category}`}>{service.label}</a></span>)}</dd></dl>
            </article>
          ))}
        </Carousel>
      </Section>
    )],
    ['nearby', (tint) => (
      <Section id="nearby" tint={tint} h2={`Neighbourhoods next to ${the}`} lede={`We cover every Chicago neighbourhood. These border ${the}, and the building stock changes as soon as you cross into them.`}>
        <div className="nx-car nx-car-near" role="region" aria-label={`Neighbourhoods next to ${the}`}>
          <ul className="nx-near nx-car-track nx-gen-track" tabIndex={0}>
            {(page.nearby || []).map((item, i) => {
              const slug = areaLinks.get(item.name.toLowerCase())
              return <li key={item._key || i}><b>{slug ? <Link href={`/${slug}`}>{item.name}</Link> : item.name}</b><span>{item.note}</span></li>
            })}
          </ul>
        </div>
        {(page.nearby || []).some((item) => !areaLinks.has(item.name.toLowerCase())) && <p className="small muted section-note"><Ph>link each neighbourhood to its area page once those pages exist</Ph></p>}
      </Section>
    )],
    ['permit-record', (tint) => (
      <Section id="permit-record" tint={tint} h2={`What the ${area} permit record shows`} lede={page.permits ? `The City of Chicago publishes every building permit. We pulled ${the}'s for the ${page.permits.months} months to ${monthYear(page.permits.windowTo)}: about ${page.permits.electricalTotal.toLocaleString('en-US')} permits involved electrical work, and ${page.permits.contractors} different electrical contractors were named on them.` : undefined}>
        {page.permits && mix.length > 0 && (
          <div className="table-wrap" tabIndex={0} aria-label={`${area} electrical permit mix, scroll horizontally to view all columns`}>
            <table>
              <caption>Permits issued {monthYear(page.permits.windowFrom, true)} to {monthYear(page.permits.windowTo, true)}, inside {page.bboxText}. A permit can count in more than one row. Grouped by keywords in the City&apos;s work descriptions, so treat the counts as approximate. Source: City of Chicago building permits data.</caption>
              <thead><tr><th>Type of work</th><th>Permits</th><th>What it tells you</th></tr></thead>
              <tbody>{mix.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.count}</td><td>{mixNotes.get(row.label) || DEFAULT_MIX_NOTES[row.label] || ''}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="nx-two">
          <div className="nx-block"><h3>Our own {area} record</h3>
            {recN ? (
              <>
                <p>{`${recN} permits on ${hl?.addresses ?? 0} addresses since ${recSince}: ${andList((hl?.byType || []).map((item) => `${item.count} ${permitTypeWords(item.type)}`))}.`}</p>
                <ul className="nx-ticks">{(page.recordBullets || []).map((bullet, i) => <li key={i}><T>{bullet}</T></li>)}</ul>
              </>
            ) : <p><T>{page.noRecordText || 'We do not yet hold City permits inside this boundary. Our nearest work is listed below the map in the neighbourhood section.'}</T></p>}
          </div>
          <div className="nx-block"><h3>The honest context</h3>{(page.honestContext || []).map((paragraph, i) => <p key={i}><T>{paragraph}</T></p>)}</div>
        </div>
      </Section>
    )],
  ]

  return (
    <div className="site-chrome">
      <CollectionHeader />
      <main className="service-landing" style={BRAND_STYLE}>
        <nav className="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href={co.site}>Home</a></li><li><Link href="/">Service areas</Link></li><li aria-current="page">Electricians {AIN}</li></ol></nav>
        <header className="hero"><div className="wrap hero-grid"><div>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.h1 || `Electricians ${AIN}, Chicago`}</h1>
          <figure className="nx-team">
            {team ? (
              <div className="nx-team-frame nx-team-photo"><img src={team.resolvedUrl} width={team.width || 1600} height={team.height || 900} alt={team.alt || `The Highlights Chicago team ${AIN}`} decoding="async" /></div>
            ) : (
              <>
                <div className="nx-team-frame nx-team-photo"><img src={`${BASE_PATH}/images/area/crew-illustrative.jpg`} width={1400} height={787} alt="A three-person service crew standing beside their open work van, ready for a job" decoding="async" /><span className="nx-team-tag">Illustrative photo</span></div>
                <figcaption>Stock photo by Tima Miroshnichenko on Pexels, free to use under the Pexels licence. <Ph>replace with a real photo of Boz and the Highlights crews with the van</Ph></figcaption>
              </>
            )}
          </figure>
          <p className="lede"><T>{page.heroLede}</T></p>
          <div className="trustbar">
            <span className="trust-item">◆ City of Chicago Electrical Contractor {co.licence}</span><span className="trust-item">◆ Family-owned, founder-led</span><span className="trust-item">◆ {permLine}</span>
            <span className="rating src-google"><span className="num">{co.googleRating}</span><span className="out">/5</span><span className="stars" style={{'--pct': '98%'} as CSSProperties} aria-hidden="true">★★★★★</span><span className="cnt">{co.googleReviews} Google reviews</span></span>
          </div>
          <div className="btn-row"><a className="btn btn-primary" href={`tel:${co.phoneTel}`}>Call {co.phoneDisplay}</a><a className="btn btn-secondary" href="#quote">Book a walkthrough</a></div>
          <nav className="nx-toc" aria-label="On this page"><details className="nx-toc-d" open><summary>On this page</summary><ol>{toc.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></details></nav>
        </div>
        <AreaLeadForm area={area} areaIn={AIN} districts={page.formDistricts?.length ? page.formDistricts : (page.districts || []).map((d) => d.name)} buildings={page.formBuildingTypes?.length ? page.formBuildingTypes : (page.buildings || []).map((b) => b.title)} addressPlaceholder={page.addressPlaceholder} rulesQuestion={page.formRulesQuestion} />
        </div></header>

        {folds.map(([id, render], index) => <Fragment key={id}>{render(index % 2 === 0)}</Fragment>)}

        <section className="wrap" id="faq"><h2>Electricians {AIN}: questions</h2>
          <div className="faq">{faqs.map((faq) => <div className="nx-faq-wrap" key={faq.key}><details><summary><span>{faq.question}</span><span className="faq-chevron" aria-hidden="true" /></summary><div className="faq-body"><p><T>{faq.answer}</T></p></div></details></div>)}</div>
        </section>

        <section className="wrap closing-cta-section"><div className="cta-final">
          <h2 className="cta-heading">Planning electrical work {AIN}?</h2>
          <p>A free walkthrough with the founder, a written scope, and a registered contractor who pulls the permit if the work needs one.</p>
          <div className="nx-ready"><h3>Have these ready when you call</h3><ul>{ready.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="btn-row centered"><a className="btn btn-primary" href={`tel:${co.phoneTel}`}>Call {co.phoneDisplay}</a><a className="btn btn-secondary" href="#quote">Book a walkthrough</a></div>
        </div></section>

        <div className="callbar"><a className="c-call" href={`tel:${co.phoneTel}`}>Call {co.phoneDisplay}</a><a className="c-form" href="#quote">Book a walkthrough</a></div>
        <JsonLd page={page} co={co} faqs={faqs} cats={cats} />
        <AreaBehaviours />
      </main>
      <CollectionFooter />
    </div>
  )
}
