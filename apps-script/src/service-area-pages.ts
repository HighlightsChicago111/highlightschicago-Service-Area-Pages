/**
 * Google Sheet -> Sanity for the "Service area pages" tab only.
 *
 * Bundled by scripts/build-apps-script.ts into apps-script/ServiceAreaPages.gs, which is pasted into the
 * spreadsheet's Apps Script project (Extensions -> Apps Script). The column list, the Sanity project and the
 * row checks come from this repo (scripts/lib/sheet.ts, scripts/lib/sheet-rules.ts), so the sheet maps to the
 * same exact field paths as `pnpm sheet:import`.
 *
 * The other tabs (service pages, brand service pages) belong to other projects and are never read or written.
 * Writes are drafts only, after a confirmation that names the Sanity project; nothing is ever published.
 */
import {buildAreaDocuments} from '../../scripts/lib/area-transform'
import {flatten, META_COLUMNS, overflow, staleReason, unflatten, unknownColumns, type Column} from '../../scripts/lib/sheet'
import {changedFields, checkRow, idForSlug} from '../../scripts/lib/sheet-rules'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents

// Injected at build time from the Sanity schema and this project's settings.
declare const __COLUMNS__: Column[]
declare const __CONFIG__: {projectId: string; dataset: string; apiVersion: string; tab: string; studioUrl: string}
// The company facts and the Google review pack the build reads (content/company.json, content/highlights-reviews.csv).
declare const __COMPANY__: Json
declare const __REVIEWS__: Array<Record<string, string>>

// Apps Script globals (no type package needed for the few calls used here).
declare const SpreadsheetApp: any // eslint-disable-line @typescript-eslint/no-explicit-any
declare const UrlFetchApp: any // eslint-disable-line @typescript-eslint/no-explicit-any
declare const PropertiesService: any // eslint-disable-line @typescript-eslint/no-explicit-any
declare const HtmlService: any // eslint-disable-line @typescript-eslint/no-explicit-any

const COLUMNS = __COLUMNS__
const CONFIG = __CONFIG__
const TOKEN_KEY = 'SERVICE_AREA_PAGES_SANITY_TOKEN'
const MENU = 'Service area pages → Sanity'

type RowCheck = {rowNumber: number; slug: string; id: string; doc: Json; errors: string[]; warnings: string[]; changes: string[]}

const ui = () => SpreadsheetApp.getUi()

function token(): string {
  const value = PropertiesService.getUserProperties().getProperty(TOKEN_KEY)
  if (!value) throw new Error(`No Sanity token yet. Use "${MENU} → Set my Sanity token" first (an Editor token for project ${CONFIG.projectId}).`)
  return value
}

function sanity(path: string, payload?: Json, withToken = token()): Json {
  const url = `https://${CONFIG.projectId}.api.sanity.io/v${CONFIG.apiVersion}/data/${path}`
  const response = UrlFetchApp.fetch(url, {
    method: payload ? 'post' : 'get',
    contentType: 'application/json',
    headers: {Authorization: `Bearer ${withToken}`},
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true,
  })
  const status = response.getResponseCode()
  const body = JSON.parse(response.getContentText() || '{}')
  if (status === 401 || status === 403) throw new Error(`Sanity refused the token (${status}). Set a valid Editor token for project ${CONFIG.projectId}.`)
  if (status >= 300) throw new Error(`Sanity answered ${status}: ${body.error?.description || body.message || 'unknown error'}`)
  return body
}

/** A GROQ query that sees drafts too: since API 2025-02-19 Sanity hides them unless perspective=raw. */
const query = (groq: string, params: Json, withToken?: string) =>
  sanity(`query/${CONFIG.dataset}?${Object.entries({query: groq, perspective: 'raw', ...Object.fromEntries(Object.entries(params).map(([k, v]) => [`$${k}`, JSON.stringify(v)]))})
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`, undefined, withToken).result

