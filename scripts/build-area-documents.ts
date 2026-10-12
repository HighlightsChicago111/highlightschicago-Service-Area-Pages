/**
 * content/ (skill output) -> data/area-documents.json, with validation. No network.
 * The site reads data/area-documents.json directly when AREA_CONTENT_SOURCE=local, so a page can be
 * checked in the browser before anything is written to Sanity.
 *
 * content/company.json            company facts (skill assets/company.json)
 * content/highlights-reviews.csv  review pack (skill assets/highlights-reviews.csv)
 * content/areas/<slug>/area.json      the skill's area content file
 * content/areas/<slug>/permits.json   permits.py output (optional)
 */
import fs from 'node:fs'
import path from 'node:path'
import {buildAreaDocuments, type AreaSource} from './lib/area-transform'
import {parseCsv} from './lib/csv'

const root = path.resolve('content')
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'))
const areasDir = path.join(root, 'areas')
const areas: AreaSource[] = fs.readdirSync(areasDir, {withFileTypes: true}).filter((entry) => entry.isDirectory()).map((entry) => {
  const dir = path.join(areasDir, entry.name)
  const permitsFile = path.join(dir, 'permits.json')
  return {folder: entry.name, config: read(path.join(dir, 'area.json')), permits: fs.existsSync(permitsFile) ? read(permitsFile) : undefined}
})
const {documents, errors, warnings, placeholders} = buildAreaDocuments({
  areas,
  company: read(path.join(root, 'company.json')),
  reviews: parseCsv(fs.readFileSync(path.join(root, 'highlights-reviews.csv'), 'utf8')),
})

for (const warning of warnings) console.warn(`warning: ${warning}`)
if (placeholders.length) {
  console.warn(`\n${placeholders.length} [CONFIRM] placeholder(s) to answer before publishing:`)
  for (const item of placeholders) console.warn(`  ${item}`)
}
if (errors.length) {
  console.error(`\n${errors.length} error(s). Nothing was written:`)
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}
fs.mkdirSync(path.resolve('data'), {recursive: true})
fs.writeFileSync(path.resolve('data/area-documents.json'), `${JSON.stringify(documents, null, 2)}\n`)
const pages = documents.filter((doc) => doc._type === 'areaPage')
console.log(`\nWrote data/area-documents.json: ${documents.length} documents (${pages.length} area pages: ${pages.map((doc) => (doc.slug as {current: string}).current).join(', ')})`)
