import Link from 'next/link'
import {ConfirmNotes} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {isChicago} from '@/lib/area/copy'
import {AreaHead} from './head'
import type {AreaCtx} from './types'

/** "Neighbourhoods next to …": one card each, linked once that area has its own page. */
export function NearbyBlock({ctx}: {ctx: AreaCtx}) {
  const {page, areas, editorial} = ctx
  const nearby = page.nearby || []
  const links = new Map(areas.filter((item) => item.slug !== page.slug).map((item) => [item.area.toLowerCase(), item.slug]))
  const unlinked = nearby.some((item) => !links.has(item.name.toLowerCase()))
  return (
    <div className="ds-wrap">
      <AreaHead id="nearby-title" eyebrow={`Nearby · ${nearby.length} neighbourhoods`} title={`Neighbourhoods next to ${page.areaThe}`} editorial={editorial}
        lede={`${isChicago(page) ? 'We cover every Chicago neighbourhood.' : 'We work across Chicago and the nearby suburbs.'} These border ${page.areaThe}, and the building stock changes as soon as you cross into them.`} />
      <ul className="ar-nearby">
        {nearby.map((item, index) => {
          const slug = links.get(item.name.toLowerCase())
          const body = <><div className="ar-nearby-top"><h3 className="ar-nearby-name">{item.name}</h3><span className="ar-arrow-badge"><Icon name={slug ? 'arrowUpRight' : 'mapPin'} size={14} /></span></div><p>{item.note}</p></>
          return <li key={item._key || index}>{slug ? <Link className="ar-nearby-card" href={`/${slug}`}>{body}</Link> : <div className="ar-nearby-card">{body}</div>}</li>
        })}
      </ul>
      {unlinked && <p className="ar-editorial-note"><ConfirmNotes notes={['[CONFIRM: link each neighbourhood to its area page once those pages exist]']} show={editorial} /></p>}
    </div>
  )
}