/** A cell as text: dates become ISO times (Sheets turns imported times into dates), numbers keep every digit. */
function cellText(value: unknown): string {
  if (Object.prototype.toString.call(value) === '[object Date]') return (value as Date).toISOString()
  if (value === null || value === undefined) return ''
  return String(value)
}

/** The "Service area pages" tab, its headings and the rows the user selected (the row of the active cell if one). */
function selection(): {sheet: any; headers: string[]; rows: Array<{rowNumber: number; record: Record<string, string>}>} { // eslint-disable-line @typescript-eslint/no-explicit-any
  const sheet = SpreadsheetApp.getActiveSheet()
  if (sheet.getName() !== CONFIG.tab) throw new Error(`Open the "${CONFIG.tab}" tab and select the page rows first. This menu never reads other tabs.`)
  const lastColumn = sheet.getLastColumn()
  const headers: string[] = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(cellText)
  const unknown = unknownColumns(headers, COLUMNS)
  if (unknown.length) throw new Error(`These headings are not Sanity fields, so their cells would be lost (fix the spelling or paste fresh headings):\n${unknown.join('\n')}`)
  for (const meta of META_COLUMNS) if (!headers.includes(meta)) throw new Error(`The heading "${meta}" is missing; keep the ${META_COLUMNS.join(', ')} columns at the start.`)
  const numbers = new Set<number>()
  for (const range of sheet.getActiveRangeList()?.getRanges() || [sheet.getActiveRange()]) {
    for (let r = range.getRow(); r < range.getRow() + range.getNumRows(); r++) if (r > 1 && r <= sheet.getLastRow()) numbers.add(r)
  }
  if (!numbers.size) throw new Error('Select one or more page rows (click a cell in each row you want).')
  const rows = [...numbers].sort((a, b) => a - b).map((rowNumber) => {
    const values: unknown[] = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0]
    return {rowNumber, record: Object.fromEntries(headers.map((header, i) => [header, cellText(values[i])]))}
  })
  return {sheet, headers, rows}
}

function checkRows(rows: Array<{rowNumber: number; record: Record<string, string>}>): RowCheck[] {
  const ids = rows.map(({record}) => unflatten(record, COLUMNS).doc.slug?.current).filter(Boolean).map((slug: string) => idForSlug(slug))
  const docs: Json[] = ids.length ? query('*[_id in $ids || _id in $drafts]', {ids, drafts: ids.map((id) => `drafts.${id}`)}) : []
  return checkRowsAgainst(rows, docs)
}

/** The row checks against the given Sanity versions (published and draft) of the pages. */
export function checkRowsAgainst(rows: Array<{rowNumber: number; record: Record<string, string>}>, docs: Json[]): RowCheck[] {
  const parsed = rows.map(({rowNumber, record}) => {
    const {doc, errors} = unflatten(record, COLUMNS)
    const slug: string = doc.slug?.current || ''
    const check = checkRow(doc, (record._id || '').trim())
    return {rowNumber, record, doc, slug, id: slug ? idForSlug(slug) : '', errors: [...errors, ...check.errors], warnings: check.warnings}
  })
  const seen = new Map<string, number>()
  return parsed.map((p) => {
    const published = docs.find((d) => d._id === p.id)
    const draft = docs.find((d) => d._id === `drafts.${p.id}`)
    const lastEdit = [draft?._updatedAt, published?._updatedAt].filter(Boolean).sort().pop()
    const errors = [...p.errors]
    if (p.id && seen.has(p.id)) errors.push(`same slug as row ${seen.get(p.id)}`)
    if (p.id) seen.set(p.id, p.rowNumber)
    const stale = p.id ? staleReason(p.record._updatedAt || '', lastEdit) : undefined
    if (stale) errors.push(stale)
    return {...p, errors, changes: errors.length ? [] : changedFields(p.doc, draft || published)}
  })
}

