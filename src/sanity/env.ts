function usable(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || /^(PASTE_|your_)/i.test(trimmed)) return undefined
  return trimmed
}

export const projectId = usable(process.env.NEXT_SANITY_PROJECT_ID)
export const dataset = usable(process.env.NEXT_SANITY_DATASET) || 'production'
export const apiVersion = usable(process.env.NEXT_SANITY_API_VERSION) || '2026-03-01'
export const studioUrl = usable(process.env.NEXT_SANITY_STUDIO_URL) || '/service-areas/studio'
export const siteUrl = usable(process.env.NEXT_SITE_URL) || 'http://localhost:3008'
export const readToken = usable(process.env.SANITY_API_READ_TOKEN)

/**
 * Without a Sanity project ID (or with AREA_CONTENT_SOURCE=local) the site renders
 * from data/area-documents.json, built by `pnpm content:build`, so a page can be
 * checked before anything is written to Sanity.
 */
export const contentSource: 'sanity' | 'local' =
  process.env.AREA_CONTENT_SOURCE === 'local' || !projectId ? 'local' : 'sanity'
