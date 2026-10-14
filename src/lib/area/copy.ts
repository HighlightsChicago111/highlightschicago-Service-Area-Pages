import type {IconName} from '@/components/ds/icon'
import type {AreaPage, AreaSettings} from '@/types/area'

/*
 * Copy that is the same on every area page (the template's fixed text). Area-specific text comes
 * from Sanity. Wording here must read true for any area, not only the West Loop.
 */

export type Faq = {key: string; question: string; answer: string}

export const DEFAULT_MIX_NOTES: Record<string, string> = {
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

export const DEFAULT_READY = [
  "Your address, and the building management office's contact if there is one",
  'Any contractor requirements: certificate of insurance limits, elevator booking, working hours',
  'A photo of your electrical panel with the door open',
  "Photos of the room or ceiling, and of any fixture you've bought",
  'For a condo: whether the board needs to approve the work',
]

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
const PERMIT_TYPE_WORD_ONE: Record<string, string> = {'renovation/alteration': 'renovation or alteration', signs: 'sign'}
/** How a permit type reads after its count: "2 signs" but "1 sign". */
export const permitTypeWords = (type: string, count = 2) => (count === 1 && PERMIT_TYPE_WORD_ONE[type.toLowerCase()]) || PERMIT_TYPE_WORDS[type.toLowerCase()] || type.toLowerCase()
export const andList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] || '')
export const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

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

/** The city an area page sits in: Chicago unless the page names a suburb. */
export const cityOf = (page: Pick<AreaPage, 'city'>) => page.city?.trim() || 'Chicago'
export const isChicago = (page: Pick<AreaPage, 'city'>) => cityOf(page).toLowerCase() === 'chicago'
/** "Electricians in the West Loop, Chicago" or, for a suburb, "Electricians in Evanston, IL". */
export const defaultH1 = (page: Pick<AreaPage, 'city' | 'areaIn'>) => `Electricians ${page.areaIn}, ${isChicago(page) ? 'Chicago' : 'IL'}`

export function genericFaqs(page: AreaPage, co: AreaSettings): Faq[] {
  const city = cityOf(page)
  const local: Faq[] = isChicago(page) ? [
    {key: 'faq-handyman', question: 'Can a handyman do electrical work in Chicago?', answer: "Not work that needs a permit. Chicago electrical permits are issued to registered electrical contractors, so a handyman can't pull one. For anything beyond non-electrical tasks, use a registered contractor."},
    {key: 'faq-license', question: "How do I check an electrician's licence in Chicago?", answer: `Ask for their City of Chicago electrical contractor registration and check it with the Department of Buildings. Then search their name in the City's public building permits data to see the work they've actually done. Ours is ${co.licence}.`},
  ] : [
    {key: 'faq-handyman', question: `Can a handyman do electrical work in ${city}?`, answer: `Not work that needs a permit. ${city} requires every contractor working under a permit to be registered with the City, and an electrical contractor registers with an electrical licence. For anything beyond non-electrical tasks, use a licensed, registered electrician.`},
    {key: 'faq-license', question: `How do I check an electrician's licence for work in ${city}?`, answer: `Ask for two things: their electrical contractor licence, and their City of ${city} contractor registration, which the City requires for permitted work. Check the licence with the city that issued it. Ours is City of Chicago electrical contractor licence ${co.licence}.`},
  ]
  return [
    ...local,
    {key: 'faq-estimate', question: 'Do you charge for estimates?', answer: 'No. Estimates are free, and you get the scope in writing before any work starts.'},
    {key: 'faq-weekend', question: 'Do you work weekends or handle emergencies?', answer: "Yes. We're open 24 hours a day, 7 days a week for emergency service. Reviewers describe same-day Saturday visits, a Sunday request answered within a few hours, and emergency calls where we made the hazard safe, then came back with parts."},
    {key: 'faq-owner', question: 'Will I deal with the owner?', answer: `Usually, yes. Boz, the founder, typically does the walkthrough and writes the quote, and more than a third of the ${co.reviewStats?.total ? `${co.reviewStats.total} ` : ''}reviews we analysed mention him by name.`},
    {key: 'faq-cost', question: `How much does an electrician cost ${page.areaIn}?`, answer: "It depends on the scope and the building: the access, the construction, the permit route and the working hours. We don't quote an hourly rate for that reason. The walkthrough is free and the quote is written."},
  ]
}

export const FAMILY_POINTS = [
  'You talk to the person who owns the outcome, not a dispatcher reading from a price book.',
  'The office schedules you, and reviewers name the office staff who did it.',
  'The crews are salaried and reviewers name them. The same electricians come back for the next job.',
  "Your request isn't sold to three other contractors.",
]

export const HOW_WE_WORK: Array<{icon: IconName; title: string; body: string}> = [
  {icon: 'search', title: 'Diagnose first, replace second', body: 'The fault is rarely where the symptom is. We find it before anyone quotes equipment.'},
  {icon: 'clipboardCheck', title: 'We pull and close the permit', body: 'In-house, including the Express Permit route where it fits.'},
  {icon: 'users', title: 'Scope pricing', body: 'No flat-rate book, no commissioned adviser, no membership plan. The quote is written against the actual scope.'},
]

