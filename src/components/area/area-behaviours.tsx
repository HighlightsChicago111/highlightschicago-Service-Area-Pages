'use client'

import {useEffect} from 'react'

/**
 * Progressive enhancement for the area page, ported from the skill's car_js, proc_js, slider_js,
 * tabs_js and genbar scripts. Everything is server-rendered and readable without it: all service
 * panels, reviews and cards are in the HTML; this adds tabs, the scroll bars and "Read more".
 */
export function AreaBehaviours() {
  useEffect(() => {
    // One signal removes every listener on cleanup (React runs effects twice in development).
    const controller = new AbortController()
    const signal = controller.signal
    const cleanups: Array<() => void> = [() => controller.abort()]
    const on = <K extends keyof WindowEventMap>(target: Window, type: K, fn: (event: WindowEventMap[K]) => void) => target.addEventListener(type, fn, {signal})
    const fireResize = () => window.dispatchEvent(new Event('resize'))

    // Contents list starts closed on phones.
    const toc = document.querySelector<HTMLDetailsElement>('.nx-toc-d')
    if (toc && window.matchMedia('(max-width:860px)').matches) toc.open = false

    // Service tabs.
    const box = document.getElementById('svc-tabs')
    if (box) {
      const tabs = Array.from(box.querySelectorAll<HTMLButtonElement>('[role=tab]'))
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') || '') as HTMLElement)
      box.classList.add('is-tabs')
      const show = (index: number, focus = false) => {
        tabs.forEach((tab, j) => {
          const active = j === index
          tab.setAttribute('aria-selected', String(active))
          tab.tabIndex = active ? 0 : -1
          panels[j].hidden = !active
        })
        const list = panels[index].querySelector<HTMLElement>('.nx-svc')
        if (list) {
          list.scrollLeft = 0
          setTimeout(() => list.dispatchEvent(new Event('scroll')), 30)
        }
        if (focus) tabs[index].focus()
      }
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => show(i), {signal})
        tab.addEventListener('keydown', (event) => {
          const n = tabs.length
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); show((i + 1) % n, true) }
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); show((i - 1 + n) % n, true) }
          if (event.key === 'Home') { event.preventDefault(); show(0, true) }
          if (event.key === 'End') { event.preventDefault(); show(n - 1, true) }
        }, {signal})
      })
      const fromHash = () => {
        const index = panels.map((panel) => `#${panel.id}`).indexOf(location.hash)
        if (index > -1) {
          show(index)
          box.scrollIntoView({block: 'start'})
          return true
        }
        return false
      }
      on(window, 'hashchange', fromHash)
      if (!fromHash()) show(0)
    }

    // Carousels with their own bar (who, review figures).
    document.querySelectorAll<HTMLElement>('.nx-car').forEach((root) => {
      const track = root.querySelector<HTMLElement>('.nx-car-track')
      const bar = root.querySelector<HTMLElement>(':scope > .nx-bar')
      if (!track) return
      const thumb = bar?.firstElementChild as HTMLElement | null
      const update = () => {
        root.classList.toggle('is-scroll', track.scrollWidth > track.clientWidth + 2)
        if (thumb) {
          const ratio = track.clientWidth / track.scrollWidth
          const max = track.scrollWidth - track.clientWidth
          thumb.style.width = `${ratio * 100}%`
          thumb.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * (1 / ratio - 1) * 100 : 0}%)`
        }
      }
      if (bar) bindBar(bar, track, signal)
      let timer: ReturnType<typeof setTimeout>
      track.addEventListener('scroll', () => { update(); clearTimeout(timer); timer = setTimeout(fireResize, 80) }, {signal})
      on(window, 'resize', update)
      update()
    })

    // Process steps.
    const proc = document.getElementById('proc')
    const procTrack = proc?.querySelector<HTMLElement>('.nx-proc-track')
    if (proc && procTrack) {
      const update = () => proc.classList.toggle('is-scroll', procTrack.scrollWidth > procTrack.clientWidth + 2)
      on(window, 'resize', update)
      update()
    }

    // Review slider: clamp long reviews, "Read more", collapse cards scrolled out of view.
    const slider = document.getElementById('reviews')
    const sliderTrack = slider?.querySelector<HTMLElement>('.nx-track')
    if (slider && sliderTrack) {
      const collapseHidden = () => {
        const bounds = sliderTrack.getBoundingClientRect()
        slider.querySelectorAll<HTMLElement>('.nx-rev.is-open').forEach((card) => {
          const rect = card.getBoundingClientRect()
          if (rect.right <= bounds.left + 4 || rect.left >= bounds.right - 4) {
            card.classList.remove('is-open')
            const more = card.querySelector<HTMLButtonElement>('.nx-more')
            if (more) { more.setAttribute('aria-expanded', 'false'); more.textContent = 'Read more' }
          }
        })
      }
      let timer: ReturnType<typeof setTimeout>
      sliderTrack.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(() => { collapseHidden(); fireResize() }, 60) }, {signal})
      slider.querySelectorAll<HTMLElement>('.nx-rev').forEach((card) => {
        const text = card.querySelector<HTMLElement>('.nx-clamp')
        const more = card.querySelector<HTMLButtonElement>('.nx-more')
        if (!text || !more) return
        if (text.scrollHeight > text.clientHeight + 2) more.hidden = false
        more.addEventListener('click', () => {
          const open = card.classList.toggle('is-open')
          more.setAttribute('aria-expanded', String(open))
          more.textContent = open ? 'Show less' : 'Read more'
          collapseHidden()
          fireResize()
        }, {signal})
      })
      slider.classList.add('is-slider')
    }

    // Generic scroll bars under every other horizontal track.
    document.querySelectorAll<HTMLElement>('.nx-car-track, .nx-proc-track, .nx-track, .nx-vtabs .nx-svc').forEach((track) => {
      const host = track.parentElement
      if (!host || host.querySelector(':scope > .nx-bar')) return
      track.classList.add('nx-hide-sb')
      const bar = document.createElement('div')
      bar.className = 'nx-bar nx-bar-auto'
      bar.setAttribute('aria-hidden', 'true')
      const thumb = document.createElement('span')
      bar.appendChild(thumb)
      track.insertAdjacentElement('afterend', bar)
      const update = () => {
        const over = track.scrollWidth > track.clientWidth + 2 && track.clientWidth > 0
        bar.classList.toggle('is-on', over)
        if (!over) return
        const ratio = track.clientWidth / track.scrollWidth
        const max = track.scrollWidth - track.clientWidth
        thumb.style.width = `${ratio * 100}%`
        thumb.style.transform = `translateX(${(track.scrollLeft / max) * (1 / ratio - 1) * 100}%)`
      }
      bindBar(bar, track, signal)
      track.addEventListener('scroll', update, {signal})
      on(window, 'resize', update)
      if (window.ResizeObserver) {
        const observer = new ResizeObserver(update)
        observer.observe(track)
        cleanups.push(() => observer.disconnect())
      }
      document.addEventListener('click', () => setTimeout(update, 60), {signal})
      cleanups.push(() => bar.remove())
      update()
    })

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [])

  return null
}

function bindBar(bar: HTMLElement, track: HTMLElement, signal: AbortSignal) {
  bar.addEventListener('pointerdown', (event) => {
    const rect = bar.getBoundingClientRect()
    const go = (e: PointerEvent) => {
      const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      track.scrollLeft = fraction * (track.scrollWidth - track.clientWidth)
    }
    go(event)
    try { bar.setPointerCapture(event.pointerId) } catch { /* not supported */ }
    bar.onpointermove = go
    bar.onpointerup = () => { bar.onpointermove = null }
  }, {signal})
}
