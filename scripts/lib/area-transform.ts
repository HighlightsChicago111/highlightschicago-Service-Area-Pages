/**
 * Skill output (area.json + permits.json per area, company.json, the review CSV) -> Sanity documents.
 * Pure functions, no network: the build and the tests both use this.
 */
import catalog from '../../src/lib/area/catalog.json'
import illustrations from '../../src/lib/area/illustrations.json'

export type SanityDoc = {_id: string; _type: string; [key: string]: unknown}
export type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- untyped skill JSON
export type AreaSource = {folder: string; config: Json; permits?: Json}
export type BuildInput = {areas: AreaSource[]; company: Json; reviews: Array<Record<string, string>>}
export type BuildResult = {documents: SanityDoc[]; errors: string[]; warnings: string[]; placeholders: string[]}

export const SETTINGS_ID = 'area-settings'
export const areaId = (slug: string) => `area-${slug}`

const CATEGORY_IDS = new Set(catalog.categories.map((category) => category.id))
const SERVICE_NAMES = new Set(catalog.categories.flatMap((category) => category.items.map((item) => item.name)))
const BUILDING_ART = new Set(Object.keys(illustrations).filter((key) => key.startsWith('b-')))
const FEATURE_KINDS = new Set(['expressway_ns', 'expressway_ew', 'water_east', 'water_west', 'water_north', 'water_south', 'park'])
const REQUIRED = ['area', 'area_the', 'area_in', 'slug', 'meta_description', 'eyebrow', 'hero_lede', 'boundary_text']
const CONFIRM = /\[CONFIRM:[^\]]*\]/g

/** Every area.json key the skill documents (references/area-config.md), each mapped to a Sanity field below. */
export const AREA_JSON_KEYS = [
  'area', 'area_the', 'area_in', 'city', 'slug', 'title', 'meta_description', 'eyebrow', 'h1', 'hero_lede', 'address_placeholder',
  'form_rules_question', 'form_districts', 'form_buildings', 'team_photo', 'boundary_text', 'bbox', 'bbox_text', 'facts', 'zips',
  'map_desc', 'map', 'districts', 'buildings', 'scope_lede', 'scope_rows', 'hourly_answer', 'choosing_building_why',
  'choosing_building_answer', 'choosing_paperwork_why', 'where_we_fit', 'mix_notes', 'record_bullets', 'no_record_text',
  'honest_context', 'reviews_heading', 'reviews', 'nearby', 'faq', 'cta_ready', 'service_overrides', 'research_sources',
]
const KNOWN_KEYS = new Set(AREA_JSON_KEYS)

// Same patterns as the skill's reviews.py THEMES: what reviewers chose to mention.
const THEMES = {
  owner: /\bboz\b|owner|president/i,
  fairPrice: /fair|reasonable|competitive|affordable|half the price|less than/i,
  punctual: /on time|punctual|prompt|early/i,
  clean: /clean|drop cloth|cover|protect|spotless|tidy/i,
}

const keyed = <T extends object>(prefix: string, items: T[] = []) => items.map((item, index) => ({_key: `${prefix}-${index + 1}`, ...item}))
const opt = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)