function report(checks: RowCheck[]): string {
  return checks.map((c) => {
    const head = `Row ${c.rowNumber} (${c.slug || 'no slug'}): `
    if (c.errors.length) return `${head}NOT READY\n  - ${c.errors.join('\n  - ')}`
    const body = c.changes.length ? `${c.changes[0] === '(new page)' ? 'new page' : `${c.changes.length} field(s) differ from Sanity: ${c.changes.join(', ')}`}` : 'same as Sanity, nothing to push'
    return `${head}${body}${c.warnings.length ? `\n  warnings: ${c.warnings.join('; ')}` : ''}`
  }).join('\n\n')
}

function show(title: string, text: string) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  ui().showModalDialog(HtmlService.createHtmlOutput(`<pre style="white-space:pre-wrap;font:13px/1.5 monospace">${escaped}</pre>`).setWidth(720).setHeight(480), title)
}

function guarded(run: () => void) {
  try { run() } catch (error) { ui().alert(MENU, error instanceof Error ? error.message : String(error), ui().ButtonSet.OK) }
}

export function menu() {
  ui().createMenu(MENU)
    .addItem('Check selected rows', 'serviceAreaPagesCheck')
    .addItem('Push selected rows to Sanity as drafts', 'serviceAreaPagesPush')
    .addSeparator()
    .addItem('Add a page from Claude', 'serviceAreaPagesAdd')
    .addItem('Get a page for Claude', 'serviceAreaPagesGet')
    .addSeparator()
    .addItem('Load published pages from Sanity', 'serviceAreaPagesLoad')
    .addItem('Set my Sanity token', 'serviceAreaPagesSetToken')
    .addToUi()
}

export function check() {
  guarded(() => {
    const {rows} = selection()
    show('Check: service area pages', `Sanity project ${CONFIG.projectId}, dataset ${CONFIG.dataset}. Nothing was written.\n\n${report(checkRows(rows))}`)
  })
}

export function push() {
  guarded(() => {
    const {sheet, headers, rows} = selection()
    const checks = checkRows(rows)
    const blocked = checks.filter((c) => c.errors.length)
    if (blocked.length) { show('Not pushed: fix these rows first', report(checks)); return }
    const ready = checks.filter((c) => c.changes.length)
    if (!ready.length) { show('Nothing to push', report(checks)); return }
    const answer = ui().alert(
      'Write drafts to Sanity?',
      `Project ${CONFIG.projectId}, dataset ${CONFIG.dataset}.\n\n${ready.map((c) => `drafts.${c.id} (row ${c.rowNumber})`).join('\n')}\n\nThese become DRAFTS of the pages. Nothing is published: review and publish them in the Studio.`,
      ui().ButtonSet.YES_NO,
    )
    if (answer !== ui().Button.YES) return
    const result = sanity(`mutate/${CONFIG.dataset}?returnIds=true&visibility=sync`, {
      mutations: ready.map((c) => ({createOrReplace: {_id: `drafts.${c.id}`, _type: 'areaPage', ...c.doc}})),
    })
    const written: Json[] = query('*[_id in $ids]{_id, _updatedAt}', {ids: ready.map((c) => `drafts.${c.id}`)})
    if (written.length !== ready.length) throw new Error(`Sanity confirmed ${written.length} of ${ready.length} drafts (transaction ${result.transactionId}). Check the Studio.`)
    const col = (name: string) => headers.indexOf(name) + 1
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    for (const c of ready) {
      const updatedAt = written.find((w) => w._id === `drafts.${c.id}`)?._updatedAt || ''
      sheet.getRange(c.rowNumber, col('_id')).setValue(c.id)
      sheet.getRange(c.rowNumber, col('_status')).setValue(`draft pushed ${stamp} UTC, publish in the Studio`)
      // Plain text, so Sheets keeps the exact time the stale check compares against.
      sheet.getRange(c.rowNumber, col('_updatedAt')).setNumberFormat('@').setValue(updatedAt)
    }
    show('Drafts written', `Transaction ${result.transactionId}. ${ready.length} draft(s) in project ${CONFIG.projectId}:\n\n${ready.map((c) => `${c.id}: ${CONFIG.studioUrl}`).join('\n')}\n\nReview each one in the Studio and press Publish.`)
  })
}

