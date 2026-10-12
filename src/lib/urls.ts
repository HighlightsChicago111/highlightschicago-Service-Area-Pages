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
