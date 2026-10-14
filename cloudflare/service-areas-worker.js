/**
 * Cloudflare Worker: serves the Service Areas app (Vercel + Sanity) on the main domain.
 *
 *   https://www.highlightschicago.com/service-areas/...  ->  https://service-new-pages.vercel.app/service-areas/...
 *
 * The visitor's address bar keeps www.highlightschicago.com; the rest of the site stays on Webflow.
 * The app's basePath is /service-areas, so the path is forwarded unchanged (pages, /_next assets, images,
 * the lead form API, the Studio and /service-areas/sitemap.xml all live under it).
 *
 * Worker route (Cloudflare → highlightschicago.com zone → Workers Routes):
 *   www.highlightschicago.com/service-areas*
 * The apex domain already 301s to www, so it needs no route.
 */

const ORIGIN = 'https://service-new-pages.vercel.app'
const PUBLIC_ORIGIN = 'https://www.highlightschicago.com'
const PREFIX = '/service-areas'

const worker = {
  async fetch(request) {
    const url = new URL(request.url)

    // The route pattern also matches paths like /service-areas-old; leave those to the main site.
    if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) return fetch(request)

    // Vercel routes by Host, so it must be the vercel.app host, not the public one.
    const headers = new Headers(request.headers)
    headers.delete('Host')

    const upstream = new Request(`${ORIGIN}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      // Pass the app's own redirects to the browser instead of following them here.
      redirect: 'manual',
    })

    const response = await fetch(upstream)
    const proxied = new Response(response.body, response)

    // Redirects from the app must point back at the public domain, never at vercel.app.
    const location = proxied.headers.get('Location')
    if (location && location.startsWith(ORIGIN)) proxied.headers.set('Location', PUBLIC_ORIGIN + location.slice(ORIGIN.length))

    // The app marks every response noindex so the vercel.app copy stays out of search. Served from the
    // public domain the page is indexable; pages that must stay hidden (thank-you, Studio) carry their own
    // <meta name="robots" content="noindex">.
    proxied.headers.delete('X-Robots-Tag')

    return proxied
  },
}

export default worker
