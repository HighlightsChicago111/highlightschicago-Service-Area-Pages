'use client'

import {useLayoutEffect, useRef, useState} from 'react'

/** Review text clamped to eight lines, with "Read more" only when it is actually cut. */
export function ReviewText({text}: {text: string}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [clipped, setClipped] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) setClipped(el.scrollHeight > el.clientHeight + 2)
  }, [text])
  return (
    <>
      <p ref={ref} className={`ar-review-text${open ? ' is-open' : ''}`}>{text}</p>
      {(clipped || open) && <button type="button" className="ar-text-btn" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? 'Show less' : 'Read more'}</button>}
    </>
  )
}
