/* eslint-disable @next/next/no-img-element -- Full-bleed band photo and the white logo from /public. */
import {Button, Eyebrow, GoogleG, IconBadge, Stars} from '@/components/ds/atoms'
import {Icon, pickIcon} from '@/components/ds/icon'
import {DEFAULT_READY} from '@/lib/area/copy'
import {credentials, LOGO_WHITE, pad2, PHOTOS} from '@/lib/ds'
import type {AreaCtx} from './types'

/** Closing call to action: van photo into navy, proof numerals and "have these ready when you call". */
export function ClosingBlock({ctx}: {ctx: AreaCtx}) {
  const {page, co, tel} = ctx
  const ready = page.ctaReady?.length ? page.ctaReady : DEFAULT_READY
  const order = ['bbb', 'permits', 'licence']
  const proof = credentials(co).filter((item) => item.kind !== 'founder').sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
  const captions: Record<string, string> = {
    bbb: (co.bbb || '').split('.')[0] || 'BBB accredited',
    permits: `Permits on public record since ${co.permitsSince || '2012'}`,
    licence: 'City of Chicago Electrical Contractor',
  }

  return (
    <>
      <img className="ds-closing-bg" src={PHOTOS.van.src} alt="" loading="lazy" decoding="async" />
      <div className="ds-closing-scrim" aria-hidden="true" />
      <div className="ds-wrap ds-closing">
        <img className="ds-closing-logo" src={LOGO_WHITE} alt="Highlights Chicago Electrical Services" width={170} height={50} loading="lazy" />
        <Eyebrow>Your next step</Eyebrow>
        <h2 className="ds-h1 ds-closing-title" id="closing-title">Planning electrical work {page.areaIn}?</h2>
        <p className="ds-lede">A free walkthrough with the founder, a written scope, and a registered contractor who pulls the permit if the work needs one.</p>
        <div className="ds-cta-row">
          <Button href={tel} tone="light" icon="phone">Call {co.phoneDisplay}</Button>
          <Button href="#quote" tone="outline-light">Book a walkthrough</Button>
        </div>
        <ul className="ds-proof-strip">
          <li><p className="ds-proof-big"><span className="ds-google-disc"><GoogleG size={22} /></span><b>{co.googleRating}</b><Stars size={14} /></p><p>{co.googleReviews} Google reviews</p></li>
          {proof.map((item) => <li key={item.kind}><p className="ds-proof-big"><IconBadge icon={item.icon} tone="navy" size={40} /><b>{item.value}</b></p><p>{captions[item.kind]}</p></li>)}
        </ul>
        <div className="ds-ready">
          <div className="ds-ready-head">
            <span className="ds-ready-badge"><Icon name="clipboardCheck" size={28} /></span>
            <h3 className="ds-h4">Have these ready when you call</h3>
            <a className="ds-ghost ds-ghost--dark ds-ghost--caps" href={tel}><span>Call {co.phoneDisplay}</span><Icon name="arrowRight" size={16} /></a>
          </div>
          <ul className="ds-ready-items">
            {ready.map((item, index) => <li key={item}><IconBadge icon={pickIcon(item, 'circleCheck')} tone="navy" size={44} /><span className="ar-ready-num">{pad2(index + 1)}</span><p>{item}</p></li>)}
          </ul>
        </div>
      </div>
    </>
  )
}
