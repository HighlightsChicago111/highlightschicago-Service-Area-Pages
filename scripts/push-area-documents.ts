/**
 * Write data/area-documents.json to Sanity.
 *
 *   pnpm content:push                     dry run: prints the target and the plan, writes nothing
 *   pnpm content:push --yes               writes every document as a DRAFT (nothing goes live)
 *   pnpm content:push --publish --yes     publishes, and removes the matching drafts
 *   add --only west-loop,lincoln-park     limit pages to these slugs (company facts always go too)
 *
 * Only areaPage and areaSettings documents are ever written.
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from 'next-sanity'
import {loadLocalEnv, sanityTarget} from './lib/env'
import type {SanityDoc} from './lib/area-transform'

const args = process.argv.slice(2)
const publish = args.includes('--publish')
const confirmed = args.includes('--yes')
const onlyIndex = args.indexOf('--only')
const only = onlyIndex >= 0 ? new Set((args[onlyIndex + 1] || '').split(',').map((id) => id.trim()).filter(Boolean)) : null

const ALLOWED_TYPES = new Set(['areaPage', 'areaSettings'])

function asDraft(doc: SanityDoc): SanityDoc {
  return {...doc, _id: `drafts.${doc._id}`}
}

async function main() {
  loadLocalEnv()
  const target = sanityTarget()
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim()
  const file = path.resolve('data/area-documents.json')
  if (!fs.existsSync(file)) throw new Error('Run pnpm content:extract and pnpm content:build first')
  const all = JSON.parse(fs.readFileSync(file, 'utf8')) as SanityDoc[]
  if (all.some((doc) => !ALLOWED_TYPES.has(doc._type))) throw new Error('Refusing to write: only areaPage and areaSettings documents may be pushed')
  const slugOf = (doc: SanityDoc) => (doc.slug as {current?: string} | undefined)?.current || ''
  const documents = all.filter((doc) => doc._type !== 'areaPage' || !only || only.has(slugOf(doc)))
  if (only && !documents.some((doc) => doc._type === 'areaPage')) throw new Error(`No area pages match --only ${[...only].join(',')}`)

  const client = createClient({...target, token, useCdn: false, perspective: 'raw'})
  const ids = documents.map((doc) => doc._id)
  const existing = await client.fetch<string[]>('*[_id in $ids || _id in $draftIds]._id', {ids, draftIds: ids.map((id) => `drafts.${id}`)})

  console.log(`Target: Sanity project ${target.projectId}, dataset ${target.dataset}`)
  console.log(`Mode: ${publish ? 'PUBLISH (pages go live on the service areas site)' : 'drafts only (nothing goes live)'}`)
  for (const doc of documents) {
    const id = publish ? doc._id : `drafts.${doc._id}`
    console.log(`  ${existing.includes(id) ? 'replace' : 'create '} ${id}${doc._type === 'areaPage' ? `  /service-areas/${slugOf(doc)}` : ''}`)
  }
  if (publish) for (const doc of documents) if (existing.includes(`drafts.${doc._id}`)) console.log(`  delete  drafts.${doc._id} (replaced by the published version)`)
  console.log(`${documents.length} document(s).`)

  if (!confirmed) {
    console.log('\nDry run: nothing was written. Add --yes to write.')
    return
  }
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN is empty in .env.local')

  let transaction = client.transaction()
  for (const doc of documents) {
    transaction = transaction.createOrReplace(publish ? doc : asDraft(doc))
    if (publish && existing.includes(`drafts.${doc._id}`)) transaction = transaction.delete(`drafts.${doc._id}`)
  }
  const result = await transaction.commit()
  console.log(`\nCommitted transaction ${result.transactionId}.`)

  const written = await client.fetch<string[]>('*[_id in $ids]._id', {ids: documents.map((doc) => (publish ? doc._id : `drafts.${doc._id}`))})
  if (written.length !== documents.length) throw new Error(`Verification failed: expected ${documents.length} documents, found ${written.length}`)
  console.log(`Verified: ${written.length} document(s) present in ${target.projectId}/${target.dataset}.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
