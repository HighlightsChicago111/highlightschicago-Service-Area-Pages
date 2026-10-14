export const PUBLIC_SITE_ORIGIN = 'https://www.highlightschicago.com'
/** The app's basePath. Keep in sync with next.config.ts. */
export const BASE_PATH = '/service-areas'
// Where every successful lead-form submission lands; conversions are tracked on it.
export const THANK_YOU_PATH = `${BASE_PATH}/thank-you`

export function areaPagePath(slug: string): string {
  return `${BASE_PATH}/${slug}`
}

export function areaPageUrl(slug: string): string {
  return `${PUBLIC_SITE_ORIGIN}${areaPagePath(slug)}`
}

/** A root-relative path (e.g. /service-areas/images/…) on the public domain; absolute URLs pass through. */
export function absoluteUrl(src: string): string {
  return src.startsWith('/') ? `${PUBLIC_SITE_ORIGIN}${src}` : src
}
