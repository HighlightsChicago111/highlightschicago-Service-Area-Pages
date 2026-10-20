import {PUBLIC_SITE_ORIGIN} from './urls'

/**
 * The footer legal links, worded and ordered as on the Webflow home page. Both pages are owned by
 * Webflow, so the hrefs are absolute and the links are plain <a> elements: next/link would add the
 * /service-areas basePath and a relative href would break on the Vercel origin host.
 */
export const LEGAL_LINKS = [
  {label: 'Privacy Policy', href: `${PUBLIC_SITE_ORIGIN}/privacy-policy`},
  {label: 'Terms and Conditions', href: `${PUBLIC_SITE_ORIGIN}/terms-and-conditions`},
] as const
