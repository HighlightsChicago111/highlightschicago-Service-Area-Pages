/* eslint-disable @next/next/no-img-element -- Photos come from Sanity's CDN or /public; native img keeps alt text and captions crawlable. */
import type {CSSProperties, ReactNode} from 'react'
import {Icon, type IconName} from './icon'
import {focus, splitConfirm, type Photo} from '@/lib/ds'

/** Keep hyphenated words whole, so a heading never breaks as "SWITCH- / ON". */
export function keepHyphens(text: ReactNode): ReactNode {
  if (typeof text !== 'string' || !/\w-\w/.test(text)) return text
  return text.split(/(\S*\w-\w\S*)/).map((part, index) => (index % 2 ? <span className="ds-nowrap" key={index}>{part}</span> : part))
}

export function Eyebrow({children, className}: {children: ReactNode; className?: string}) {
  return <p className={className ? `ds-eyebrow ${className}` : 'ds-eyebrow'}>{children}</p>
}

/** Section head: eyebrow, H2 and lede, with an optional right-hand slot. `split` puts the lede beside the H2. */
export function SectionHead({eyebrow, title, lede, editorial = false, aside, id, split = false, narrow = false}: {
  eyebrow?: ReactNode
  title: ReactNode
  lede?: string
  editorial?: boolean
  aside?: ReactNode
  id?: string
  split?: boolean
  narrow?: boolean
}) {
  return (
    <div className={`ds-head${split ? ' ds-head--split' : ''}${aside ? ' ds-head--aside' : ''}`}>
      <div className={narrow ? 'ds-head-main ds-head-main--narrow' : 'ds-head-main'}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="ds-h2" id={id}>{keepHyphens(title)}</h2>
        {!split && <Copy value={lede} show={editorial} className="ds-lede" />}
      </div>
      {split && <Copy value={lede} show={editorial} className="ds-lede ds-head-lede" />}
      {aside && <div className="ds-head-aside">{aside}</div>}
    </div>
  )
}

type ButtonTone = 'primary' | 'secondary' | 'light' | 'outline-light'

export function Button({href, tone = 'primary', icon, trailing, children, size, block}: {
  href: string
  tone?: ButtonTone
  icon?: IconName
  trailing?: IconName
  children: ReactNode
  size?: 'm'
  block?: boolean
}) {
  return (
    <a className={`ds-btn ds-btn--${tone}${size ? ` ds-btn--${size}` : ''}${block ? ' ds-btn--block' : ''}`} href={href}>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
      {trailing && <Icon name={trailing} size={18} />}
    </a>
  )
}

export function GhostLink({href, children, onDark}: {href: string; children: ReactNode; onDark?: boolean}) {
  return <a className={onDark ? 'ds-ghost ds-ghost--dark' : 'ds-ghost'} href={href}><span>{children}</span><Icon name="arrowRight" size={16} /></a>
}

type BadgeTone = 'blue' | 'green' | 'navy' | 'white' | 'solid-blue'

export function IconBadge({icon, tone = 'blue', size = 48}: {icon: IconName; tone?: BadgeTone; size?: 32 | 40 | 44 | 48 | 56 | 64}) {
  return <span className={`ds-badge ds-badge--${tone}`} style={{'--badge': `${size}px`} as CSSProperties}><Icon name={icon} size={Math.round(size * 0.42)} /></span>
}

/** "[CONFIRM: …]" chips. Editorial only: rendered in development and draft preview, never on a published page. */
export function ConfirmNotes({notes, show}: {notes: string[]; show: boolean}) {
  if (!show || !notes.length) return null
  return <span className="ds-confirm-list">{notes.map((note) => <span className="ds-confirm" key={note}>{note}</span>)}</span>
}

/** Approved copy with its editorial flags shown as chips (or dropped) per {@link ConfirmNotes}. */
export function Copy({value, show, as: Tag = 'p', className}: {value?: string; show: boolean; as?: 'p' | 'span' | 'div'; className?: string}) {
  const {text, notes} = splitConfirm(value)
  if (!text && !(show && notes.length)) return null
  return (
    <Tag className={className}>
      {text}
      {notes.length > 0 && show && <>{text && ' '}<ConfirmNotes notes={notes} show={show} /></>}
    </Tag>
  )
}

/** A photo in a 10px-radius frame; AI or stock images carry the "Illustrative photo" pill (playbook G.2). */
export function PhotoFrame({photo, className, sizes, eager, pill = true, children}: {
  photo?: Photo
  className?: string
  sizes?: string
  eager?: boolean
  pill?: boolean | string
  children?: ReactNode
}) {
  if (!photo) return null
  const pillText = typeof pill === 'string' ? pill : photo.illustrative ? 'Illustrative photo' : ''
  return (
    <figure className={className ? `ds-photo ${className}` : 'ds-photo'}>
      <img src={photo.src} alt={photo.alt} title={photo.label || photo.alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async" sizes={sizes} style={focus(photo)} />
      {pill !== false && pillText && <figcaption className="ds-pill-caption">{pillText}</figcaption>}
      {children}
    </figure>
  )
}

/** Placeholder for a block that has no honest photo yet. */
export function IconTile({icon, className}: {icon: IconName; className?: string}) {
  return <span className={className ? `ds-icon-tile ${className}` : 'ds-icon-tile'} aria-hidden="true"><Icon name={icon} size={40} /></span>
}

export function GoogleG({size = 20}: {size?: number}) {
  return (
    <svg className="ds-google" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Google">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.6h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8 41.3 15.4 46 24 46z" />
      <path fill="#FBBC04" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.6z" />
      <path fill="#EA4335" d="M24 10.3c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C35 3.8 30 1.8 24 1.8 15.4 1.8 8 6.5 4.5 13.9l7.3 5.7c1.7-5.2 6.5-9.3 12.2-9.3z" />
    </svg>
  )
}

/** Green rating stars (proof colour). The numeral beside them carries the value for screen readers. */
export function Stars({size = 16}: {size?: number}) {
  return <span className="ds-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((index) => <svg key={index} width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" /></svg>)}</span>
}

