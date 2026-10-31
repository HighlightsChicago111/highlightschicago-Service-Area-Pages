/** Tests for the sheet mapping (scripts/lib/sheet.ts). Offline: uses data/area-documents.json. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {areaPage} from '../src/sanity/schemaTypes/areaPage'
import {comparable, flatten, fromCsv, META_COLUMNS, overflow, sheetColumns, staleReason, toCsv, unflatten, unknownColumns, type SchemaField} from './lib/sheet'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form documents
const fields = (areaPage as unknown as {fields: SchemaField[]}).fields
const columns = sheetColumns(fields)
const headers = [...META_COLUMNS, ...columns.map((column) => column.path)]
const pages: Json[] = JSON.parse(fs.readFileSync('data/area-documents.json', 'utf8')).filter((doc: Json) => doc._type === 'areaPage')
const strip = ({_id, _type, ...rest}: Json) => rest // eslint-disable-line @typescript-eslint/no-unused-vars
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const viaCsv = (rows: Array<Record<string, string>>) => fromCsv('﻿' + toCsv(headers, rows))

let passed = 0
async function check(name: string, run: () => void | Promise<void>) {
  try { await run(); passed++; console.log(`ok - ${name}`) } catch (error) { console.error(`not ok - ${name}`); throw error }
}

async function main() {
  await check('every schema field has at least one column, headed by its exact field name', () => {
    for (const field of fields) assert.ok(columns.some((column) => column.path === field.name || column.path.startsWith(`${field.name}.`) || column.path.startsWith(`${field.name}[`)), field.name)
  })
  await check('every page survives the trip to a CSV sheet and back, exactly', () => {
    assert.ok(pages.length >= 2)
    const {headers: read, rows} = viaCsv(pages.map((page) => flatten(page, columns)))
    assert.deepEqual(read, headers)
    rows.forEach((row, i) => {
      const back = unflatten(row, columns)
      assert.deepEqual(back.errors, [])
      assert.ok(same(comparable(back.doc), comparable(strip(pages[i]))), `${pages[i]._id} changed on the way through the sheet`)
    })
  })
  await check('text with commas, quotes, line breaks and edge spaces keeps every character', () => {
    const tricky = 'Line one, with "quotes"\r\nline two  '
    const page = {...strip(pages[0]), heroLede: tricky, ctaReady: ['a, b', ' leading space']}
    const back = unflatten(viaCsv([flatten(page, columns)]).rows[0], columns)
    assert.equal(back.doc.heroLede, tricky.trim())
    assert.deepEqual(back.doc.ctaReady, ['a, b', 'leading space'])
  })
  await check('editing one cell changes exactly that field', () => {
    const row = flatten(pages[0], columns)
    row['districts[2].intro'] = 'A new intro.'
    const back = unflatten(row, columns).doc
    const a = comparable(back), b = comparable(strip(pages[0]))
    const changed = Object.keys({...a, ...b}).filter((key) => !same(a[key], b[key]))
    assert.deepEqual(changed, ['districts'])
    assert.equal(back.districts[1].intro, 'A new intro.')
  })
  await check('a misspelled heading is reported instead of silently dropped', () => {
    assert.deepEqual(unknownColumns([...headers, 'heroLeed', 'districts[2].nmae'], columns), ['heroLeed', 'districts[2].nmae'])
    assert.deepEqual(unknownColumns(headers, columns), [])
  })
  await check('a bad number or broken JSON is an error, not a guess', () => {
    const row = flatten(pages[0], columns)
    row['bbox.north'] = 'north of Howard'
    row.map = '{"height": 900,'
    const {errors} = unflatten(row, columns)
    assert.ok(errors.some((e) => e.startsWith('bbox.north')))
    assert.ok(errors.some((e) => e.startsWith('map')))
  })
  await check('blank list items are dropped and the rest keep their order', () => {
    const row = flatten(pages[0], columns)
    for (const part of ['name', 'intro', 'work']) row[`districts[2].${part}`] = ''
    const back = unflatten(row, columns).doc
    assert.equal(back.districts.length, pages[0].districts.length - 1)
    assert.equal(back.districts[1].name, pages[0].districts[2].name)
    assert.ok(back.districts.every((d: Json, i: number) => d._key === `districts-${i + 1}`))
  })
  await check('a list longer than its columns is reported, so nothing is cut off', () => {
    const page = {...pages[0], faq: Array.from({length: 7}, (_, i) => ({key: `faq-${i}`, question: 'Q', answer: 'A'}))}
    assert.deepEqual(overflow(page, columns), ['faq (7 items, 6 columns)'])
    assert.deepEqual(overflow(pages[0], columns), [])
  })
  await check('a row is refused when the page changed in Sanity after the export, and allowed otherwise', () => {
    assert.equal(staleReason('2026-10-23T07:06:59Z', '2026-10-23T07:06:59Z'), undefined)
    assert.equal(staleReason('2026-10-23T07:06:59Z', '2026-10-01T00:00:00Z'), undefined)
    assert.equal(staleReason('', undefined), undefined)
    assert.match(staleReason('2026-10-23T07:06:59Z', '2026-10-24T09:00:00Z') || '', /after this sheet was exported/)
    assert.match(staleReason('', '2026-10-24T09:00:00Z') || '', /no _updatedAt/)
    assert.match(staleReason('yesterday', '2026-10-24T09:00:00Z') || '', /not a date/)
  })
  console.log(`\n${passed} sheet checks passed`)
}

main().catch(() => process.exit(1))
