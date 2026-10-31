/**
 * Service area pages <-> one spreadsheet row per page.
 *
 * The columns come from the areaPage Sanity schema, so every field has a column whose heading is
 * its exact Sanity field path:
 *   area, metaDescription, slug                 single fields
 *   bbox.north, cardImage.credit                object fields
 *   zips[1], ctaReady[3]                        list of text, numbered from 1
 *   districts[2].name, faq[4].answer            list of items, one column per part
 *   buildings[1].services[2].label              a list inside a list item
 *   map, permits, cardImage.image               deep machine data, one JSON cell
 * A field added to the schema later gets its columns automatically.
 */
import {parseCsvRows} from './csv'

export type SchemaField = {name: string; type: string; fields?: SchemaField[]; of?: Array<{type: string; fields?: SchemaField[]}>}
export type Column = {path: string; kind: 'text' | 'number' | 'slug' | 'json'}
type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents

/** Stored as one JSON cell: map geometry and the permit snapshot are generated data, not hand-typed. */
const JSON_FIELDS = new Set(['map', 'permits'])
/** Columns per list. The export refuses to drop data, so a page with more items fails loudly. */
export const LIST_CAPACITY: Record<string, number> = {
  formDistricts: 8, formBuildingTypes: 8, facts: 6, zips: 6, districts: 6, buildings: 6, 'buildings.services': 3,
  scopeRows: 11, mixNotes: 13, recordBullets: 6, honestContext: 3, reviews: 8, nearby: 8, faq: 6, ctaReady: 6,
  serviceOverrides: 10, researchSources: 30,
}
const DEFAULT_CAPACITY = 6
/** Bookkeeping columns, before the fields. The import ignores them. */
export const META_COLUMNS = ['_id', '_status', '_updatedAt']

const SCALAR = new Set(['string', 'text', 'url', 'number', 'date', 'datetime', 'boolean'])
const kindOf = (type: string): Column['kind'] => (type === 'number' ? 'number' : type === 'slug' ? 'slug' : 'text')

export function sheetColumns(fields: SchemaField[], prefix = '', capacityKey = ''): Column[] {
  const columns: Column[] = []
  for (const field of fields) {
    const path = `${prefix}${field.name}`
    const key = capacityKey ? `${capacityKey}.${field.name}` : field.name
    if (JSON_FIELDS.has(path) || field.type === 'image' || field.type === 'geopoint') { columns.push({path, kind: 'json'}); continue }
    if (SCALAR.has(field.type) || field.type === 'slug') { columns.push({path, kind: kindOf(field.type)}); continue }
    if (field.type === 'object') { columns.push(...sheetColumns(field.fields || [], `${path}.`, key)); continue }
    if (field.type === 'array') {
      const member = field.of?.[0]
      const capacity = LIST_CAPACITY[key] ?? DEFAULT_CAPACITY
      for (let i = 1; i <= capacity; i++) {
        if (member?.fields) columns.push(...sheetColumns(member.fields, `${path}[${i}].`, key))
        else columns.push({path: `${path}[${i}]`, kind: kindOf(member?.type || 'string')})
      }
      continue
    }
    columns.push({path, kind: 'json'})
  }
  return columns
}

/** "buildings[2].services[1].label" -> ["buildings", 1, "services", 0, "label"] (list positions 0-based). */
function segments(path: string): Array<string | number> {
  const out: Array<string | number> = []
  for (const part of path.split('.')) {
    const match = part.match(/^([^[]+)((?:\[\d+\])*)$/)
    if (!match) throw new Error(`Bad column path: ${path}`)
    out.push(match[1])
    for (const index of match[2].matchAll(/\[(\d+)\]/g)) out.push(Number(index[1]) - 1)
  }
  return out
}

function getAt(doc: Json, path: string): unknown {
  let value: unknown = doc
  for (const segment of segments(path)) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Json)[segment as string]
  }
  return value
}

function setAt(doc: Json, path: string, value: unknown) {
  const parts = segments(path)
  let node: Json = doc
  parts.forEach((segment, i) => {
    if (i === parts.length - 1) { node[segment as string] = value; return }
    if (node[segment as string] == null) node[segment as string] = typeof parts[i + 1] === 'number' ? [] : {}
    node = node[segment as string]
  })
}

function cellOf(value: unknown, kind: Column['kind']): string {
  if (value === undefined || value === null || value === '') return ''
  if (kind === 'json') return JSON.stringify(value)
  if (kind === 'slug') return typeof value === 'object' ? String((value as Json).current ?? '') : String(value)
  return String(value)
}

/** Every column that would lose data, as "path (n items, m columns)". Empty when the page fits. */
export function overflow(doc: Json, columns: Column[]): string[] {
  const listPaths = new Map<string, number>()
  for (const column of columns) {
    const match = column.path.match(/^(.*?)\[(\d+)\](?!.*\[)/)
    if (match) listPaths.set(match[1].replace(/\[\d+\]/g, '[]'), Math.max(listPaths.get(match[1].replace(/\[\d+\]/g, '[]')) || 0, Number(match[2])))
  }
  const problems: string[] = []
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      const capacity = listPaths.get(path)
      if (capacity !== undefined && value.length > capacity) problems.push(`${path} (${value.length} items, ${capacity} columns)`)
      value.forEach((item) => visit(item, `${path}[]`))
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) if (!key.startsWith('_') && !JSON_FIELDS.has(key)) visit(child, path ? `${path}.${key}` : key)
    }
  }
  visit(doc, '')
  return problems
}

