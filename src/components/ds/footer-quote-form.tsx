'use client'

import {useId} from 'react'
import {useLeadSubmit} from '@/lib/use-lead-submit'

/** Footer "glass" quote card form. Posts to the shared lead endpoint like every other form. */
export function FooterQuoteForm({phone, tel}: {phone: string; tel: string}) {
  const {status, submit} = useLeadSubmit()
  const id = useId()

  return (
    <form className="ds-foot-form" aria-label="Request a quick quote" onSubmit={submit}>
      <input type="hidden" name="service" value="General electrical service" />
      <input type="hidden" name="area" value="Chicago" />
      <label className="ds-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="ds-foot-form-grid">
        <label htmlFor={`${id}-name`}><span>Name</span><input id={`${id}-name`} name="name" placeholder="Your name" required autoComplete="name" /></label>
        <label htmlFor={`${id}-email`}><span>Email</span><input id={`${id}-email`} name="email" type="email" placeholder="Your email" autoComplete="email" /></label>
        <label htmlFor={`${id}-phone`}><span>Phone number</span><input id={`${id}-phone`} name="phone" type="tel" placeholder="Your phone number" required autoComplete="tel" /></label>
        <label htmlFor={`${id}-address`}><span>Property address</span><input id={`${id}-address`} name="address" placeholder="Property address" autoComplete="street-address" /></label>
      </div>
      <label htmlFor={`${id}-issue`}><span>How can we help?</span><textarea id={`${id}-issue`} name="issue" placeholder="Hey, how can we help?" rows={3} /></label>
      <button className="ds-btn ds-btn--light ds-btn--block" type="submit" disabled={status === 'sending'}><span>{status === 'sending' ? 'Sending…' : 'Request free quote'}</span></button>
      {status === 'error' && <p className="ds-form-error" role="alert">We could not send the form. Please call {phone}.</p>}
      <p className="ds-foot-call">Or call <a href={tel}>{phone}</a></p>
    </form>
  )
}
