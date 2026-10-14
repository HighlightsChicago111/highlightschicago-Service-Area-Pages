/* eslint-disable @next/next/no-img-element -- Small logo files from /public. */
import Link from 'next/link'
import {Icon} from './icon'
import {IconBadge} from './atoms'
import {FooterQuoteForm} from './footer-quote-form'
import {COMPANY_EMAIL, LOGO, LOGO_WHITE, OFFICE_HOURS_SHORT} from '@/lib/ds'
import {PUBLIC_SITE_ORIGIN} from '@/lib/urls'
import type {AreaSettings} from '@/types/area'

const SHOP_MAPS_URL = 'https://www.google.com/maps/place/Highlights+Chicago+Electrical+Services/@41.986143,-87.700781,15z'

const NAV = [
  {label: 'Home', href: `${PUBLIC_SITE_ORIGIN}/`},
  {label: 'About us', href: `${PUBLIC_SITE_ORIGIN}/about-us`},
  {label: 'Services', href: `${PUBLIC_SITE_ORIGIN}/services`},
  {label: 'Service areas', href: '/', internal: true},
  {label: 'Blog', href: `${PUBLIC_SITE_ORIGIN}/blog`},
  {label: 'Learning center', href: `${PUBLIC_SITE_ORIGIN}/learning-center`},
]

function addressLine(co: AreaSettings) {
  const address = co.address
  return address ? `${address.street}, ${address.city}, ${address.region} ${address.zip}` : ''
}

/** Navy utility bar and the white main nav (global blocks). Every page of this app sits under "Service areas". */
export function SiteHeader({co, tel, current = 'areas'}: {co: AreaSettings; tel: string; current?: 'areas' | 'none'}) {
  return (
    <>
      <div className="ds-utility" aria-label="Business contact information">
        <div className="ds-wrap ds-utility-inner">
          <a href={SHOP_MAPS_URL}><Icon name="mapPin" size={16} />{addressLine(co)}, United States</a>
          <span className="ds-utility-sep" aria-hidden="true" />
          <span><Icon name="clock" size={16} />{OFFICE_HOURS_SHORT}</span>
          <span className="ds-utility-spacer" />
          <a href={`mailto:${COMPANY_EMAIL}`}><Icon name="mail" size={16} />{COMPANY_EMAIL}</a>
          <span className="ds-utility-sep" aria-hidden="true" />
          <a className="ds-utility-phone" href={tel}><Icon name="phone" size={16} />{co.phoneDisplay}</a>
        </div>
      </div>
      <header className="ds-nav">
        <div className="ds-wrap ds-nav-inner">
          <a className="ds-nav-logo" href={`${PUBLIC_SITE_ORIGIN}/`} aria-label={`${co.name} home`}><img src={LOGO} alt="Highlights Chicago Electrical Services" width={180} height={44} /></a>
          <nav className="ds-nav-links" aria-label="Primary navigation">
            {NAV.map((item) => item.internal
              ? <Link href={item.href} key={item.label} aria-current={current === 'areas' ? 'page' : undefined}>{item.label}</Link>
              : <a href={item.href} key={item.label}>{item.label}</a>)}
          </nav>
          <a className="ds-nav-phone" href={tel}><Icon name="phone" size={18} />{co.phoneDisplay}</a>
          <a className="ds-btn ds-btn--primary ds-btn--m ds-nav-cta" href={`${PUBLIC_SITE_ORIGIN}/contact-us`}><span>Contact us</span></a>
          <a className="ds-nav-call" href={tel} aria-label={`Call ${co.phoneDisplay}`}><Icon name="phone" size={20} /></a>
          <details className="ds-nav-mobile">
            <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
            <nav aria-label="Mobile navigation">
              {NAV.map((item) => item.internal
                ? <Link href={item.href} key={item.label} aria-current={current === 'areas' ? 'page' : undefined}>{item.label}</Link>
                : <a href={item.href} key={item.label}>{item.label}</a>)}
              <a className="ds-btn ds-btn--primary ds-btn--block" href={`${PUBLIC_SITE_ORIGIN}/contact-us`}><span>Contact us</span></a>
            </nav>
          </details>
        </div>
      </header>
    </>
  )
}

/** Global footer: navy, link columns, contact, glass quote card. */
export function SiteFooter({co, tel}: {co: AreaSettings; tel: string}) {
  const address = co.address
  return (
    <footer className="ds-footer">
      <div className="ds-wrap ds-footer-grid">
        <div className="ds-footer-main">
          <a className="ds-footer-logo" href={`${PUBLIC_SITE_ORIGIN}/`} aria-label={`${co.name} home`}><img src={LOGO_WHITE} alt="Highlights Chicago Electrical Services" width={170} height={50} /></a>
          <p className="ds-footer-blurb">Highlights Chicago is a full-service, family-owned electrical company that has served the Chicagoland area for over 12 years. From the beginning, the team has focused on high-quality workmanship and superior customer service.</p>
          <a className="ds-footer-ai" href={`${PUBLIC_SITE_ORIGIN}/`}><IconBadge icon="sparkles" tone="navy" size={32} /><span>Learn about Highlights Chicago with AI</span><Icon name="arrowRight" size={16} /></a>
          <div className="ds-footer-cols">
            <nav aria-label="Company">
              <h2>Company</h2>
              <a href={`${PUBLIC_SITE_ORIGIN}/about-us`}>About Us</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/services`}>Our Services</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/learning-center`}>Learning Center</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/contact-us`}>Contact Us</a>
            </nav>
            <nav aria-label="About us">
              <h2>About us</h2>
              <a href={`${PUBLIC_SITE_ORIGIN}/our-team`}>Our Team</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/testimonials`}>Testimonials</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/faq`}>FAQ</a>
            </nav>
            <address>
              <h2>Contact</h2>
              <a href={SHOP_MAPS_URL}><IconBadge icon="mapPin" tone="navy" size={32} /><span><b>Address:</b>{address?.street}<br />{address?.city}, {address?.region} {address?.zip}</span></a>
              <a href={tel}><IconBadge icon="phone" tone="navy" size={32} /><span><b>Phone:</b>{co.phoneDisplay}</span></a>
              <a href={`mailto:${COMPANY_EMAIL}`}><IconBadge icon="mail" tone="navy" size={32} /><span><b>Email:</b>{COMPANY_EMAIL}</span></a>
            </address>
          </div>
        </div>
        <aside className="ds-footer-card" aria-labelledby="footer-quote-title">
          <h2 id="footer-quote-title">Request a quick <span>quote</span></h2>
          <p>Tell the Highlights Chicago team what electrical service you need and get help planning the next step.</p>
          <FooterQuoteForm phone={co.phoneDisplay} tel={tel} />
        </aside>
      </div>
      <div className="ds-wrap ds-footer-bottom">
        <span>Copyright © {new Date().getFullYear()} Highlights Chicago</span>
        <div className="ds-socials">
          <a href="https://www.facebook.com/HighlightsChicago" aria-label="Highlights Chicago on Facebook"><Icon name="facebook" size={18} /></a>
          <a href="https://x.com/wedoit4life" aria-label="Highlights Chicago on X"><Icon name="x" size={16} /></a>
        </div>
      </div>
    </footer>
  )
}
