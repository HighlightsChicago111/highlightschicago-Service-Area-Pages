/**
 * Runs the generated apps-script/ServiceAreaPages.gs in a simulated Google Sheet (fake SpreadsheetApp,
 * UrlFetchApp, PropertiesService, HtmlService) and checks every path: wrong tab, check, push, stale row,
 * misspelled heading, the user saying No, dates and numbers in cells. Offline: uses data/area-documents.json.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {areaPage} from '../src/sanity/schemaTypes/areaPage'
import {buildAppsScript, OUT_FILE} from './build-apps-script'
import {flatten, META_COLUMNS, sheetColumns, type SchemaField} from './lib/sheet'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form documents
const columns = sheetColumns((areaPage as unknown as {fields: SchemaField[]}).fields)
const headers = [...META_COLUMNS, ...columns.map((column) => column.path)]
const pages: Json[] = JSON.parse(fs.readFileSync('data/area-documents.json', 'utf8')).filter((doc: Json) => doc._type === 'areaPage')
const UPDATED = '2026-10-23T07:06:59Z'

type World = {
  tab: string; grid: unknown[][]; selected: number[]; answer: 'YES' | 'NO'; token: string | null; sanityDocs: Json[]
  alerts: string[]; dialogs: string[]; mutations: Json[]; fetches: string[]; formats: string[]; rejectNewToken: boolean
}

function makeWorld(over: Partial<World> = {}): World {
  const rows = pages.map((page) => headers.map((h) => (h === '_id' ? page._id : h === '_status' ? 'published' : h === '_updatedAt' ? UPDATED : flatten(page, columns)[h])))
  return {
    tab: 'Service area pages', grid: [[...headers], ...rows], selected: [2], answer: 'YES', token: 'sk-test', alerts: [], dialogs: [], mutations: [], fetches: [], formats: [], rejectNewToken: false,
    sanityDocs: pages.map((page) => ({...page, _updatedAt: UPDATED})), ...over,
  }
}

function run(world: World, action: string) {
  const range = (row: number, col: number, nRows = 1, nCols = 1) => ({
    getValues: () => world.grid.slice(row - 1, row - 1 + nRows).map((r) => Array.from({length: nCols}, (_, i) => r[col - 1 + i] ?? '')),
    setValue: (value: unknown) => { world.grid[row - 1][col - 1] = value; return range(row, col) },
    setNumberFormat: (format: string) => { world.formats.push(`${row}:${col}:${format}`); return range(row, col) },
    getRow: () => row, getNumRows: () => nRows,
  })
  const sheet = {
    getName: () => world.tab,
    getLastColumn: () => world.grid[0].length,
    getLastRow: () => world.grid.length,
    getRange: range,
    getActiveRangeList: () => ({getRanges: () => world.selected.map((r) => range(r, 1))}),
    getActiveRange: () => range(world.selected[0], 1),
  }
  const ui = {
    ButtonSet: {OK: 'OK', YES_NO: 'YES_NO', OK_CANCEL: 'OK_CANCEL'}, Button: {YES: 'YES', NO: 'NO', OK: 'OK'},
    alert: (...args: string[]) => { world.alerts.push(args.slice(0, 2).join(' | ')); return args[2] === 'YES_NO' ? world.answer : 'OK' },
    showModalDialog: (html: {text: string}, title: string) => world.dialogs.push(`${title}\n${html.text}`),
    prompt: () => ({getSelectedButton: () => 'OK', getResponseText: () => 'sk-new'}),
    createMenu: () => ({addItem() { return this }, addSeparator() { return this }, addToUi() { world.alerts.push('menu added') }}),
  }
  const respond = (status: number, body: Json) => ({getResponseCode: () => status, getContentText: () => JSON.stringify(body)})
  const UrlFetchApp = {
    fetch: (url: string, options: Json) => {
      world.fetches.push(url)
      const ok = options.headers.Authorization === `Bearer ${world.token}` || (options.headers.Authorization === 'Bearer sk-new' && !world.rejectNewToken)
      if (!ok) return respond(401, {})
      if (url.includes('/data/mutate/')) {
        const {mutations} = JSON.parse(options.payload)
        world.mutations.push(...mutations)
        for (const m of mutations) world.sanityDocs = [...world.sanityDocs.filter((d) => d._id !== m.createOrReplace._id), {...m.createOrReplace, _updatedAt: '2026-10-31T10:00:00Z'}]
        return respond(200, {transactionId: 'tx-1'})
      }
      const params = Object.fromEntries(new URL(url).searchParams)
      if (params.query.startsWith('count(')) return respond(200, {result: world.sanityDocs.length})
      const ids: string[] = JSON.parse(params.$ids)
      const drafts: string[] = params.$drafts ? JSON.parse(params.$drafts) : []
      return respond(200, {result: world.sanityDocs.filter((d) => ids.includes(d._id) || drafts.includes(d._id))})
    },
  }
  const context = vm.createContext({
    SpreadsheetApp: {getUi: () => ui, getActiveSheet: () => sheet},
    UrlFetchApp,
    PropertiesService: {getUserProperties: () => ({getProperty: () => world.token, setProperty: (_k: string, v: string) => { world.token = v }})},
    HtmlService: {createHtmlOutput: (text: string) => ({text, setWidth() { return this }, setHeight() { return this }})},
    URL, encodeURIComponent, JSON, Date,
  })
  vm.runInContext(fs.readFileSync(OUT_FILE, 'utf8') + `\n${action}()`, context)
}

const col = (name: string) => headers.indexOf(name)
let passed = 0
async function check(name: string, body: () => void | Promise<void>) {
  try { await body(); passed++; console.log(`ok - ${name}`) } catch (error) { console.error(`not ok - ${name}`); throw error }
}

async function main() {
  await check('the committed ServiceAreaPages.gs matches the current schema and code (run pnpm apps-script:build)', async () => {
    // Line endings ignored: git may check the file out with CRLF on Windows.
    const lf = (text: string) => text.replace(/\r\n/g, '\n')
    assert.equal(lf(fs.readFileSync(OUT_FILE, 'utf8')), lf(await buildAppsScript()))
  })
  await check('the menu only adds this tab\'s actions, and Menu.gs calls it by name', () => {
    const world = makeWorld()
    run(world, 'serviceAreaPagesMenu')
    assert.deepEqual(world.alerts, ['menu added'])
    assert.match(fs.readFileSync('apps-script/Menu.gs', 'utf8'), /'serviceAreaPagesMenu'/)
    assert.doesNotMatch(fs.readFileSync(OUT_FILE, 'utf8'), /function onOpen/)
  })
  await check('on any other tab nothing is read or written', () => {
    const world = makeWorld({tab: 'Service pages'})
    run(world, 'serviceAreaPagesPush')
    assert.match(world.alerts[0], /Open the "Service area pages" tab/)
    assert.equal(world.fetches.length, 0)
  })
  await check('an unchanged row is reported as the same as Sanity and nothing is written', () => {
    const world = makeWorld()
    run(world, 'serviceAreaPagesPush')
    assert.match(world.dialogs[0], /Nothing to push[\s\S]*same as Sanity/)
    assert.equal(world.mutations.length, 0)
  })
  await check('an edited row is pushed as a draft of that page after Yes, and the row is stamped', () => {
    const world = makeWorld()
    world.grid[1][col('heroLede')] = 'Edited in the sheet.'
    run(world, 'serviceAreaPagesPush')
    assert.match(world.alerts[0], /Write drafts to Sanity\? \| Project hzu8fe77, dataset production/)
    assert.equal(world.mutations.length, 1)
    const doc = world.mutations[0].createOrReplace
    assert.equal(doc._id, `drafts.${pages[0]._id}`)
    assert.equal(doc._type, 'areaPage')
    assert.equal(doc.heroLede, 'Edited in the sheet.')
    assert.equal(doc.districts.length, pages[0].districts.length)
    assert.match(String(world.grid[1][col('_status')]), /^draft pushed .* publish in the Studio$/)
    assert.equal(world.grid[1][col('_updatedAt')], '2026-10-31T10:00:00Z')
    assert.ok(world.formats.includes(`2:${col('_updatedAt') + 1}:@`))
  })
  await check('answering No writes nothing', () => {
    const world = makeWorld({answer: 'NO'})
    world.grid[1][col('heroLede')] = 'Edited in the sheet.'
    run(world, 'serviceAreaPagesPush')
    assert.equal(world.mutations.length, 0)
    assert.equal(world.grid[1][col('_status')], 'published')
  })
  await check('a row older than the page in Sanity is refused, so newer work is never overwritten', () => {
    const world = makeWorld()
    world.grid[1][col('heroLede')] = 'Edited in the sheet.'
    world.sanityDocs = world.sanityDocs.map((d) => (d._id === pages[0]._id ? {...d, _updatedAt: '2026-10-30T00:00:00Z'} : d))
    run(world, 'serviceAreaPagesPush')
    assert.match(world.dialogs[0], /Not pushed[\s\S]*after this sheet was exported/)
    assert.equal(world.mutations.length, 0)
  })
  await check('a new page row (no _id, no _updatedAt) is pushed as a new draft', () => {
    const world = makeWorld()
    world.grid[1][col('_id')] = ''
    world.grid[1][col('_updatedAt')] = ''
    world.grid[1][col('slug')] = 'new-area'
    run(world, 'serviceAreaPagesPush')
    assert.equal(world.mutations[0].createOrReplace._id, 'drafts.area-new-area')
    assert.equal(world.grid[1][col('_id')], 'area-new-area')
  })
  await check('a misspelled heading stops everything before Sanity is called', () => {
    const world = makeWorld()
    world.grid[0][col('heroLede')] = 'heroLeed'
    run(world, 'serviceAreaPagesPush')
    assert.match(world.alerts[0], /heroLeed/)
    assert.equal(world.fetches.length, 0)
  })
  await check('dates and numbers that Sheets converted are read back exactly', () => {
    const world = makeWorld()
    world.grid[1][col('_updatedAt')] = new Date(UPDATED)
    world.grid[1][col('bbox.north')] = 41.947
    world.grid[1][col('zips[1]')] = 60201
    world.grid[1][col('heroLede')] = 'Edited in the sheet.'
    run(world, 'serviceAreaPagesPush')
    const doc = world.mutations[0].createOrReplace
    assert.equal(doc.bbox.north, 41.947)
    assert.equal(doc.zips[0], '60201')
    // A Date cell must be read as its exact ISO time, not the locale string ("Fri Oct 23 2026 ..."), so a stale
    // check one second later still refuses it.
    const stale = makeWorld()
    stale.grid[1][col('_updatedAt')] = new Date(UPDATED)
    stale.grid[1][col('heroLede')] = 'Edited in the sheet.'
    stale.sanityDocs = stale.sanityDocs.map((d) => (d._id === pages[0]._id ? {...d, _updatedAt: '2026-10-23T07:07:00Z'} : d))
    run(stale, 'serviceAreaPagesPush')
    assert.equal(stale.mutations.length, 0)
  })
  await check('two rows with the same slug are refused', () => {
    const world = makeWorld({selected: [2, 3]})
    world.grid[2] = [...world.grid[1]]
    world.grid[2][col('heroLede')] = 'Edited in the sheet.'
    run(world, 'serviceAreaPagesPush')
    assert.match(world.dialogs[0], /same slug as row 2/)
    assert.equal(world.mutations.length, 0)
  })
  await check('a token is saved only after Sanity accepts it', () => {
    const accepted = makeWorld({token: 'sk-old'})
    run(accepted, 'serviceAreaPagesSetToken')
    assert.equal(accepted.token, 'sk-new')
    assert.match(accepted.alerts.at(-1) || '', /Token saved/)
    const rejected = makeWorld({token: 'sk-old', rejectNewToken: true})
    run(rejected, 'serviceAreaPagesSetToken')
    assert.equal(rejected.token, 'sk-old')
    assert.match(rejected.alerts.at(-1) || '', /refused the token/)
  })
  console.log(`\n${passed} Apps Script checks passed`)
}

main().catch((e) => { console.error(e); process.exit(1) })
