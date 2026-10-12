/**
 * Checks the skill-output -> Sanity mapping on the real West Loop content, then feeds broken copies
 * to prove each validation rule fires. Run: pnpm test:content
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {AREA_JSON_KEYS, buildAreaDocuments, type AreaSource, type Json} from './lib/area-transform'
import {parseCsv} from './lib/csv'

const read = (file: string) => JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
const company = read('content/company.json')
const reviews = parseCsv(fs.readFileSync(path.resolve('content/highlights-reviews.csv'), 'utf8'))
const westLoop: AreaSource = {folder: 'west-loop', config: read('content/areas/west-loop/area.json'), permits: read('content/areas/west-loop/permits.json')}
const clone = (): AreaSource => JSON.parse(JSON.stringify(westLoop)) as AreaSource
const build = (areas: AreaSource[] = [westLoop]) => buildAreaDocuments({areas, company, reviews})
const errorsFor = (mutate: (copy: AreaSource) => void) => {
  const copy = clone()
  mutate(copy)
  return build([copy]).errors.join('\n')
}

let passed = 0
const queue: Array<[string, () => void | Promise<void>]> = []
function check(name: string, fn: () => void | Promise<void>) {
  queue.push([name, fn])
}

const base = build()
const page = base.documents.find((doc) => doc._type === 'areaPage') as Json
const settings = base.documents.find((doc) => doc._type === 'areaSettings') as Json

check('the review pack parses (quoted, multi-line reviews)', () => {
  assert.ok(reviews.length >= 250, `${reviews.length} reviews`)
  assert.ok(reviews.every((row) => row.reviewer && row.review && row.review_link.startsWith('http')))
})
check('the West Loop content builds with no errors', () => assert.deepEqual(base.errors, []))
check('company facts and one page use the area types and ids', () => {
  assert.equal(settings._id, 'area-settings')
  assert.equal(page._id, 'area-west-loop')
  assert.equal(page.slug.current, 'west-loop')
})
check('every fold of the template has its data', () => {
  assert.ok(page.districts.length >= 4)
  assert.ok(page.buildings.length >= 4)
  assert.ok(page.scopeRows.length >= 8)
  assert.ok(page.facts.length >= 4)
  assert.ok(page.faq.length >= 4)
  assert.ok(page.nearby.length >= 6)
  assert.ok(page.map.ewStreets.length >= 5 && page.map.nsStreets.length >= 5)
  assert.ok(page.honestContext.length >= 1 && page.recordBullets.length >= 3)
  assert.ok(page.researchSources.length >= 1)
})
check('tuple fields become named objects', () => {
  assert.deepEqual(Object.keys(page.facts[0]).sort(), ['_key', 'label', 'value'])
  assert.deepEqual(Object.keys(page.scopeRows[0]).sort(), ['_key', 'factor', 'who', 'why'])
  assert.deepEqual(Object.keys(page.buildings[0].services[0]).sort(), ['_key', 'category', 'label'])
  assert.deepEqual(Object.keys(page.map.districts[0]).sort(), ['_key', 'east', 'name', 'north', 'south', 'west'])
})
check('the permit snapshot keeps the City numbers and block-level dots only', () => {
  assert.equal(page.permits.highlights.count, westLoop.permits!.highlights.count)
  assert.equal(page.permits.electricalTotal, westLoop.permits!.electrical_total)
  assert.ok(page.permits.highlights.points.length > 0)
  assert.ok(!JSON.stringify(page.permits).includes('block of'), 'no street blocks or work descriptions in the snapshot')
})
check('reviews resolve to the full pack text, cut only where asked', () => {
  assert.equal(page.reviews.length, westLoop.config.reviews.length)
  const cut = westLoop.config.reviews.find((r: Json) => r.cut_before)
  const resolved = page.reviews.find((r: Json) => r.reviewer === cut.reviewer)
  assert.ok(!resolved.text.includes(cut.cut_before.trim()))
  assert.ok(reviews.find((row) => row.reviewer === cut.reviewer)!.review.startsWith(resolved.text))
})
check('review figures are counted from the pack', () => {
  assert.equal(settings.reviewStats.total, reviews.length)
  assert.ok(settings.reviewStats.owner > 0 && settings.reviewStats.fiveStar > 0)
})
check('[CONFIRM] placeholders are reported', () => assert.ok(base.placeholders.length >= 1))

// ---- Field coverage: every content key has a Sanity field, and every imported value lands in one.
type SchemaField = {name: string; type: string; fields?: SchemaField[]; of?: Array<{type: string; fields?: SchemaField[]}>}
const SYSTEM_KEYS = new Set(['_id', '_type', '_key'])
function unmappedPaths(value: unknown, fields: SchemaField[], at: string): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const byName = new Map(fields.map((field) => [field.name, field]))
  const missing: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SYSTEM_KEYS.has(key)) continue
    const field = byName.get(key)
    if (!field) { missing.push(`${at}${key}`); continue }
    if (field.type === 'slug' || field.type === 'geopoint' || field.type === 'image') continue
    if (field.type === 'object') missing.push(...unmappedPaths(child, field.fields || [], `${at}${key}.`))
    if (field.type === 'array' && Array.isArray(child)) {
      const member = field.of?.[0]
      for (const item of child) if (member?.fields) missing.push(...unmappedPaths(item, member.fields, `${at}${key}[].`))
    }
  }
  return missing
}
const lincolnPark: AreaSource = {folder: 'lincoln-park', config: read('scripts/fixtures/lincoln-park.area.json')}
const both = build([westLoop, lincolnPark])

check('the Lincoln Park example (residential, no permits) also builds with no errors', () => assert.deepEqual(both.errors, []))
check('every key in both example content files is a mapped field', () => {
  for (const source of [westLoop, lincolnPark]) for (const key of Object.keys(source.config)) assert.ok(AREA_JSON_KEYS.includes(key), `${source.folder}: ${key}`)
})
check('every imported value has a field in the Sanity schema, at every depth', async () => {
  const {areaPage} = await import('../src/sanity/schemaTypes/areaPage')
  const {areaSettings} = await import('../src/sanity/schemaTypes/areaSettings')
  const schemaFor = (type: string) => ((type === 'areaPage' ? areaPage : areaSettings) as unknown as {fields: SchemaField[]}).fields
  const missing = both.documents.flatMap((doc) => unmappedPaths(doc, schemaFor(doc._type), `${doc._type}.`))
  assert.deepEqual(missing, [])
})
check('every documented content key reaches the Sanity document', () => {
  const full: AreaSource = clone()
  Object.assign(full.config, {h1: 'Electricians in the West Loop', form_rules_question: 'Building rules?', no_record_text: 'None yet.', team_photo: {src: 'https://example.com/team.jpg', alt: 'Team', width: 1600, height: 900}})
  const doc = build([full]).documents.find((d) => d._type === 'areaPage') as Json
  const camel = (key: string) => key.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase())
  const renamed: Record<string, string> = {form_buildings: 'formBuildingTypes', slug: 'slug'}
  for (const key of AREA_JSON_KEYS) assert.ok(doc[renamed[key] || camel(key)] !== undefined, `${key} -> ${renamed[key] || camel(key)} is missing`)
})
check('rejects a content key that has no Sanity field', () => {
  assert.match(errorsFor((c) => { c.config.brand_new_field = 'x' }), /"brand_new_field" is not mapped/)
})

check('rejects an unknown building illustration', () => {
  assert.match(errorsFor((c) => { c.config.buildings[0].illus = 'b-castle' }), /illustration "b-castle"/)
})
check('rejects a building link to an unknown service category', () => {
  assert.match(errorsFor((c) => { c.config.buildings[0].services[0][1] = 'svc-plumbing' }), /unknown category "svc-plumbing"/)
})
check('rejects a reviewer who is not in the review pack', () => {
  assert.match(errorsFor((c) => { c.config.reviews[0].reviewer = 'Nobody Real' }), /not in the review pack/)
})
check('rejects a service override that matches nothing', () => {
  assert.match(errorsFor((c) => { c.config.service_overrides = {'Plumbing repair': 'x'} }), /matches no service name/)
})
check('rejects a missing required field and a slug/folder mismatch', () => {
  const errors = errorsFor((c) => { c.config.hero_lede = ''; c.config.slug = 'west-side' })
  assert.match(errors, /hero_lede is required/)
  assert.match(errors, /folder name must equal the slug/)
})
check('rejects a 24/7 availability claim', () => {
  assert.match(errorsFor((c) => { c.config.hero_lede += ' Call us 24/7.' }), /24\/7/)
})
check('rejects an unknown map feature kind', () => {
  assert.match(errorsFor((c) => { c.config.map.features.push({kind: 'volcano', label: 'x'}) }), /feature kind "volcano"/)
})
check('an area without permits.json still builds, without the permit snapshot', () => {
  const copy = clone()
  delete copy.permits
  const result = build([copy])
  assert.deepEqual(result.errors, [])
  assert.equal((result.documents.find((doc) => doc._type === 'areaPage') as Json).permits, undefined)
})

async function run() {
  for (const [name, fn] of queue) {
    await fn()
    passed += 1
    console.log(`ok - ${name}`)
  }
  console.log(`\n${passed} checks passed`)
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
