'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'
import {Icon} from '@/components/ds/icon'
import {BUILDING_ICON} from '@/lib/area/copy'
import type {AreaCard} from '@/types/area'

/** Card grid of service area pages, with search; each card opens its page. */
export function AreaCollection({areas}: {areas: AreaCard[]}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return areas.filter((card) => !term || `${card.area} ${card.eyebrow || ''} ${card.metaDescription || ''}`.toLowerCase().includes(term))
  }, [areas, query])

  return (
    <>
      {areas.length > 0 && <div className="ar-coll-toolbar">
        <label className="ar-coll-search">
          <span className="ds-honeypot">Search areas</span>
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by neighbourhood or district" type="search" aria-label="Search areas" />
        </label>
        <p aria-live="polite">Showing <b>{filtered.length}</b> of {areas.length} service area{areas.length === 1 ? '' : 's'}</p>
      </div>}
      {areas.length === 0 && <div className="ar-coll-empty"><h3 className="ds-h5">No published service areas yet</h3><p>Areas appear here once their pages are published in Sanity.</p></div>}
      {areas.length > 0 && filtered.length === 0 && <div className="ar-coll-empty"><h3 className="ds-h5">No matching areas</h3><p>Try another neighbourhood or clear the search.</p><button type="button" className="ds-btn ds-btn--secondary" onClick={() => setQuery('')}><span>Clear search</span></button></div>}
      <ul className="ar-coll-grid">
        {filtered.map((card) => (
          <li key={card.slug}>
            <Link className="ar-coll-card" href={`/${card.slug}`}>
              <div className="ar-coll-top">
                <span className="ar-building-icon" aria-hidden="true"><Icon name={(card.illus && BUILDING_ICON[card.illus]) || 'mapPin'} size={24} /></span>
                <span className="ar-arrow-badge"><Icon name="arrowUpRight" size={16} /></span>
              </div>
              {card.eyebrow && <p className="ar-mini-label">{card.eyebrow}</p>}
              <h3 className="ar-card-title">Electricians {card.areaIn}</h3>
              {card.metaDescription && <p className="ar-coll-desc">{card.metaDescription}</p>}
              <ul className="ar-coll-meta">
                {card.districtCount ? <li><Icon name="map" size={14} />{card.districtCount} districts</li> : null}
                {card.permitCount ? <li><Icon name="fileCheck" size={14} />{card.permitCount} Highlights permits</li> : null}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