export function flatten(doc: Json, columns: Column[]): Record<string, string> {
  return Object.fromEntries(columns.map((column) => [column.path, cellOf(getAt(doc, column.path), column.kind)]))
}

/** Drops empty list items (all their cells blank) and gives each remaining item a stable _key. */
function tidy(value: unknown, name = ''): unknown {
  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== undefined && item !== null && item !== '' && !(typeof item === 'object' && Object.keys(item).length === 0))
    return items.map((item, i) => (item && typeof item === 'object' && !Array.isArray(item) ? {_key: `${name}-${i + 1}`, ...(tidy(item) as Json)} : item))
  }
  if (value && typeof value === 'object') {
    const out: Json = {}
    for (const [key, child] of Object.entries(value)) {
      const clean = tidy(child, key)
      if (clean !== undefined && !(Array.isArray(clean) && clean.length === 0) && !(clean && typeof clean === 'object' && !Array.isArray(clean) && Object.keys(clean).length === 0)) out[key] = clean
    }
    return out
  }
  return value
}

export type RowResult = {doc: Json; errors: string[]}

/** One sheet row -> the page's Sanity fields (no _id or _type). Bad numbers and bad JSON are errors, never guesses. */
export function unflatten(row: Record<string, string>, columns: Column[]): RowResult {
  const doc: Json = {}
  const errors: string[] = []
  for (const column of columns) {
    const raw = (row[column.path] ?? '').trim()
    if (!raw) continue
    if (column.kind === 'number') {
      const n = Number(raw.replace(/,/g, ''))
      if (!Number.isFinite(n)) { errors.push(`${column.path}: "${raw}" is not a number`); continue }
      setAt(doc, column.path, n)
    } else if (column.kind === 'json') {
      try { setAt(doc, column.path, JSON.parse(raw)) } catch { errors.push(`${column.path}: not valid JSON`) }
    } else if (column.kind === 'slug') setAt(doc, column.path, {_type: 'slug', current: raw})
    else setAt(doc, column.path, raw)
  }
  return {doc: tidy(doc) as Json, errors}
}

/** Columns in a sheet that are not fields (a typo in a heading would otherwise drop data silently). */
export function unknownColumns(headers: string[], columns: Column[]): string[] {
  const known = new Set([...META_COLUMNS, ...columns.map((column) => column.path)])
  return headers.filter((header) => header && !known.has(header))
}

const quote = (cell: string) => (/[",\r\n]/.test(cell) || /^\s|\s$/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)
export function toCsv(headers: string[], rows: Array<Record<string, string>>): string {
  return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))].map((cells) => cells.map(quote).join(',')).join('\r\n') + '\r\n'
}
export function fromCsv(text: string): {headers: string[]; rows: Array<Record<string, string>>} {
  const [headers = [], ...body] = parseCsvRows(text)
  return {headers, rows: body.map((cells) => Object.fromEntries(headers.map((name, i) => [name, cells[i] ?? ''])))}
}

/**
 * Why a row must not be imported because Sanity moved on after the sheet was exported, or undefined when it is safe.
 * `rowUpdatedAt` is the row's _updatedAt cell (the page's last edit when exported); `sanityUpdatedAt` is the page's
 * latest edit in Sanity now (draft or published), undefined for a page Sanity doesn't have yet.
 */
export function staleReason(rowUpdatedAt: string, sanityUpdatedAt?: string): string | undefined {
  if (!sanityUpdatedAt) return undefined
  if (!rowUpdatedAt.trim()) return 'this page already exists in Sanity but the row has no _updatedAt: export a fresh sheet and redo the edit there'
  const row = Date.parse(rowUpdatedAt)
  if (Number.isNaN(row)) return `_updatedAt "${rowUpdatedAt}" is not a date: export a fresh sheet`
  if (Date.parse(sanityUpdatedAt) > row) return `changed in Sanity (${sanityUpdatedAt}) after this sheet was exported (${rowUpdatedAt}): export a fresh sheet and redo the edit`
  return undefined
}

/** A page with system fields and _key removed, empty values dropped and keys sorted, for comparing two versions. */
export function comparable(doc: Json): Json {
  const strip = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(strip)
    if (value && typeof value === 'object') {
      const out: Json = {}
      // Keys sorted: Sanity returns fields alphabetically, the sheet in schema order.
      for (const [key, child] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
        if (key.startsWith('_') && key !== '_type') continue
        if (key === '_type' && (value as Json)[key] !== 'slug') continue
        if (child === '' || child === null || child === undefined) continue
        out[key] = strip(child)
      }
      return out
    }
    return value
  }
  return strip(doc) as Json
}
