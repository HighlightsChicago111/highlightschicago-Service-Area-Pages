/**
 * Every area page, the /service-areas collection and the thank-you page end with SiteFooter. It must show the same
 * Privacy Policy and Terms and Conditions links as the Webflow home page, right under the copyright line.
 *
 *   tsx scripts/test-footer-legal-links.tsx                       offline: renders the footer
 *   tsx scripts/test-footer-legal-links.tsx https://www.highlightschicago.com
 *                                                                 also checks the live pages and that both targets are published
 */
import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {SiteFooter} from '../src/components/ds/chrome'
import {LEGAL_LINKS} from '../src/lib/legal-links'
import {BASE_PATH, THANK_YOU_PATH} from '../src/lib/urls'
import type {AreaSettings} from '../src/types/area'

const baseUrl = process.argv[2]?.replace(/\/$/, '')
const EXPECTED = [
  {label: 'Privacy Policy', href: 'https://www.highlightschicago.com/privacy-policy', title: /^Privacy Policy \| Highlights Chicago$/},
  {label: 'Terms and Conditions', href: 'https://www.highlightschicago.com/terms-and-conditions', title: /^Terms and Conditions \| Highlights Chicago$/},
]

const settings: AreaSettings = {
  name: 'Highlights Chicago Inc.',
  phoneDisplay: '(773) 262-3333',
  phoneTel: '+17732623333',
  site: 'https://www.highlightschicago.com',
  address: {street: '5766 N Lincoln Ave', city: 'Chicago', region: 'IL', zip: '60659'},
  licence: 'ECC96456',
  permitsCitywide: '0',
  googleRating: '4.9',
  googleReviews: '494',
}

/** The footer's bottom row: copyright, the Legal nav, then the social icons, in that order. */
function checkFooter(name: string, html: string) {
  const navs = [...html.matchAll(/<nav\b[^>]*aria-label="Legal"[^>]*>([\s\S]*?)<\/nav>/g)]
  assert.equal(navs.length, 1, `${name}: expected exactly one Legal nav, found ${navs.length}`)
  assert.match(navs[0][0], /class="ds-footer-legal"/, `${name}: the Legal nav must use ds-footer-legal`)

  const links = [...navs[0][1].matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)].map((m) => ({attrs: m[1], label: m[2], href: m[1].match(/href="([^"]*)"/)?.[1]}))
  assert.deepEqual(links.map((l) => [l.label, l.href]), EXPECTED.map((e) => [e.label, e.href]), `${name}: Legal links must be Privacy Policy then Terms and Conditions with the Webflow URLs`)
  for (const link of links) assert.ok(!/\b(target|download)=|data-prefetch|rel="nofollow"/.test(link.attrs), `${name}: ${link.label} must be a plain same-tab link, got ${link.attrs}`)

  const copyright = html.indexOf('Copyright ©'), legal = html.indexOf(navs[0][0]), social = html.indexOf('aria-label="Highlights Chicago on Facebook"')
  assert.ok(copyright >= 0 && legal > copyright && social > legal, `${name}: order must be copyright, then legal links, then social icons`)
}

async function offline() {
  assert.deepEqual(LEGAL_LINKS.map((l) => [l.label, l.href]), EXPECTED.map((e) => [e.label, e.href]), 'LEGAL_LINKS must match the Webflow footer')
  checkFooter('SiteFooter', renderToStaticMarkup(<SiteFooter co={settings} tel="tel:+17732623333" />))
}

async function live(origin: string) {
  const html = async (path: string) => {
    const response = await fetch(`${origin}${path}`)
    assert.equal(response.status, 200, `${path} must return 200`)
    return response.text()
  }
  // One page of every kind, found from the sitemap so new areas never break this test.
  const sitemap = await html(`${BASE_PATH}/sitemap.xml`)
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname)
  const area = paths.find((path) => path !== BASE_PATH && path !== THANK_YOU_PATH)
  assert.ok(paths.includes(BASE_PATH) && area, 'The sitemap must list the collection and at least one area page')
  for (const path of [BASE_PATH, area, THANK_YOU_PATH]) checkFooter(path, await html(path))
  // The links must not lead anywhere dead: both Webflow pages are published and keep their titles.
  for (const target of EXPECTED) {
    const response = await fetch(target.href, {redirect: 'manual'})
    assert.equal(response.status, 200, `${target.href} must answer 200 without a redirect`)
    const title = (await response.text()).match(/<title>([^<]*)<\/title>/)?.[1] || ''
    assert.match(title, target.title, `${target.href} must be the ${target.label} page`)
  }
}

async function run() {
  await offline()
  if (baseUrl) await live(baseUrl)
  console.log(`Footer legal links test passed: the footer shows ${EXPECTED.map((e) => e.label).join(' and ')} after the copyright line${baseUrl ? `, and the live pages and both target pages are in order (${baseUrl})` : ''}.`)
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
