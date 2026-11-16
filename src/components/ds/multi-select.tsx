'use client'

import {useEffect, useId, useRef, useState} from 'react'
import {Icon} from './icon'

type Props = {name: string; label: string; options: string[]; placeholder?: string}

/**
 * A dropdown that takes several answers. It looks like the form's other selects; opening it shows a
 * checklist. The answers go out as ONE comma-separated field (`name`), so the lead webhook and the
 * Zapier mapping receive the same single field as before, just with every choice in it.
 */
export function MultiSelect({name, label, options, placeholder = 'Select one or more'}: Props) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<string[]>([])

  // Close on a click outside or on Escape (which also hands focus back to the button).
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Keep the answers in the order the options are listed, whatever order they were ticked in.
  const toggle = (option: string) => setChosen((current) => options.filter((item) => (item === option ? !current.includes(item) : current.includes(item))))
  const summary = chosen.length === 0 ? placeholder : chosen.length <= 2 ? chosen.join(', ') : `${chosen.length} selected`

  return (
    <div className={`ds-field ds-multi${open ? ' is-open' : ''}`} ref={root}>
      <span className="ds-label" id={`${id}-label`}>{label}</span>
      <input type="hidden" name={name} value={chosen.join(', ')} />
      <button
        ref={trigger}
        type="button"
        className="ds-multi-trigger"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen((value) => !value)}
      >
        <span id={`${id}-value`} className={chosen.length ? 'ds-multi-value' : 'ds-multi-value is-placeholder'}>{summary}</span>
        <Icon name="chevronDown" size={18} />
      </button>
      {open && (
        <div className="ds-multi-panel" id={`${id}-list`} role="group" aria-labelledby={`${id}-label`}>
          {options.map((option) => {
            const selected = chosen.includes(option)
            return (
              <label className={`ds-multi-option${selected ? ' is-selected' : ''}`} key={option}>
                <input type="checkbox" checked={selected} onChange={() => toggle(option)} />
                <span className="ds-multi-box" aria-hidden="true">{selected && <Icon name="check" size={14} />}</span>
                <span>{option}</span>
              </label>
            )
          })}
          <button type="button" className="ds-multi-done" onClick={() => { setOpen(false); trigger.current?.focus() }}>Done</button>
        </div>
      )}
    </div>
  )
}
