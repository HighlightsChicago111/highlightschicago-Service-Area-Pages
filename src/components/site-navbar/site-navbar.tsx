'use client'
/* eslint-disable @next/next/no-img-element -- The logo is served from the Webflow CDN, shared by every app. */

import {useEffect, useRef, useState, type ReactNode} from 'react'
import {ALL_AREAS_HREF, ALL_BRANDS_HREF, ALL_SERVICES_HREF, AREA_GROUPS, BRAND_GROUPS, LINKS, LOGO_URL, PHONE_DISPLAY, PHONE_TEL, RESOURCES, SERVICE_GROUPS, type NavGroup, type NavSection} from './nav-data'
// Styles: site-navbar.css, imported once by the root layout (tsx tests render this file and cannot load CSS).

type Menu = 'services' | 'brands' | 'areas' | 'resources'

/**
 * The site-wide navbar (Paper design "Charming umbrella", Webflow component "Site Navbar").
 * One menu serves desktop and phone: CSS turns it into a full-screen menu below 992px, so
 * every link appears once in the page HTML.
 */
export function SiteNavbar({current}: {current?: NavSection}) {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!menu && !phoneOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const toggle = menu ? header.current?.querySelector<HTMLButtonElement>(`[aria-controls="snav-${menu}"]`) : null
      if (menu) setMenu(null)
      else setPhoneOpen(false)
      toggle?.focus()
    }
    // A click anywhere outside the navbar closes an open dropdown.
    const onPointer = (event: PointerEvent) => {
      if (menu && !phoneOpen && !header.current?.contains(event.target as Node)) setMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menu, phoneOpen])

  // The open phone menu covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.documentElement.classList.toggle('snav-lock', phoneOpen)
    return () => document.documentElement.classList.remove('snav-lock')
  }, [phoneOpen])

  const toggleMenu = (name: Menu) => setMenu((open) => (open === name ? null : name))
  const currentPage = (section: NavSection) => (current === section ? 'page' : undefined)

  return (
    <header className="snav" ref={header}>
      <div className="snav-container">
        <a className="snav-brand" href={LINKS.home} aria-label="Highlights Chicago home">
          <img className="snav-logo" src={LOGO_URL} alt="Highlights Chicago Electrical Services" width={181} height={44} />
        </a>

        <div className={`snav-menu${phoneOpen ? ' is-open' : ''}`} id="snav-menu">
          <div className="snav-mhead">
            <img className="snav-logo" src={LOGO_URL} alt="" width={181} height={44} />
            <button type="button" className="snav-iconbtn snav-close" aria-label="Close menu" onClick={() => setPhoneOpen(false)}>
              <Svg size={22}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
            </button>
          </div>

          <nav className="snav-links" aria-label="Primary navigation">
            <a className="snav-link" href={LINKS.home} aria-current={currentPage('home')}>Home</a>

            <MegaMenu name="services" label="Services" open={menu === 'services'} current={current === 'services'} onToggle={toggleMenu}
              groups={SERVICE_GROUPS} allHref={ALL_SERVICES_HREF} allLabel="View all services" callPrompt="Not sure what you need?" />
            {/* The phone number sits in the Services panel only: each menu link appears once in the page. */}
            <MegaMenu name="brands" label="Brands" open={menu === 'brands'} current={current === 'brands'} onToggle={toggleMenu}
              groups={BRAND_GROUPS} allHref={ALL_BRANDS_HREF} allLabel="View all brands" />
            <MegaMenu name="areas" label="Service Areas" open={menu === 'areas'} current={current === 'service-areas'} onToggle={toggleMenu}
              groups={AREA_GROUPS} allHref={ALL_AREAS_HREF} allLabel="View all service areas" />

            <a className="snav-link" href={LINKS.reviews} aria-current={currentPage('reviews')}>Reviews</a>

            <div className={`snav-dd snav-dd--small${menu === 'resources' ? ' is-open' : ''}`}>
              <button type="button" className={`snav-dd-toggle${current === 'resources' ? ' is-current' : ''}`} aria-expanded={menu === 'resources'} aria-controls="snav-resources" onClick={() => toggleMenu('resources')}>
                <span>Resources</span><Chevron />
              </button>
              <div className="snav-panel snav-panel--small" id="snav-resources">
                {RESOURCES.map((item) => (
                  <a className="snav-res" href={item.href} key={item.href}>
                    <span className="snav-res-icon" aria-hidden="true">
                      {item.icon === 'blog'
                        ? <Svg size={20}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></Svg>
                        : <Svg size={20}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></Svg>}
                    </span>
                    <span className="snav-res-text">
                      <span className="snav-res-title">{item.label}</span>
                      <span className="snav-res-desc">{item.description}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <a className="snav-link" href={LINKS.about} aria-current={currentPage('about')}>About Us</a>
          </nav>

          <div className="snav-mactions">
            <a className="snav-cta snav-cta--block" href={LINKS.contact}>Contact Us</a>
            <a className="snav-mcall" href={PHONE_TEL}><PhoneIcon size={18} />{PHONE_DISPLAY}</a>
          </div>
        </div>

        <a className="snav-cta snav-cta--bar" href={LINKS.contact}>Contact Us</a>
        <button type="button" className="snav-iconbtn snav-burger" aria-label="Open menu" aria-expanded={phoneOpen} aria-controls="snav-menu" onClick={() => setPhoneOpen(true)}>
          <Svg size={22}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Svg>
        </button>
      </div>
    </header>
  )
}

/** A full-width dropdown: one column per group, then a "View all" link and, if `callPrompt` is given, the phone number. */
function MegaMenu({name, label, open, current, onToggle, groups, allHref, allLabel, callPrompt}: {
  name: Menu
  label: string
  open: boolean
  current: boolean
  onToggle: (name: Menu) => void
  groups: NavGroup[]
  allHref: string
  allLabel: string
  callPrompt?: string
}) {
  return (
    <div className={`snav-dd${open ? ' is-open' : ''}`}>
      <button type="button" className={`snav-dd-toggle${current ? ' is-current' : ''}`} aria-expanded={open} aria-controls={`snav-${name}`} onClick={() => onToggle(name)}>
        <span>{label}</span><Chevron />
      </button>
      <div className="snav-panel" id={`snav-${name}`}>
        <div className="snav-cols">
          {groups.map((group) => (
            <div className="snav-col" key={group.name}>
              <p className="snav-col-head">{group.name}</p>
              {group.links.map((link) => <a className="snav-plink" href={link.href} key={link.href}>{link.label}</a>)}
            </div>
          ))}
        </div>
        <div className="snav-foot">
          <a className="snav-foot-link" href={allHref}>
            <span>{allLabel}</span>
            <Svg size={16} className="snav-accent"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></Svg>
          </a>
          {callPrompt && <p className="snav-foot-call">
            <span>{callPrompt}</span>
            <a className="snav-phone" href={PHONE_TEL}><PhoneIcon size={16} />{PHONE_DISPLAY}</a>
          </p>}
        </div>
      </div>
    </div>
  )
}

function Svg({size, className, children}: {size: number; className?: string; children: ReactNode}) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

function Chevron() {
  return <Svg size={14} className="snav-chev"><path d="m6 9 6 6 6-6" /></Svg>
}

function PhoneIcon({size}: {size: number}) {
  return (
    <Svg size={size} className="snav-accent">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  )
}
