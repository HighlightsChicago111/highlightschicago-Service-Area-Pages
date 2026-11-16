/**
 * The site-wide navbar menu. The same folder (site-navbar/) is copied into the services,
 * service-areas, reviews and brands apps, and the Webflow "Site Navbar" component carries the
 * same items, so a menu change is made in all five places.
 *
 * Every link is absolute: the four apps and Webflow sit under one domain behind the
 * Cloudflare Workers, so an absolute URL works the same from any of them.
 */
export const SITE = 'https://www.highlightschicago.com'

export const LOGO_URL = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/6a3c3c20491b43b0858c1876_highlights-chicago-logo.webp'

export const PHONE_DISPLAY = '(773) 262-3333'
export const PHONE_TEL = 'tel:+17732623333'

export type NavSection = 'home' | 'services' | 'brands' | 'service-areas' | 'reviews' | 'resources' | 'about'

export type NavLink = {label: string; href: string}

export type NavGroup = {name: string; links: NavLink[]}

export const SERVICE_GROUPS: NavGroup[] = [
  {
    name: 'Electrical',
    links: [
      {label: 'Electrical Repair', href: `${SITE}/services/electrical-wiring/electrical-repair`},
      {label: 'GFCI Outlets', href: `${SITE}/services/electrical-outlets/gfci-outlet-installation`},
      {label: 'Circuit Breaker Replacement', href: `${SITE}/services/circuit-protection/circuit-breaker-replacement`},
      {label: 'Panel Upgrade', href: `${SITE}/services/panel-upgrades/electrical-panel-upgrade`},
      {label: 'Whole-House Surge Protector', href: `${SITE}/services/circuit-protection/whole-house-surge-protector`},
      {label: 'Outlet Repair & Replacement', href: `${SITE}/services/electrical-outlets/outlet-replacement-near-me`},
      {label: 'Fire Alarm Systems', href: `${SITE}/services/life-safety/fire-alarm-installation`},
      {label: 'Panel Replacement', href: `${SITE}/services/circuit-protection/electrical-panel-replacement-near-me`},
    ],
  },
  {
    name: 'EV Charging',
    links: [
      {label: 'Home & Tesla Charger Installation', href: `${SITE}/services/ev-charging/tesla-and-ev-charger-installation`},
      {label: 'Commercial & Multi-Unit EV Charging', href: `${SITE}/services/ev-charging/commercial-ev-charger-installation-near-me`},
      {label: 'EV Charger Repair & Maintenance', href: `${SITE}/services/ev-charging/ev-charger-repair-near-me`},
    ],
  },
  {
    name: 'Lighting',
    links: [
      {label: 'Outdoor & Security Lighting', href: `${SITE}/services/outdoor-lighting/outdoor-lighting-installation`},
      {label: 'Recessed Lighting', href: `${SITE}/services/interior-lighting/recessed-lighting-installation`},
      {label: 'Landscape Lighting', href: `${SITE}/services/outdoor-lighting/landscape-lighting-installation`},
      {label: 'Light Fixtures', href: `${SITE}/services/interior-lighting/light-fixture-installation-and-replacement`},
      {label: 'Chandeliers', href: `${SITE}/services/interior-lighting/chandelier-installation`},
      {label: 'LED Retrofit & Upgrades', href: `${SITE}/services/interior-lighting/led-retrofit`},
      {label: 'Under-Cabinet Lighting', href: `${SITE}/services/interior-lighting/under-cabinet-lighting-installation-near-me`},
    ],
  },
  {
    name: 'Commercial',
    links: [
      {label: 'Commercial Lighting', href: `${SITE}/services/outdoor-lighting/commercial-lighting-installation-near-me`},
      {label: 'Facility Electrical Maintenance', href: `${SITE}/services/electrical-wiring/electrical-maintenance-services-near-me`},
      {label: 'Parking Lot & Garage Lighting', href: `${SITE}/services/outdoor-lighting/parking-lot-lighting-repair-and-installation`},
      {label: 'Emergency Lighting', href: `${SITE}/services/outdoor-lighting/emergency-lighting-services-and-maintenance`},
    ],
  },
]

export const ALL_SERVICES_HREF = `${SITE}/services`

const area = (label: string, slug: string): NavLink => ({label, href: `${SITE}/service-areas/${slug}`})

/** Every live service area page, grouped by where it is. */
export const AREA_GROUPS: NavGroup[] = [
  {
    name: 'Chicago · North Side',
    links: [area('Lakeview', 'lakeview'), area('Lincoln Park', 'lincoln-park'), area('Lincoln Square', 'lincoln-square'), area('West Ridge', 'west-ridge')],
  },
  {
    name: 'Chicago · Northwest Side',
    links: [area('Avondale', 'avondale'), area('Edison Park', 'edison-park'), area('Logan Square', 'logan-square'), area('Portage Park', 'portage-park'), area('Sauganash', 'sauganash'), area('Wicker Park', 'wicker-park')],
  },
  {
    name: 'Suburbs',
    links: [area('Evanston', 'evanston'), area('Glenview', 'glenview'), area('Oak Park', 'oak-park'), area('Park Ridge', 'park-ridge'), area('Wilmette', 'wilmette')],
  },
]

export const ALL_AREAS_HREF = `${SITE}/service-areas`

/** Every live brand: its brand page, then its main service page. */
export const BRAND_GROUPS: NavGroup[] = [
  {
    name: 'Kohler',
    links: [
      {label: 'Kohler services', href: `${SITE}/brands/kohler`},
      {label: 'Generator installation & repair', href: `${SITE}/brands/kohler/kohler-generator-installation-repair`},
    ],
  },
  {
    name: 'Briggs & Stratton',
    links: [
      {label: 'Briggs & Stratton services', href: `${SITE}/brands/briggs-and-stratton`},
      {label: 'Generator installation & repair', href: `${SITE}/brands/briggs-and-stratton/briggs-stratton-generator-installation-repair`},
    ],
  },
  {
    name: 'Tesla',
    links: [
      {label: 'Tesla services', href: `${SITE}/brands/tesla`},
      {label: 'Powerwall home battery', href: `${SITE}/brands/tesla/tesla-home-battery-installation-repair`},
    ],
  },
  {
    name: 'Nest',
    links: [
      {label: 'Nest services', href: `${SITE}/brands/nest`},
      {label: 'Doorbell & camera installation', href: `${SITE}/brands/nest/nest-video-doorbell-installation-repair`},
    ],
  },
]

export const ALL_BRANDS_HREF = `${SITE}/brands`

export const RESOURCES: Array<NavLink & {description: string; icon: 'blog' | 'learn'}> = [
  {label: 'Blog', href: `${SITE}/blog`, description: 'Tips, news and project stories', icon: 'blog'},
  {label: 'Learning Center', href: `${SITE}/learning-center`, description: 'Guides to panels, wiring and codes', icon: 'learn'},
]

export const LINKS = {
  home: `${SITE}/`,
  brands: `${SITE}/brands`,
  serviceAreas: `${SITE}/service-areas`,
  reviews: `${SITE}/reviews`,
  about: `${SITE}/about-us`,
  contact: `${SITE}/contact-us`,
}