/**
 * Fills the "Service area pages" tab from Sanity: every published page as it is live, one row each, headings
 * from the schema. Replaces the tab's contents after a confirmation that lists any rows whose edits are not in
 * Sanity yet (they would be lost). Reads Sanity only; never writes it. The tab is created if it doesn't exist.
 */
export function load() {
  guarded(() => {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    const docs: Json[] = query('*[_type == "areaPage"] | order(area asc)', {})
    const versions = new Map<string, {published?: Json; draft?: Json}>()
    for (const doc of docs) {
      const draft = doc._id.startsWith('drafts.')
      const id = draft ? doc._id.slice('drafts.'.length) : doc._id
      versions.set(id, {...versions.get(id), [draft ? 'draft' : 'published']: doc})
    }
    const headers = [...META_COLUMNS, ...COLUMNS.map((column) => column.path)]
    const rows: string[][] = []
    const lost: string[] = []
    for (const [id, v] of versions) {
      if (!v.published) continue
      for (const problem of overflow(v.published, COLUMNS)) lost.push(`${id}: ${problem}`)
      const updatedAt = [v.draft?._updatedAt, v.published._updatedAt].filter(Boolean).sort().pop() || ''
      const status = v.draft ? 'published (unpublished draft changes not in this row)' : 'published'
      const cells: Record<string, string> = {_id: id, _status: status, _updatedAt: updatedAt, ...flatten(v.published, COLUMNS)}
      rows.push(headers.map((header) => cells[header] ?? ''))
    }
    if (lost.length) throw new Error(`Not loaded: these pages have more items than the sheet has columns, so data would be lost:\n${lost.join('\n')}`)

    let sheet = spreadsheet.getSheetByName(CONFIG.tab)
    // Rows edited in the sheet but not pushed would be overwritten: name them before asking.
    const unpushed: string[] = []
    if (sheet && sheet.getLastRow() > 1) {
      const existing = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues().map((r: unknown[]) => r.map(cellText))
      const [head, ...body] = existing
      if (!unknownColumns(head, COLUMNS).length) {
        for (const values of body) {
          const record = Object.fromEntries(head.map((h: string, i: number) => [h, values[i]]))
          const {doc} = unflatten(record, COLUMNS)
          const id = doc.slug?.current ? idForSlug(doc.slug.current) : ''
          const current = id ? versions.get(id) : undefined
          if (!id) { if (Object.values(record).some(Boolean)) unpushed.push('a row with no slug'); continue }
          if (!current || changedFields(doc, current.draft || current.published).length) unpushed.push(id)
        }
      }
    }
    const answer = ui().alert(
      'Load published pages from Sanity?',
      `This replaces everything in the "${CONFIG.tab}" tab with the ${rows.length} published page(s) from Sanity project ${CONFIG.projectId}.` +
        (unpushed.length ? `\n\nThese rows have content that is not in Sanity and will be LOST (push them first or copy them elsewhere):\n${unpushed.join('\n')}` : '\n\nNo unpushed edits in the tab.') +
        '\n\nSanity is only read, never changed.',
      ui().ButtonSet.YES_NO,
    )
    if (answer !== ui().Button.YES) return
    if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.tab)
    sheet.clearContents()
    // Plain text everywhere, so Sheets never turns ZIP codes, times or JSON into numbers or dates.
    const range = sheet.getRange(1, 1, rows.length + 1, headers.length)
    range.setNumberFormat('@')
    range.setValues([headers, ...rows])
    sheet.setFrozenRows(1)
    show('Loaded', `${rows.length} published page(s) loaded into "${CONFIG.tab}", ${headers.length} columns. Row 1 holds the exact Sanity field names.`)
  })
}

