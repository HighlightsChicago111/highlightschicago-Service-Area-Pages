import type {MetadataRoute} from 'next'
import {getSitemapAreas} from '@/lib/content'
import {BASE_PATH, PUBLIC_SITE_ORIGIN, areaPageUrl} from '@/lib/urls'

// Next serves this at /service-areas/sitemap.xml (basePath applies to it). Every <loc> is on the public
// domain, which Cloudflare proxies to this app, so the file can be submitted in Search Console as is.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const areas = await getSitemapAreas()
  const latest = areas.map((area) => area._updatedAt).filter(Boolean).sort().at(-1)
  return [
    {url: `${PUBLIC_SITE_ORIGIN}${BASE_PATH}`, lastModified: latest ? new Date(latest) : undefined, changeFrequency: 'weekly', priority: 0.9},
    ...areas.map((area) => ({
      url: areaPageUrl(area.slug),
      lastModified: area._updatedAt ? new Date(area._updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
