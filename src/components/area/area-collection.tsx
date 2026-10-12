'use client'

import Link from 'next/link'
import {useMemo, useState} from 'react'
import type {AreaCard} from '@/types/area'
import {Illustration} from './art'

/** Card grid of service area pages; each card opens its page. Card styles are the live collection cards. */
export function AreaCollection({areas}: {areas: AreaCard[]}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return areas.filter((card) => !term || `${card.area} ${card.eyebrow || ''} ${card.metaDescription || ''}`.toLowerCase().includes(term))
  }, [areas, query])

  return (
    <section className="collection-directory" aria-labelledby="area-directory-title">
      <div className="collection-wrap">
        <div className="collection-directory-heading">
          <div>
            <p className="collection-kicker">Explore service areas</p>
            <h2 id="area-directory-title">Find your neighbourhood</h2>
          </div>
          <p>Each page covers the buildings, districts and permit record of one part of Chicago, and every service we offer there.</p>
        </div>
        {areas.length > 0 && <div className="collection-toolbar">
          <label>
            <span>Search areas</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by neighbourhood or district" type="search" />
          </label>
          <p className="collection-result-count" aria-live="polite">Showing <strong>{filtered.length}</strong> of {areas.length} service areas</p>
        </div>}
        {areas.length === 0 && <div className="collection-empty"><h3>No published service areas yet</h3><p>Areas appear here once their pages are published in Sanity.</p></div>}
        {areas.length > 0 && filtered.length === 0 && <div className="collection-empty"><h3>No matching areas</h3><p>Try another neighbourhood or clear the search.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
        <div className="collection-card-grid">
          {filtered.map((card) => (
            <Link className="collection-card area-card" href={`/${card.slug}`} key={card.slug}>
              <span className="collection-card-media area-card-media">
                {card.illus ? <Illustration name={card.illus} id={`card-${card.slug}`} /> : <span aria-hidden="true">HC</span>}
              </span>
              <span className="collection-card-arrow" aria-hidden="true">→</span>
              <span className="collection-card-content">
                <span className="collection-card-area">{card.eyebrow || 'Chicago'}</span>
                <strong>Electricians {card.areaIn}</strong>
                {card.metaDescription && <span className="collection-card-description">{card.metaDescription}</span>}
                <span className="collection-card-volume">{[card.districtCount ? `${card.districtCount} districts` : '', card.permitCount ? `${card.permitCount} Highlights permits here` : ''].filter(Boolean).join(' · ')}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
