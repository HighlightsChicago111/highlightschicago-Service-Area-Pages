import {Fragment} from 'react'
import {Copy} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {BUILDING_ICON, capitalise} from '@/lib/area/copy'
import {AreaHead} from './head'
import {PhoneAccordion} from './phone'
import type {AreaCtx} from './types'

/** "Your building type": one card per building type, linking to the service groups people in it ask for most. */
export function BuildingsBlock({ctx}: {ctx: AreaCtx}) {
  const {page, editorial} = ctx
  const buildings = page.buildings || []
  return (
    <div className="ds-wrap">
      <AreaHead id="buildings-title" eyebrow={`Start here · ${buildings.length} building types`} title="Your building type, and what it means for electrical work" editorial={editorial}
        lede="Find your building and jump straight to the services people in it ask for most." />
      <PhoneAccordion className="ar-buildings" items={buildings.map((building, index) => ({
        key: building._key || String(index),
        title: building.title,
        className: 'ar-building',
        head: <Fragment key="head">
          <span className="ar-building-icon" aria-hidden="true"><Icon name={BUILDING_ICON[building.illus] || 'building'} size={24} /></span>
          <div className="ar-building-head">
            <h3 className="ar-card-title">{building.title}</h3>
            <p><Icon name="mapPin" size={14} />{building.where}</p>
          </div>
        </Fragment>,
        body: <Fragment key="body">
          <div className="ar-building-changes"><p className="ar-mini-label">What changes the work</p><Copy value={building.changes} show={editorial} /></div>
          {Boolean(building.services?.length) && <div className="ar-building-links">
            <p className="ar-mini-label">Most-asked services</p>
            <ul>{building.services?.map((service, j) => <li key={service._key || j}><a href={`#${service.category}`}>{capitalise(service.label)}<Icon name="arrowRight" size={12} /></a></li>)}</ul>
          </div>}
        </Fragment>,
      }))} />
    </div>
  )
}
