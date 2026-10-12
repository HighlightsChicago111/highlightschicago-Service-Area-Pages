import {Fragment} from 'react'
import {Copy} from '@/components/ds/atoms'
import {capitalise} from '@/lib/area/copy'
import {pad2} from '@/lib/ds'
import {busiestDistrict, DistrictMap} from './district-map'
import {AreaHead} from './head'
import {PhoneAccordion} from './phone'
import type {AreaCtx} from './types'

const STOP = new Set(['the', 'and', 'of', 'toward', 'towards', 'blocks', 'district', 'street', 'mid', 'rise'])
const words = (name: string) => new Set(name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)))

/** The map and the district cards can name a district differently ("Mid-rise blocks toward Ashland" and "West of Racine, toward Ashland"): pick the card sharing the most words. */
function matchDistrict(mapName: string | undefined, names: string[]): number {
  if (!mapName) return -1
  const target = words(mapName)
  let best = -1
  let bestScore = 0
  names.forEach((name, index) => {
    const score = [...words(name)].filter((w) => target.has(w)).length
    if (score > bestScore) { best = index; bestScore = score }
  })
  return best
}

/** "The …, district by district" (navy): schematic map, fact strip, then one card per district. */
export function DistrictsBlock({ctx}: {ctx: AreaCtx}) {
  const {page, editorial} = ctx
  const districts = page.districts || []
  const hl = page.permits?.highlights
  const busiestIndex = matchDistrict(busiestDistrict(page), districts.map((d) => d.name))

  return (
    <div className="ds-wrap">
      <AreaHead id="area-title" eyebrow={`Service area · ${districts.length} districts`} title={`${capitalise(page.areaThe)}, district by district`} lede={page.boundaryText} editorial={editorial} />
      <div className="ar-area-top">
        {page.map && <figure className="ar-map-card">
          <DistrictMap page={page} />
          <figcaption>Schematic, not to scale. District edges are approximate, because sources draw them differently.{hl?.count ? ` Each green dot is a block where Highlights holds City of Chicago permits (${hl.count} permits on ${hl.addresses ?? 0} addresses, ${hl.firstYear || '2012'}–${page.permits?.windowTo.slice(0, 4)}).` : ''}</figcaption>
        </figure>}
        {Boolean(page.facts?.length) && <dl className="ar-facts">
          {page.facts?.map((fact, index) => <div key={fact._key || index}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>}
      </div>
      <PhoneAccordion className="ar-districts" items={districts.map((district, index) => ({
        key: district._key || String(index),
        title: district.name,
        className: index === busiestIndex ? 'ar-district is-busiest' : 'ar-district',
        head: <h3 key="head"><span>{pad2(index + 1)}</span>{district.name}</h3>,
        body: <Fragment key="body"><p>{district.intro}</p><div><p className="ar-mini-label">What the electrical work looks like</p><Copy value={district.work} show={editorial} /></div></Fragment>,
      }))} />
    </div>
  )
}
