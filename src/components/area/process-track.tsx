'use client'

import {useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {Icon} from '@/components/ds/icon'
import {pad2} from '@/lib/ds'
import {useDragScroll} from './phone'

/**
 * The service pages' process track: an "01 / 06" counter, numbered step nodes on a
 * progress line, prev/next arrows, and a full-bleed swipe track of step cards under them.
 * Touch and touchpad scroll the track natively; a mouse drags it or uses the nodes and arrows.
 */
export function ProcessTrack({titles, children}: {titles: string[]; children: ReactNode[]}) {
  const viewport = useRef<HTMLDivElement>(null)
  const drag = useDragScroll()
  // A step chosen with a node or arrow stays current even when the track can't scroll it
  // to the start line (the last cards); the user's own scrolling releases it.
  const chosen = useRef<number | null>(null)
  const [current, setCurrent] = useState(0)
  const count = children.length
  const last = count - 1

  // The step whose left edge sits closest to the track's start line is the current one.
  const anchor = (el: HTMLElement) => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft)
  const steps = () => Array.from(viewport.current?.querySelector('.ds-track')?.children || []) as HTMLElement[]

  const sync = useCallback(() => {
    const el = viewport.current
    const items = steps()
    if (!el || !items.length || chosen.current !== null) return
    const start = anchor(el)
    let best = 0
    items.forEach((item, index) => { if (Math.abs(item.getBoundingClientRect().left - start) < Math.abs(items[best].getBoundingClientRect().left - start)) best = index })
    // At the end of the track the last card may never reach the start line.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) best = items.length - 1
    setCurrent(best)
  }, [])

  useEffect(() => {
    const el = viewport.current
    if (!el) return
    sync()
    const release = () => { chosen.current = null }
    const userInput = ['wheel', 'pointerdown', 'touchstart', 'keydown'] as const
    el.addEventListener('scroll', sync, {passive: true})
    userInput.forEach((type) => el.addEventListener(type, release, {passive: true}))
    const resize = new ResizeObserver(sync)
    resize.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      userInput.forEach((type) => el.removeEventListener(type, release))
      resize.disconnect()
    }
  }, [sync])

  const go = (index: number) => {
    const el = viewport.current
    const target = Math.max(0, Math.min(last, index))
    const item = steps()[target]
    if (!el || !item) return
    chosen.current = target
    setCurrent(target)
    el.scrollBy({left: item.getBoundingClientRect().left - anchor(el), behavior: 'smooth'})
  }

  return (
    <div className="ds-process ds-process--swipe" style={{'--done': last > 0 ? current / last : 0} as CSSProperties}>
      <div className="ds-wrap">
        <div className="ds-rail">
          <p className="ds-rail-count" aria-live="polite"><b>{pad2(current + 1)}</b><span>/ {pad2(count)}</span></p>
          <ol className="ds-rail-nodes" aria-label="Steps">
            {titles.map((title, index) => (
              <li key={title} className={index < current ? 'is-done' : index === current ? 'is-current' : undefined}>
                <button type="button" aria-label={`Step ${index + 1}: ${title}`} aria-current={index === current ? 'step' : undefined} onClick={() => go(index)}>{index + 1}</button>
              </li>
            ))}
          </ol>
          <div className="ds-rail-arrows">
            <button type="button" className="ds-round-btn" disabled={current === 0} aria-label="Previous step" onClick={() => go(current - 1)}><Icon name="arrowLeft" size={18} /></button>
            <button type="button" className="ds-round-btn ds-round-btn--solid" disabled={current === last} aria-label="Next step" onClick={() => go(current + 1)}><Icon name="arrowRight" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="ds-track-viewport ar-process-viewport" ref={viewport} tabIndex={0} aria-label="Process steps" {...drag}>
        <ol className="ds-track">{children}</ol>
      </div>
    </div>
  )
}
