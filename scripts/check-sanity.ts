/** Read-only: proves which Sanity project/dataset .env.local points at and what area content it holds. */
import {createClient} from 'next-sanity'
import {loadLocalEnv, sanityTarget} from './lib/env'

async function main() {
  loadLocalEnv()
  const target = sanityTarget()
  const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  const client = createClient({...target, token, useCdn: false, perspective: 'raw'})
  const result = await client.fetch<{areaPages: string[]; settings: number; otherTypes: string[]; total: number}>(`{
    "areaPages": *[_type == "areaPage"] | order(area asc)._id,
    "settings": count(*[_type == "areaSettings"]),
    "otherTypes": array::unique(*[!(_type in ["areaPage", "areaSettings"]) && !(_type match "system.*") && !(_type match "sanity.*")]._type),
    "total": count(*)
  }`)
  console.log(`Project ${target.projectId}, dataset ${target.dataset}`)
  console.log(`Token: ${token ? 'present (drafts visible)' : 'none (published only)'}`)
  console.log(`Documents in dataset: ${result.total}`)
  console.log(`Area pages (${result.areaPages.length}): ${result.areaPages.join(', ') || 'none'}`)
  console.log(`Company facts documents: ${result.settings}`)
  console.log(`Other document types in this dataset: ${result.otherTypes.join(', ') || 'none'}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
