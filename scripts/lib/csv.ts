/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, newlines inside quotes). */
export function parseCsv(text: string): Array<Record<string, string>> {
  const [header, ...body] = parseCsvRows(text)
  if (!header) return []
  return body.map((r) => Object.fromEntries(header.map((name, i) => [name, r[i] ?? ''])))
}

/** The same parser, as rows of cells: row 0 is the header, blank rows dropped, a leading BOM removed. */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += ch
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const kept = rows.filter((r) => r.some((cell) => cell !== ''))
  if (kept[0]?.[0]) kept[0][0] = kept[0][0].replace(/^﻿/, '')
  return kept
}
