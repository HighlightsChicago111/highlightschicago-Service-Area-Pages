/**
 * Service area pages <-> spreadsheet (one row per page, exact Sanity field paths as headings).
 *
 *   pnpm sheet:export                       published area pages -> exports/service-area-pages.csv
 *   pnpm sheet:export -- --include-drafts   also pages not published yet (draft only, or only in this repo)
 *   pnpm sheet:export -- --out pages.csv
 *   pnpm sheet:import -- --file pages.csv   dry run: checks every row, lists what would change
 *   pnpm sheet:import -- --file pages.csv --only evanston,oak-park
 *   pnpm sheet:import -- --file pages.csv --yes          writes the changed pages as DRAFTS
 *
 * Export writes each published page as it is live (unpublished draft changes are left out). With
 * --include-drafts it also writes draft-only pages and pages that exist only in this repo. Every row is
 * unflattened again before it is written, and the export stops if any value would be lost.
 * Import compares each row with the page's latest version in Sanity, skips rows for pages edited in Sanity
 * after the export (_updatedAt), and never publishes: a person reviews the draft in the Studio.
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'
import {areaPage} from '../src/sanity/schemaTypes/areaPage'
import {loadLocalEnv, sanityTarget} from './lib/env'
import {changedFields, checkRow, idForSlug, stripSystem} from './lib/sheet-rules'
import {comparable, flatten, fromCsv, META_COLUMNS, overflow, sheetColumns, staleReason, toCsv, unflatten, unknownColumns, type SchemaField} from './lib/sheet'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents

const args = process.argv.slice(2)
const command = args[0]
const flag = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const columns = sheetColumns((areaPage as unknown as {fields: SchemaField[]}).fields)
const headers = [...META_COLUMNS, ...columns.map((column) => column.path)]
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function client(withToken: 'read' | 'write') {
  loadLocalEnv()
  const token = withToken === 'write' ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error(`No Sanity ${withToken} token in .env.local`)
  return createClient({...sanityTarget(), token, useCdn: false, perspective: 'raw'})
}

type Versions = {published?: Json; draft?: Json}
/** Sanity's area pages by _id (area-<slug>), with their published and draft versions. */
async function sanityPages(): Promise<Map<string, Versions>> {
  const docs = await client('read').fetch<Json[]>('*[_type == "areaPage"] | order(_id asc)')
  const pages = new Map<string, Versions>()
  for (const doc of docs) {
    const draft = doc._id.startsWith('drafts.')
    const id = draft ? doc._id.slice('drafts.'.length) : doc._id
    pages.set(id, {...pages.get(id), [draft ? 'draft' : 'published']: doc})
  }
  return pages
}
/** The page as an editor sees it now: the draft if there is one, otherwise the published version. */
const latest = (v?: Versions) => v?.draft ?? v?.published
const lastEdit = (v?: Versions) => [v?.draft?._updatedAt, v?.published?._updatedAt].filter(Boolean).sort().pop() as string | undefined

async function exportSheet() {
  const out = flag('--out') || 'exports/service-area-pages.csv'
  const includeDrafts = args.includes('--include-drafts')
  const versions = await sanityPages()
  const pages = new Map<string, {doc: Json; status: string; updatedAt: string}>()
  for (const [id, v] of versions) {
    const updatedAt = lastEdit(v) || ''
    if (v.published) pages.set(id, {doc: v.published, updatedAt, status: v.draft ? 'published (unpublished draft changes not in this row)' : 'published'})
    else if (includeDrafts && v.draft) pages.set(id, {doc: v.draft, updatedAt, status: 'draft only'})
  }
  const skipped = [...versions].filter(([id]) => !pages.has(id)).map(([id]) => id)
  if (includeDrafts) {
    const repoFile = path.resolve('data/area-documents.json')
    const repoDocs: Json[] = fs.existsSync(repoFile) ? JSON.parse(fs.readFileSync(repoFile, 'utf8')) : []
    for (const doc of repoDocs.filter((d) => d._type === 'areaPage' && !versions.has(d._id))) pages.set(doc._id, {doc, updatedAt: '', status: 'repo only (not in Sanity)'})
  }

  const rows: Array<Record<string, string>> = []
  const problems: string[] = []
  for (const [id, {doc, status, updatedAt}] of [...pages].sort((a, b) => String(a[1].doc.area).localeCompare(String(b[1].doc.area)))) {
    for (const lost of overflow(doc, columns)) problems.push(`${id}: ${lost}`)
    const row = {_id: id, _status: status, _updatedAt: updatedAt, ...flatten(doc, columns)}
    // Prove the row carries the whole page: unflatten it and compare with the source.
    const back = unflatten(row, columns)
    if (back.errors.length || !same(comparable(back.doc), comparable(stripSystem(doc)))) problems.push(`${id}: the row does not round-trip to the same page`)
    rows.push(row)
  }
  if (problems.length) throw new Error(`Export stopped, data would be lost:\n  ${problems.join('\n  ')}`)
  fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true})
  fs.writeFileSync(out, '﻿' + toCsv(headers, rows))
  console.log(`Wrote ${out}: ${rows.length} pages x ${headers.length} columns (${META_COLUMNS.length} bookkeeping + ${columns.length} fields).`)
  for (const row of rows) console.log(`  ${row._id.padEnd(24)} ${row._status}`)
  if (skipped.length) console.log(`Not published, left out (add --include-drafts to include): ${skipped.join(', ')}`)
}


