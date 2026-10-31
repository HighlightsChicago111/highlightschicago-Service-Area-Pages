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
import {META_COLUMNS, staleReason, unflatten, unknownColumns, type Column} from '../../scripts/lib/sheet'
import {changedFields, checkRow, idForSlug} from '../../scripts/lib/sheet-rules'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- free-form Sanity documents

// Injected at build time from the Sanity schema and this project's settings.
declare const __COLUMNS__: Column[]
declare const __CONFIG__: {projectId: string; dataset: string; apiVersion: string; tab: string; studioUrl: string}

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

const query = (groq: string, params: Json, withToken?: string) =>
  sanity(`query/${CONFIG.dataset}?${Object.entries({query: groq, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [`$${k}`, JSON.stringify(v)]))})
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
  const parsed = rows.map(({rowNumber, record}) => {
    const {doc, errors} = unflatten(record, COLUMNS)
    const slug: string = doc.slug?.current || ''
    const check = checkRow(doc, (record._id || '').trim())
    return {rowNumber, record, doc, slug, id: slug ? idForSlug(slug) : '', errors: [...errors, ...check.errors], warnings: check.warnings}
  })
  const ids = parsed.filter((p) => p.id).map((p) => p.id)
  const docs: Json[] = ids.length ? query('*[_id in $ids || _id in $drafts]', {ids, drafts: ids.map((id) => `drafts.${id}`)}) : []
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