export function setToken() {
  guarded(() => {
    const answer = ui().prompt('Set my Sanity token', `Paste an Editor token for Sanity project ${CONFIG.projectId} (sanity.io/manage → API → Tokens). It is stored for your Google account only and never shown again.`, ui().ButtonSet.OK_CANCEL)
    if (answer.getSelectedButton() !== ui().Button.OK) return
    const value = String(answer.getResponseText() || '').trim()
    if (!value) throw new Error('No token pasted.')
    // Saved only after Sanity accepts it.
    query('count(*[_type == "areaPage"])', {}, value)
    PropertiesService.getUserProperties().setProperty(TOKEN_KEY, value)
    ui().alert(MENU, `Token saved and accepted by project ${CONFIG.projectId}.`, ui().ButtonSet.OK)
  })
}

// ---------- Add a page from Claude, Get a page for Claude ----------

const COMPANY = __COMPANY__
const REVIEWS = __REVIEWS__

export type PreparedPage = {
  errors: string[]; warnings: string[]; placeholders: string[]; id: string; slug: string
  record: Record<string, string>; index: number; changes: string[]
}

/**
 * Everything "Add a page from Claude" decides, without Google services. The input is either the skill's area.json
 * (optionally wrapped as {"area": {...}, "permits": {...}}), which goes through the same build as
 * `pnpm content:build`, or an areaPage document from "Get a page for Claude".
 */
export function prepareAreaPage(input: unknown, headers: string[], records: Array<Record<string, string>>, docs: Json[]): PreparedPage {
  const result: PreparedPage = {errors: [], warnings: [], placeholders: [], id: '', slug: '', record: {}, index: -1, changes: []}
  if (!input || typeof input !== 'object' || Array.isArray(input)) { result.errors.push('Expected one page: a JSON object { ... }.'); return result }
  const given = input as Json
  let page: Json | undefined
  const fromBuild = !given._type
  if (given._type === 'areaPage') page = given
  else if (given._type) { result.errors.push(`This is a ${given._type}, not an areaPage (service area page).`); return result }
  else {
    const wrapped = given.area && typeof given.area === 'object'
    const config: Json = wrapped ? given.area : given
    const built = buildAreaDocuments({areas: [{folder: String(config.slug || ''), config, permits: wrapped ? given.permits : undefined}], company: COMPANY, reviews: REVIEWS})
    result.errors.push(...built.errors)
    result.warnings.push(...built.warnings)
    result.placeholders.push(...built.placeholders)
    page = built.documents.find((doc) => doc._type === 'areaPage')
    if (!page) { if (!result.errors.length) result.errors.push('The build made no area page from this file.'); return result }
  }

  // Every value must survive the trip into cells and back.
  result.errors.push(...overflow(page, COLUMNS))
  const cells = flatten(page, COLUMNS)
  const back = unflatten(cells, COLUMNS)
  result.errors.push(...back.errors)
  for (const field of changedFields(back.doc, page)) if (field !== '(new page)') result.errors.push(`${field}: not a field of the page, or a value the sheet cannot hold, so it would be lost`)

  result.slug = back.doc.slug?.current || ''
  const id = result.slug ? idForSlug(result.slug) : ''
  const givenId = String(given._id || '').replace(/^drafts\./, '')
  result.index = records.findIndex((row) => (givenId || id) && row._id === (givenId || id))
  if (result.index < 0 && result.slug) result.index = records.findIndex((row) => row.slug === result.slug)
  const existing: Record<string, string> = result.index >= 0 ? records[result.index] : {}
  result.record = {
    ...Object.fromEntries(headers.map((header) => [header, existing[header] || ''])),
    ...cells,
    _id: givenId || existing._id || '',
    _status: existing._status || '',
    _updatedAt: String(given._updatedAt || existing._updatedAt || ''),
  }
  const check = checkRowsAgainst([{rowNumber: result.index >= 0 ? result.index + 2 : records.length + 2, record: result.record}], docs)[0]
  result.id = check.id
  result.errors.push(...check.errors)
  // A file from the skill was already checked by the build, which warns about the same gaps in its own words.
  if (!fromBuild) {
    result.warnings.push(...check.warnings)
    result.placeholders.push(...(JSON.stringify(page).match(/\[CONFIRM:[^\]]*\]/g) || []))
  }
  result.changes = check.changes
  return result
}

