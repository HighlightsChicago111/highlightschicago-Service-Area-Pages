/**
 * The checks a service area page row must pass before it goes to Sanity. One copy, used by both the
 * command-line import (scripts/area-sheet.ts) and the Google Sheet's Apps Script (apps-script/), so the
 * two can never disagree. No Node or Sanity imports here: it is bundled into the Apps Script.
 */
import {comparable} from './sheet'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents

/** Every block of the standard area template, with the item counts the design is built for (area.json key names). */
export const STANDARD_COUNTS: Record<string, [number, number]> = {
  facts: [4, 6], districts: [4, 6], buildings: [4, 6], scope_rows: [8, 11], reviews: [6, 8], nearby: [6, 8], faq: [4, 6], cta_ready: [5, 6],
}
/** Sanity fields a page cannot be imported without. */
export const REQUIRED_FIELDS = ['area', 'areaThe', 'areaIn', 'slug', 'metaDescription', 'eyebrow', 'heroLede', 'boundaryText']

const camel = (key: string) => key.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase())
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
export const idForSlug = (slug: string) => `area-${slug}`

/** Problems that stop a row (errors) and gaps worth fixing (warnings). */
export function checkRow(doc: Json, idCell: string): {errors: string[]; warnings: string[]} {
  const errors: string[] = []
  const warnings: string[] = []
  for (const field of REQUIRED_FIELDS) if (!doc[field]) errors.push(`${field} is required`)
  const slug = doc.slug?.current || ''
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push(`slug "${slug}" must be lowercase words joined by hyphens`)
  if (idCell && slug && idCell !== idForSlug(slug)) errors.push(`_id ${idCell} does not match the slug (expected ${idForSlug(slug)})`)
  for (const [key, [min, max]] of Object.entries(STANDARD_COUNTS)) {
    const n = Array.isArray(doc[camel(key)]) ? doc[camel(key)].length : 0
    if (n < min || n > max) warnings.push(`${camel(key)} has ${n} item(s) (the template expects ${min} to ${max})`)
  }
  for (const field of ['cardSummary', 'cardRegion', 'whereWeFit', 'hourlyAnswer']) if (!doc[field]) warnings.push(`${field} is empty`)
  if (doc.cardImage?.src && (!doc.cardImage.alt || !doc.cardImage.credit)) errors.push('cardImage needs alt and credit when src is set')
  const confirm = JSON.stringify(doc).match(/\[CONFIRM:[^\]]*\]/g) || []
  if (confirm.length) warnings.push(`${confirm.length} [CONFIRM] item(s) still to answer`)
  return {errors, warnings}
}

export function stripSystem(doc: Json): Json {
  const {_id, _type, _rev, _createdAt, _updatedAt, ...fields} = doc // eslint-disable-line @typescript-eslint/no-unused-vars
  return fields
}

/** Top-level fields that differ between a row's page and Sanity's current version; ['(new page)'] when Sanity has none. */
export function changedFields(next: Json, current: Json | undefined): string[] {
  if (!current) return ['(new page)']
  const a = comparable(next)
  const b = comparable(stripSystem(current))
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => !same(a[key], b[key])).sort()
}
