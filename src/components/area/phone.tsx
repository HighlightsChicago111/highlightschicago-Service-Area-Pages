'use client'

import {useCallback, useEffect, useId, useRef, useState, type DragEvent, type MouseEvent, type PointerEvent, type ReactNode} from 'react'
import {Icon} from '@/components/ds/icon'
import {pad2} from '@/lib/ds'

/**
 * Mouse drag to scroll a horizontal track (touch and touchpad already scroll natively).
 * The track gets `is-dragging` while it moves, and a drag swallows the click that
 * follows, so "Read more" and links don't fire by accident.
 */
export function useDragScroll() {
  const drag = useRef<{x: number; left: number; moved: boolean} | null>(null)
  const dragged = useRef(false)
  const end = (event: PointerEvent<HTMLElement>) => { drag.current = null; event.currentTarget.classList.remove('is-dragging') }
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      drag.current = {x: event.clientX, left: event.currentTarget.scrollLeft, moved: false}
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const state = drag.current
      const el = event.currentTarget
      if (!state) return
      const dx = event.clientX - state.x
      if (!state.moved) {
        if (Math.abs(dx) < 6) return
        state.moved = true
        el.classList.add('is-dragging')
        el.setPointerCapture(event.pointerId)
      }
      el.scrollLeft = state.left - dx
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => { dragged.current = Boolean(drag.current?.moved); end(event) },
    onPointerCancel: end,
    onClickCapture: (event: MouseEvent) => { if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false } },
    onDragStart: (event: DragEvent) => event.preventDefault(),
  }
}

/**
 * A list that becomes a swipe carousel at phone width (CSS does the layout), with an
 * "01 / 08" counter and dots. On wider screens the counter and dots are hidden and the
 * list is the normal grid.
 *
 * With `rail`, the list stays one horizontal row at every width: touchpad and touch
 * scroll natively, a mouse can drag it, and prev/next buttons sit in the head.
 */
export function Carousel({className, headClassName, head, label, children, rail = false, ordered = false}: {
  className: string
  headClassName: string
  head?: ReactNode
  label: string
  children: ReactNode[]
  rail?: boolean
  ordered?: boolean
}) {
  const track = useRef<HTMLUListElement & HTMLOListElement>(null)
  const [active, setActive] = useState(0)
  const [edges, setEdges] = useState({start: true, end: false})
  const count = children.length

  const sync = useCallback(() => {
    const el = track.current
    if (!el) return
    const items = Array.from(el.children) as HTMLElement[]
    const left = el.scrollLeft + el.offsetLeft
    let best = 0
    items.forEach((item, index) => { if (Math.abs(item.offsetLeft - left) < Math.abs(items[best].offsetLeft - left)) best = index })
    // At the end of the track the last card may never reach the left edge.
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    if (atEnd) best = items.length - 1
    setActive(best)
    setEdges({start: el.scrollLeft <= 2, end: atEnd})
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, {passive: true})
    const resize = new ResizeObserver(sync)
    resize.observe(el)
    return () => { el.removeEventListener('scroll', sync); resize.disconnect() }
  }, [sync])

  const go = (index: number) => {
    const el = track.current
    const item = el?.children[index] as HTMLElement | undefined
    if (el && item) el.scrollTo({left: item.offsetLeft - el.offsetLeft, behavior: 'smooth'})
  }

  const page = (dir: 1 | -1) => track.current?.scrollBy({left: dir * track.current.clientWidth * 0.85, behavior: 'smooth'})
  const dragProps = useDragScroll()

  const List = ordered ? 'ol' : 'ul'
  return (
    <>
      <div className={headClassName}>
        {head}
        <span className="ar-carousel-count" aria-hidden="true">{pad2(active + 1)} / {pad2(count)}</span>
        {rail && <div className="ar-rail-nav">
          <button type="button" aria-label={`Previous: ${label}`} disabled={edges.start} onClick={() => page(-1)}><Icon name="arrowLeft" size={18} /></button>
          <button type="button" aria-label={`Next: ${label}`} disabled={edges.end} onClick={() => page(1)}><Icon name="arrowRight" size={18} /></button>
        </div>}
      </div>
      <List className={`${className} ar-carousel${rail ? ' ar-rail' : ''}`} ref={track} aria-label={label} {...(rail ? dragProps : {})}>{children}</List>
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