export function addReport(result: PreparedPage, write: boolean): string {
  const name = `${result.id || 'new page'}${result.slug ? ` (/service-areas/${result.slug})` : ''}`
  const lines: string[] = []
  if (result.errors.length) lines.push(`Not ${write ? 'added' : 'ready'}: ${name}. Fix these:\n  - ${result.errors.join('\n  - ')}`)
  else if (!write) lines.push(`Ready to add: ${name}. Nothing was written (Check only).`)
  else lines.push(`Added: ${name}, ${result.index >= 0 ? `replacing row ${result.index + 2}` : 'as a new row at the bottom'} of the "${CONFIG.tab}" tab.`)
  if (result.warnings.length) lines.push(`Warnings:\n  - ${result.warnings.join('\n  - ')}`)
  if (result.placeholders.length) lines.push(`[CONFIRM] placeholders (${result.placeholders.length}), to answer before publishing:\n  - ${result.placeholders.join('\n  - ')}`)
  if (!result.errors.length) {
    lines.push(result.changes[0] === '(new page)' ? 'Sanity: a new page.' : result.changes.length ? `Sanity: ${result.changes.length} field(s) differ: ${result.changes.join(', ')}` : 'Sanity: the same as the page already there.')
    if (write) lines.push(`Next: select the row, ${MENU} → Check selected rows, then Push selected rows to Sanity as drafts (project ${CONFIG.projectId}).`)
  }
  return lines.join('\n\n')
}

/** Called by the Add box with the pasted text. Returns the report; never throws to the browser. */
export function addFromClaude(text: string, write: boolean): string {
  try {
    let input: unknown
    try { input = JSON.parse(String(text || '').trim()) } catch {
      return 'Not added: this is not valid JSON. Paste the whole file Claude wrote, from the first { to the last }.'
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.tab)
    if (!sheet) return `Not added: there is no "${CONFIG.tab}" tab. Use Load published pages from Sanity first.`
    const values: string[][] = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), Math.max(sheet.getLastColumn(), 1)).getValues().map((row: unknown[]) => row.map(cellText))
    const [headers = [], ...body] = values
    const unknown = unknownColumns(headers, COLUMNS)
    if (unknown.length) return `Not added: these headings in the tab are not Sanity fields: ${unknown.join(', ')}. Fix them first.`
    const records = body.map((cells) => Object.fromEntries(headers.map((header, i) => [header, cells[i] || ''])))
    const given = input && typeof input === 'object' ? (input as Json) : {}
    const slug = String(given.slug?.current || given.slug || given.area?.slug || '')
    const id = slug ? idForSlug(slug) : ''
    const docs: Json[] = id ? query('*[_id in $ids]', {ids: [id, `drafts.${id}`]}) : []
    const result = prepareAreaPage(input, headers, records, docs)
    const report = addReport(result, write)
    if (!write || result.errors.length) return report
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const record: Record<string, string> = {...result.record, _status: `added from Claude ${stamp} UTC, not pushed yet`}
    const rowNumber = result.index >= 0 ? result.index + 2 : values.length + 1
    sheet.getRange(rowNumber, 1, 1, headers.length).setNumberFormat('@').setValues([headers.map((header) => record[header] || '')])
    return report
  } catch (error) {
    return `Not added: ${error instanceof Error ? error.message : String(error)}`
  }
}

export function add() {
  guarded(() => {
    ui().showModalDialog(HtmlService.createHtmlOutput(pasteHtml('serviceAreaPagesAddFromClaude')).setWidth(900).setHeight(640), 'Add a page from Claude')
  })
}

