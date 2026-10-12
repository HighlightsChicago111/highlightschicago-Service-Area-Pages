'use client'

import {useCallback, useEffect, useId, useRef, useState, type ReactNode} from 'react'
import {Icon} from '@/components/ds/icon'
import {pad2} from '@/lib/ds'

/**
 * A list that becomes a swipe carousel at phone width (CSS does the layout), with an
 * "01 / 08" counter and dots. On wider screens the counter and dots are hidden and the
 * list is the normal grid.
 */
export function Carousel({className, headClassName, head, label, children}: {
  className: string
  headClassName: string
  head?: ReactNode
  label: string
  children: ReactNode[]
}) {
  const track = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)
  const count = children.length

  const sync = useCallback(() => {
    const el = track.current
    if (!el) return
    const items = Array.from(el.children) as HTMLElement[]
    const left = el.scrollLeft + el.offsetLeft
    let best = 0
    items.forEach((item, index) => { if (Math.abs(item.offsetLeft - left) < Math.abs(items[best].offsetLeft - left)) best = index })
    // At the end of the track the last card may never reach the left edge.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) best = items.length - 1
    setActive(best)
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    el.addEventListener('scroll', sync, {passive: true})
    return () => el.removeEventListener('scroll', sync)
  }, [sync])

  const go = (index: number) => {
    const el = track.current
    const item = el?.children[index] as HTMLElement | undefined
    if (el && item) el.scrollTo({left: item.offsetLeft - el.offsetLeft, behavior: 'smooth'})
  }

  return (
    <>
      <div className={headClassName}>
        {head}
        <span className="ar-carousel-count" aria-hidden="true">{pad2(active + 1)} / {pad2(count)}</span>
      </div>
      <ul className={`${className} ar-carousel`} ref={track} aria-label={label}>{children}</ul>
      <div className="ar-dots">
        {children.map((_, index) => (
          <button type="button" key={index} className={index === active ? 'is-active' : undefined} aria-label={`Show ${index + 1} of ${count}`} aria-current={index === active || undefined} onClick={() => go(index)} />
        ))}
      </div>
    </>
  )
}

export type AccordionItem = {key: string; className?: string; head: ReactNode; body: ReactNode; title: string}

/**
 * A card list that stays fully open on wider screens and folds into an accordion at
 * phone width, first card open. The toggle button only shows at phone width.
 */
export function PhoneAccordion({className, items}: {className: string; items: AccordionItem[]}) {
  const [open, setOpen] = useState(0)
  const id = useId()
  return (
    <ul className={className}>
      {items.map((item, index) => {
        const isOpen = open === index
        return (
          <li className={`${item.className || ''}${isOpen ? ' is-open' : ''}`} key={item.key}>
            <div className="ar-acc-head">
              {item.head}
              <button type="button" className="ar-acc-btn" aria-expanded={isOpen} aria-controls={`${id}-${index}`} aria-label={`${isOpen ? 'Hide' : 'Show'} details: ${item.title}`} onClick={() => setOpen(isOpen ? -1 : index)}>
                <Icon name={isOpen ? 'minus' : 'plus'} size={14} />
              </button>
            </div>
            <div className="ar-acc-body" id={`${id}-${index}`}>{item.body}</div>
          </li>
        )
      })}
    </ul>
  )
}