async function importSheet() {
  const file = flag('--file')
  if (!file) throw new Error('Pass the sheet as --file <path to the CSV download>')
  const only = flag('--only') ? new Set(flag('--only')!.split(',').map((s) => s.trim()).filter(Boolean)) : null
  const write = args.includes('--yes')
  const {headers: sheetHeaders, rows} = fromCsv(fs.readFileSync(file, 'utf8'))

  const unknown = unknownColumns(sheetHeaders, columns)
  if (unknown.length) throw new Error(`These headings are not Sanity fields (check the spelling, or export a fresh sheet):\n  ${unknown.join('\n  ')}`)
  const missing = columns.map((c) => c.path).filter((p) => !sheetHeaders.includes(p))
  if (missing.length) console.log(`Note: ${missing.length} field column(s) are not in this sheet and stay empty, e.g. ${missing.slice(0, 3).join(', ')}`)

  const current = await sanityPages()
  const target = sanityTarget()
  const toWrite: Json[] = []
  let blocked = 0
  console.log(`Target: Sanity project ${target.projectId}, dataset ${target.dataset}. Mode: ${write ? 'WRITE DRAFTS' : 'dry run (nothing is written)'}`)
  for (const [index, row] of rows.entries()) {
    const {doc, errors} = unflatten(row, columns)
    const slug = doc.slug?.current || ''
    if (only && !only.has(slug)) continue
    const where = `row ${index + 2} (${slug || 'no slug'})`
    const check = checkRow(doc, (row._id || '').trim())
    errors.push(...check.errors)
    const id = idForSlug(slug)
    const existing = latest(current.get(id))
    const stale = staleReason(row._updatedAt || '', lastEdit(current.get(id)))
    if (stale) errors.push(stale)
    const changes = errors.length ? [] : changedFields(doc, existing)
    if (errors.length) { blocked++; console.log(`\n✗ ${where}: not imported\n    ${errors.join('\n    ')}`); continue }
    console.log(`\n${changes.length ? '•' : '='} ${where}: ${changes.length ? `${changes.length} field(s) differ from Sanity: ${changes.join(', ')}` : 'same as Sanity, nothing to write'}`)
    for (const warning of check.warnings) console.log(`    warning: ${warning}`)
    if (changes.length) toWrite.push({_id: `drafts.${id}`, _type: 'areaPage', ...doc})
  }
  console.log(`\n${toWrite.length} page(s) to write as drafts, ${blocked} row(s) blocked.`)
  if (!write) { console.log('Dry run: nothing was written. Add --yes to write the drafts.'); return }
  if (blocked) throw new Error('Fix the blocked rows first (or limit the import with --only).')
  if (!toWrite.length) return
  const sanity = client('write')
  let transaction = sanity.transaction()
  for (const doc of toWrite) transaction = transaction.createOrReplace(doc as {_id: string; _type: string})
  const result = await transaction.commit()
  const written = await sanity.fetch<string[]>('*[_id in $ids]._id', {ids: toWrite.map((doc) => doc._id)})
  if (written.length !== toWrite.length) throw new Error(`Verification failed: expected ${toWrite.length} drafts, found ${written.length}`)
  console.log(`Committed transaction ${result.transactionId}. Verified ${written.length} draft(s). Review and publish them in the Studio.`)
}

;(command === 'export' ? exportSheet() : command === 'import' ? importSheet() : Promise.reject(new Error('Use: area-sheet.ts export | import')))
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exit(1) })