/** Shows a page as JSON for Claude: the selected row as written, or (given a slug) Sanity's latest version, a draft first. */
export function get() {
  guarded(() => {
    const answer = ui().prompt('Get a page for Claude', 'Slug of a page in Sanity (its latest draft, or the published page), e.g. west-loop. Leave empty to use the selected row of this tab as written.', ui().ButtonSet.OK_CANCEL)
    if (answer.getSelectedButton() !== ui().Button.OK) return
    const slug = String(answer.getResponseText() || '').trim()
    let doc: Json
    let from: string
    if (!slug) {
      const {rows} = selection()
      if (rows.length !== 1) throw new Error('Select one page row (or type a slug).')
      const {rowNumber, record} = rows[0]
      doc = {_id: record._id || '', _updatedAt: record._updatedAt || '', _type: 'areaPage', ...unflatten(record, COLUMNS).doc}
      from = `row ${rowNumber} of the "${CONFIG.tab}" tab, as written in the sheet`
    } else {
      const id = idForSlug(slug)
      const found: Json[] = query('*[_id in $ids]', {ids: [id, `drafts.${id}`]})
      const draft = found.find((d) => d._id.startsWith('drafts.'))
      const published = found.find((d) => !d._id.startsWith('drafts.'))
      const latest = draft || published
      if (!latest) throw new Error(`No area page with slug "${slug}" in Sanity.`)
      doc = {...latest, _id: id}
      delete doc._rev
      delete doc._createdAt
      from = draft ? `Sanity, the unpublished draft (${draft._updatedAt})` : `Sanity, the published page (${published?._updatedAt})`
    }
    const note = `From ${from}. Copy it to Claude; after editing, use "Add a page from Claude".`
    ui().showModalDialog(HtmlService.createHtmlOutput(copyHtml(JSON.stringify(doc, null, 2), note)).setWidth(900).setHeight(640), 'Get a page for Claude')
  })
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The paste box: a text area, a file picker, and Check only / Add buttons that call `serverFn(text, write)`. */
function pasteHtml(serverFn: string): string {
  return `<style>body{font:13px Arial,sans-serif;margin:0}textarea{width:100%;height:330px;font:12px monospace;box-sizing:border-box}pre{white-space:pre-wrap;font:12px/1.45 monospace;max-height:170px;overflow:auto;margin:8px 0 0}button{margin:8px 8px 0 0;padding:6px 12px}</style>
<div>Paste the area.json Claude wrote (or a page from Get), or choose its .json file: <input type="file" id="file" accept=".json,application/json"></div>
<textarea id="text" spellcheck="false" placeholder="{ ... }"></textarea>
<div><button id="check">Check only</button><button id="add">Add to the sheet</button></div>
<pre id="out"></pre>
<script>
var out = document.getElementById('out'), text = document.getElementById('text'), buttons = document.querySelectorAll('button')
document.getElementById('file').onchange = function (event) { var file = event.target.files[0]; if (file) file.text().then(function (value) { text.value = value }) }
function run(write) {
  out.textContent = write ? 'Adding...' : 'Checking...'
  buttons.forEach(function (b) { b.disabled = true })
  var done = function (message) { out.textContent = message; buttons.forEach(function (b) { b.disabled = false }) }
  google.script.run.withSuccessHandler(done).withFailureHandler(function (error) { done('Error: ' + error.message) }).${serverFn}(text.value, write)
}
document.getElementById('check').onclick = function () { run(false) }
document.getElementById('add').onclick = function () { run(true) }
</script>`
}

/** A read-only text area with a Copy button. */
function copyHtml(json: string, note: string): string {
  return `<style>body{font:13px Arial,sans-serif;margin:0}textarea{width:100%;height:520px;font:12px monospace;box-sizing:border-box}button{margin:8px 8px 0 0;padding:6px 12px}</style>
<div>${escapeHtml(note)}</div>
<textarea id="json" readonly spellcheck="false">${escapeHtml(json)}</textarea>
<div><button id="copy">Copy</button><span id="done"></span></div>
<script>
document.getElementById('copy').onclick = function () {
  var area = document.getElementById('json'); area.select(); document.execCommand('copy')
  document.getElementById('done').textContent = 'Copied.'
}
</script>`
}
