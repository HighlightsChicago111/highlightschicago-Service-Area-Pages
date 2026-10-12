import type {CSSProperties} from 'react'
import type {IconName} from '@/components/ds/icon'
import type {AreaSettings} from '@/types/area'
import {BASE_PATH} from '@/lib/urls'

/* Design System v3 helpers for the service area pages (ported from the service-page build). */

const CONFIRM = /\[CONFIRM:[^\]]*\]/g

/** Approved copy with its "[CONFIRM: …]" editorial flags pulled out. */
export type Editorial = {text: string; notes: string[]}

export function splitConfirm(value?: string): Editorial {
  if (!value) return {text: '', notes: []}
  const notes = value.match(CONFIRM) || []
  const text = value.replace(CONFIRM, ' ').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim()
  return {text, notes}
}

export const hasConfirm = (value?: string) => Boolean(value && /\[CONFIRM:[^\]]*\]/.test(value))

/** `position` is a CSS object-position focal point for photos whose subject is off-centre. */
export type Photo = {src: string; alt: string; illustrative?: boolean; label?: string; credit?: string; position?: string}

export const focus = (photo?: Photo): CSSProperties | undefined => (photo?.position ? {objectPosition: photo.position} : undefined)

const asset = (file: string) => `${BASE_PATH}/images/ds/${file}`
export const LOGO = asset('highlights-chicago-logo.webp')
export const LOGO_WHITE = asset('highlights-chicago-logo-white.webp')

/** Shared brand photos used on every area page. */
export const PHOTOS = {
  hero: {src: asset('gen-roof-site-assessment.webp'), alt: 'Highlights Chicago electrician on a Chicago roof recording a site assessment on a tablet', illustrative: true},
  van: {src: asset('van-chicago-skyline.webp'), alt: 'Highlights Chicago service van in front of the Chicago skyline at dusk'},
  techTesting: {src: asset('tech-panel-testing.webp'), alt: 'Highlights Chicago electrician testing a panel with a multimeter', illustrative: true},
} satisfies Record<string, Photo>

/** Business-wide contact details the company-facts document does not hold. */
export const COMPANY_EMAIL = 'info@highlightschicago.com'
export const OFFICE_HOURS_SHORT = 'Mon–Fri 08:00 AM – 05:00 PM'

export const telHref = (tel?: string, display?: string) => `tel:${tel || (display || '').replace(/[^\d+]/g, '')}`
export const pad2 = (n: number) => String(n).padStart(2, '0')
export const initial = (name: string) => (name.trim().charAt(0) || '?').toUpperCase()

export type Credential = {tag: string; icon: IconName; value: string; caption: string; kind: 'founder' | 'licence' | 'bbb' | 'permits'}

/** The four verified credential tiles, from the company-facts document. */
export function credentials(co: AreaSettings): Credential[] {
  const list: Array<Credential | null> = [
    co.founderShort ? {tag: 'Founder', icon: 'user', value: co.founderShort, caption: co.founderLine || '', kind: 'founder'} : null,
    {tag: 'Licence', icon: 'shieldCheck', value: co.licence, caption: `City of Chicago Electrical Contractor${co.licence2 ? `, also ${co.licence2}` : ''}`, kind: 'licence'},
    {tag: 'BBB rating', icon: 'award', value: 'A+', caption: co.bbb || '', kind: 'bbb'},
    {tag: 'Permit record', icon: 'fileCheck', value: co.permitsCitywide, caption: `City permits on record since ${co.permitsSince || '2012'}${co.permitsRank ? `, ${co.permitsRank}` : ''}`, kind: 'permits'},
  ]
  return list.filter((item): item is Credential => item !== null)
}
