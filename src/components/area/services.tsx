'use client'

import {useEffect, useState} from 'react'
import {Icon} from '@/components/ds/icon'
import {CATEGORY_SHORT, SERVICES_URL, type Category} from '@/lib/area/library'
import {pad2} from '@/lib/ds'

/**
 * Every service, in eight groups: tab list beside the group's cards on desktop, a chip row and a
 * "Show all" button on phones. Every card is in the HTML for search; tabs only hide panels.
 */
export function ServicesTabs({cats}: {cats: Category[]}) {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)

  // A link to #svc-panels (from a building card) opens that group.
  useEffect(() => {
    const fromHash = () => {
      const index = cats.findIndex((cat) => `#${cat.id}` === window.location.hash)
      if (index > -1) {
        setActive(index)
        setExpanded(false)
        document.getElementById('svc-tabs')?.scrollIntoView({block: 'start'})
      }
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [cats])

  const select = (index: number) => {
    setActive(index)
    setExpanded(false)
  }
  const onKey = (event: React.KeyboardEvent, index: number) => {
    const n = cats.length
    const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (index + 1) % n : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (index - 1 + n) % n : event.key === 'Home' ? 0 : event.key === 'End' ? n - 1 : -1
    if (next < 0) return
    event.preventDefault()
    select(next)
    document.getElementById(`${cats[next].id}-tab`)?.focus()
  }

  return (
    <div className="ar-svc" id="svc-tabs">
      <div className="ar-svc-tabs" role="tablist" aria-label="Service groups" aria-orientation="vertical">
        {cats.map((cat, index) => (
          <button type="button" role="tab" id={`${cat.id}-tab`} aria-controls={cat.id} aria-selected={active === index} tabIndex={active === index ? 0 : -1} key={cat.id} onClick={() => select(index)} onKeyDown={(event) => onKey(event, index)}>
            <span>{CATEGORY_SHORT[cat.id]}</span><b>{pad2(cat.items.length)}</b>
          </button>
        ))}
      </div>
      <div className="ar-svc-panels">
        {cats.map((cat, index) => (
          <section className={`ar-svc-panel${expanded ? ' is-expanded' : ''}`} id={cat.id} role="tabpanel" aria-labelledby={`${cat.id}-tab`} hidden={active !== index} key={cat.id}>
            <div className="ar-svc-panel-head">
              <div><h3 className="ar-svc-title">{cat.title}</h3><p>{cat.intro}</p></div>
              <span className="ar-count-pill">{cat.items.length} services</span>
            </div>
            <ul className="ar-svc-cards">
              {cat.items.map((item) => (
                <li key={item.name}>
                  {item.slug
                    ? <a className="ar-svc-card" href={`${SERVICES_URL}${item.slug}`}><span className="ar-svc-body"><b>{item.name}</b><span>{item.line}</span></span><span className="ar-arrow-badge"><Icon name="arrowUpRight" size={16} /></span></a>
                    : <div className="ar-svc-card"><span className="ar-svc-body"><b>{item.name}</b><span>{item.line}</span></span></div>}
                </li>
              ))}
            </ul>
            {cat.items.length > 2 && <button type="button" className="ar-show-all" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              <span>{expanded ? 'Show fewer' : `Show all ${cat.items.length} services`}</span><Icon name={expanded ? 'minus' : 'plus'} size={16} />
            </button>}
          </section>
        ))}
      </div>
    </div>
  )
}