export const PROCESS_STEPS: Array<{icon: IconName; title: string; body: string}> = [
  {icon: 'phone', title: 'The office books you in', body: 'You call or send the form. The office arranges the walkthrough.'},
  {icon: 'search', title: 'The founder walks the space', body: "Boz usually comes himself, looks at the panel, the ceilings and the building's rules, and asks what you actually want."},
  {icon: 'fileText', title: 'A written estimate', body: 'Reviewers describe estimates arriving the same day or the next. For an association, it comes as a proposal the board can read.'},
  {icon: 'fileCheck', title: 'Building paperwork and permit', body: 'Where a building asks for it, a certificate of insurance goes to management, and we pull the City permit where one is needed.'},
  {icon: 'wrench', title: 'Install day', body: 'A named crew arrives on time, protects floors and furniture, and checks heights and positions with you before anything is fixed in place.'},
  {icon: 'clipboardCheck', title: 'Inspection and closeout', body: 'The City inspects permitted work and we close the permit. Then we follow up to make sure everything is working.'},
]

export const PRICING_POINTS = [
  'A free walkthrough and estimate.',
  'A written scope before any work starts.',
  'No flat-rate price book, no membership plan, no commission.',
  'Quotes are revised when you change your mind about the scope, and reviewers mention it.',
]

export type CompanyKind = {title: string; who: string; price: string; fits: string; us: boolean}
export const COMPANY_KINDS: CompanyKind[] = [
  {title: 'Family-owned local contractor', who: 'The owner, or someone who works directly with them', price: 'A written quote for your actual scope', fits: 'Unit, house, restaurant and small commercial work where you want one accountable person', us: true},
  {title: 'National franchise brand', who: 'A call centre, then the technician dispatched', price: 'Often a flat-rate price book, sometimes with membership plans', fits: 'Standard repairs where speed of dispatch matters most', us: false},
  {title: 'Lead-generation marketplace', who: 'A website that passes your request to several contractors', price: 'Whatever each contractor who calls back quotes', fits: "You want several quotes fast and don't mind not choosing who calls", us: false},
  {title: 'Large commercial or union contractor', who: 'A project manager or estimator', price: 'Bids against drawings and specifications', fits: 'Tower base-building work and large office floors.', us: false},
  {title: 'Handyman', who: 'The handyman', price: 'Hourly or per task', fits: "Non-electrical work. A handyman can't pull an electrical permit.", us: false},
]

export type Check = {what: string; why: string; verify: string; answer: string}
export function choosingChecks(page: AreaPage, co: AreaSettings): Check[] {
  const hl = page.permits?.highlights
  const recN = hl?.count || 0
  const since = hl?.firstYear || '2012'
  const stats = co.reviewStats
  return [
    isChicago(page)
      ? {what: 'City of Chicago registration', why: 'Only a registered electrical contractor can pull a Chicago electrical permit. Building managers ask for it before they let anyone in.', verify: 'The City of Chicago Department of Buildings contractor lookup', answer: `${co.licence}${co.licence2 ? `, also ${co.licence2}` : ''}`}
      : {what: `Licence and ${cityOf(page)} registration`, why: `${cityOf(page)} requires every contractor working under a permit to be registered with the City. An electrical contractor registers with an electrical licence from a testing city such as Chicago.`, verify: `Ask for the licence and the City of ${cityOf(page)} registration`, answer: `City of Chicago licence ${co.licence}${co.licence2 ? `, also ${co.licence2}` : ''}`},
    isChicago(page)
      ? {what: 'Permit record in this area', why: 'Permits are public. They show the work actually done here, not the work claimed.', verify: "Search the contractor's name in the City's building permits data", answer: recN ? `${recN} permits ${page.areaIn} since ${since}; ${co.permitsCitywide} citywide since ${co.permitsSince}` : `${co.permitsCitywide} citywide since ${co.permitsSince}`}
      : {what: 'Permit record', why: 'Permits show the work actually done, not the work claimed.', verify: "Ask for recent permitted jobs nearby, and search Chicago work in the City of Chicago's public permits data", answer: `${co.permitsCitywide} City of Chicago permits since ${co.permitsSince}`},
    {what: 'Experience with your building type', why: page.choosingBuildingWhy || 'Different building types are different jobs: how wire is run, who approves the work and what the panel can take all change.', verify: 'Ask for examples in buildings like yours', answer: page.choosingBuildingAnswer || ''},
    {what: 'Building paperwork', why: page.choosingPaperworkWhy || 'Managed buildings often want a certificate of insurance before work is scheduled.', verify: 'Ask how fast they issue a certificate of insurance', answer: 'Reviewers describe certificates issued the same day they asked'},
    {what: 'Who you deal with', why: 'Someone has to own the quote, the schedule and the result.', verify: "Ask who walks the job, who quotes it and who's on site", answer: `The founder usually does the walkthrough; ${stats?.owner ?? 0} of ${stats?.total ?? 0} reviews we analysed name him`},
    {what: 'How the price is set', why: 'Flat-rate menus, hourly billing and written scope quotes produce very different bills for the same job.', verify: 'Ask for the scope in writing before work starts', answer: 'Free estimate, written scope, no flat-rate book'},
    {what: 'Reviews: volume, recency, detail', why: 'Specific reviews about buildings like yours tell you more than a star average.', verify: 'Read the newest reviews, not the top ones', answer: `${co.googleRating} from ${co.googleReviews} Google reviews`},
  ]
}

/** Icon for a building type, from its drawing key (the drawings are not used in the v3 design). */
export const BUILDING_ICON: Record<string, IconName> = {
  'b-loft': 'building', 'b-highrise': 'building', 'b-midrise': 'building', 'b-townhome': 'house', 'b-restaurant': 'receipt',
  'b-office': 'monitor', 'b-bungalow': 'house', 'b-twoflat': 'house', 'b-cottage': 'house', 'b-courtyard': 'building',
}