/** Drop undefined, empty strings, empty arrays and empty objects so absent sections stay absent. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined) as T
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => item !== undefined && item !== '' && !(Array.isArray(item) && item.length === 0) && !(item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0))
    return (entries.length ? Object.fromEntries(entries) : undefined) as T
  }
  return value
}

export function reviewStats(rows: Array<Record<string, string>>) {
  const count = (pattern: RegExp) => rows.filter((row) => pattern.test(row.review || '')).length
  return {
    total: rows.length,
    fiveStar: rows.filter((row) => (row.rating || '').startsWith('5')).length,
    owner: count(THEMES.owner), punctual: count(THEMES.punctual), fairPrice: count(THEMES.fairPrice), clean: count(THEMES.clean),
  }
}

function settingsDoc(co: Json, rows: Array<Record<string, string>>): SanityDoc {
  return compact({
    _id: SETTINGS_ID, _type: 'areaSettings',
    name: co.name, short: co.short, phoneDisplay: co.phone_display, phoneTel: co.phone_tel, phoneSchema: co.phone_schema, site: co.site,
    address: co.address ? {street: co.address.street, city: co.address.city, region: co.address.region, zip: co.address.zip} : undefined,
    licence: co.licence, licence2: co.licence_2, bbb: co.bbb, permitsCitywide: co.permits_citywide, permitsSince: co.permits_since,
    permitsRank: co.permits_rank, topWards: co.top_wards, googleRating: co.google_rating, googleReviews: co.google_reviews,
    officeHours: co.office_hours, founderShort: co.founder_short, founderLine: co.founder_line, founderConfirm: co.founder_confirm,
    servicesUrl: co.services_url, reviewStats: reviewStats(rows),
  })
}

function permitsSnapshot(p: Json) {
  const hl = p.highlights || {}
  return {
    source: p.source, windowFrom: p.window?.from, windowTo: p.window?.to, months: p.window?.months,
    electricalTotal: p.electrical_total, contractors: p.contractors,
    mix: keyed('mix', (p.mix || []).map(([label, count]: [string, number]) => ({label, count}))),
    highlights: {
      count: hl.count || 0, addresses: hl.addresses, firstYear: hl.first_year || undefined,
      byType: keyed('type', (hl.by_type || []).map(([type, count]: [string, number]) => ({type, count}))),
      points: keyed('pt', (hl.points || []).map(([lat, lon, count]: [number, number, number]) => ({lat, lon, count}))),
    },
  }
}

export function buildAreaDocuments({areas, company, reviews}: BuildInput): BuildResult {
  const errors: string[] = []
  const warnings: string[] = []
  const documents: SanityDoc[] = [settingsDoc(company, reviews)]
  for (const field of ['name', 'phone_display', 'phone_tel', 'site', 'licence', 'google_rating', 'google_reviews', 'permits_citywide']) {
    if (!company[field]) errors.push(`company.json: ${field} is required`)
  }
  const byReviewer = new Map(reviews.map((row) => [row.reviewer, row]))
  const slugs = new Set<string>()

  for (const {folder, config: c, permits} of areas) {
    const where = `areas/${folder}`
    for (const field of REQUIRED) if (!opt(c[field])) errors.push(`${where}: ${field} is required`)
    for (const key of Object.keys(c)) if (!KNOWN_KEYS.has(key)) errors.push(`${where}: "${key}" is not mapped to a Sanity field (add it to the schema and area-transform.ts)`)
    if (c.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug)) errors.push(`${where}: slug must be lowercase words joined by hyphens`)
    if (c.slug && c.slug !== folder) errors.push(`${where}: folder name must equal the slug (${c.slug})`)
    if (slugs.has(c.slug)) errors.push(`${where}: duplicate slug ${c.slug}`)
    slugs.add(c.slug)
    if (!c.districts?.length) errors.push(`${where}: at least one district is required`)
    if (!c.buildings?.length) errors.push(`${where}: at least one building type is required`)
    if ((c.meta_description || '').length > 170) warnings.push(`${where}: meta_description is ${c.meta_description.length} characters (aim for 150-160)`)
    for (const [i, b] of (c.buildings || []).entries()) {
      if (!BUILDING_ART.has(b.illus)) errors.push(`${where}: building ${i + 1} illustration "${b.illus}" is not one of ${[...BUILDING_ART].join(', ')}`)
      for (const [label, cid] of b.services || []) if (!CATEGORY_IDS.has(cid)) errors.push(`${where}: building ${i + 1} link "${label}" points at unknown category "${cid}"`)
    }
    for (const target of Object.keys(c.service_overrides || {})) {
      if (!SERVICE_NAMES.has(target) && !CATEGORY_IDS.has(target)) errors.push(`${where}: service override "${target}" matches no service name or category id`)
    }
    for (const feature of c.map?.features || []) if (!FEATURE_KINDS.has(feature.kind)) errors.push(`${where}: map feature kind "${feature.kind}" is unknown`)
    if (!permits) warnings.push(`${where}: no permits.json, so the map dots and the permit record are left out`)

    const chosen: Json[] = []
    for (const [i, selection] of (c.reviews || []).entries()) {
      const row = byReviewer.get(selection.reviewer)
      if (!row) {
        errors.push(`${where}: review ${i + 1} reviewer "${selection.reviewer}" is not in the review pack`)
        continue
      }
      let text = row.review
      if (selection.cut_before) {
        if (text.includes(selection.cut_before)) text = text.split(selection.cut_before)[0].trimEnd()
        else warnings.push(`${where}: cut_before text for ${selection.reviewer} was not found; the full review is shown`)
      }
      chosen.push({reviewer: row.reviewer, label: opt(selection.label), year: row.iso_date.slice(0, 4), link: opt(row.review_link), text})
    }
    if (chosen.length < 6 || chosen.length > 8) warnings.push(`${where}: ${chosen.length} reviews (the template expects 6 to 8)`)

    const doc = compact({
      _id: areaId(c.slug), _type: 'areaPage',
      area: c.area, areaThe: c.area_the, areaIn: c.area_in, city: opt(c.city), slug: {_type: 'slug', current: c.slug},
      title: opt(c.title), metaDescription: opt(c.meta_description), eyebrow: opt(c.eyebrow), h1: opt(c.h1), heroLede: opt(c.hero_lede),
      addressPlaceholder: opt(c.address_placeholder), formRulesQuestion: opt(c.form_rules_question),
      formDistricts: c.form_districts, formBuildingTypes: c.form_buildings,
      teamPhoto: c.team_photo && c.team_photo !== 'stock' ? {src: c.team_photo.src, alt: c.team_photo.alt, width: c.team_photo.width, height: c.team_photo.height} : undefined,
      boundaryText: opt(c.boundary_text), bbox: c.bbox, bboxText: opt(c.bbox_text),
      facts: keyed('fact', (c.facts || []).map(([label, value]: [string, string]) => ({label, value}))),
      zips: c.zips, mapDesc: opt(c.map_desc),
      map: c.map ? {
        bbox: c.map.bbox, height: num(c.map.height),
        ewStreets: keyed('ew', (c.map.ew_streets || []).map(([label, lat]: [string, number]) => ({label, lat}))),
        nsStreets: keyed('ns', (c.map.ns_streets || []).map(([label, lon]: [string, number]) => ({label, lon}))),
        districts: keyed('md', (c.map.districts || []).map(([name, north, south, west, east]: [string, number, number, number, number]) => ({name, north, south, west, east}))),
        landmarks: keyed('lm', (c.map.landmarks || []).map(([name, lat, lon]: [string, number, number]) => ({name, lat, lon}))),
        features: keyed('ft', c.map.features || []),
      } : undefined,
      districts: keyed('district', (c.districts || []).map((d: Json) => ({name: d.name, intro: d.intro, work: d.work}))),
      buildings: keyed('building', (c.buildings || []).map((b: Json) => ({
        illus: b.illus, title: b.title, where: b.where, changes: b.changes,
        services: keyed('svc', (b.services || []).map(([label, category]: [string, string]) => ({label, category}))),
      }))),
      scopeLede: opt(c.scope_lede),
      scopeRows: keyed('scope', (c.scope_rows || []).map(([factor, why, who]: [string, string, string]) => ({factor, why, who}))),
      hourlyAnswer: opt(c.hourly_answer), choosingBuildingWhy: opt(c.choosing_building_why), choosingBuildingAnswer: opt(c.choosing_building_answer),
      choosingPaperworkWhy: opt(c.choosing_paperwork_why), whereWeFit: opt(c.where_we_fit),
      permits: permits ? permitsSnapshot(permits) : undefined,
      mixNotes: keyed('note', Object.entries(c.mix_notes || {}).map(([label, note]) => ({label, note}))),
      recordBullets: c.record_bullets, noRecordText: opt(c.no_record_text), honestContext: c.honest_context,
      reviewsHeading: opt(c.reviews_heading), reviews: keyed('review', chosen),
      nearby: keyed('near', (c.nearby || []).map(([name, note]: [string, string]) => ({name, note}))),
      faq: keyed('faq', (c.faq || []).map(([key, question, answer]: [string, string, string]) => ({key, question, answer}))),
      ctaReady: c.cta_ready,
      serviceOverrides: keyed('override', Object.entries(c.service_overrides || {}).map(([target, line]) => ({target, line}))),
      researchSources: keyed('source', (c.research_sources || []).map(([title, url, type]: [string, string, string]) => ({title, url, type}))),
    })
    if (/24\s*\/\s*7|24-hour/i.test(JSON.stringify(doc))) errors.push(`${where}: no 24/7 or 24-hour availability claims (unresolved hours conflict)`)
    documents.push(doc)
  }

  const placeholders: string[] = []
  for (const doc of documents) for (const match of JSON.stringify(doc).match(CONFIRM) || []) placeholders.push(`${doc._id}: ${match}`)
  return {documents, errors, warnings, placeholders}
}
