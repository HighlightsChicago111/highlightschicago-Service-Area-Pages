'use client'

import {useLeadSubmit} from '@/lib/use-lead-submit'

const NEEDS = [
  "Something's not working (repair)", "It's urgent or unsafe", 'Lighting', 'Outlets, switches or appliance circuits', 'Panel or service',
  'EV charger', 'Generator, solar or battery', 'Inspection or code correction', 'Data, security or AV wiring', 'Remodel, build-out or new construction',
]

type Props = {area: string; areaIn: string; districts: string[]; buildings: string[]; addressPlaceholder?: string; rulesQuestion?: string}

export function AreaLeadForm({area, areaIn, districts, buildings, addressPlaceholder, rulesQuestion}: Props) {
  const {status, submit} = useLeadSubmit()
  return (
    <aside className="form-card" id="quote">
      <h2>Book an electrician {areaIn}</h2>
      <p className="muted small">Free estimate. The person who walks your space is the person who writes the quote.</p>
      <form onSubmit={submit}>
        <input type="hidden" name="area" value={area} />
        <input type="hidden" name="service" value={`Service area page: ${area}`} />
        <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" name="website" /></label>
        <div className="field"><label htmlFor="f-name">Name</label><input id="f-name" required autoComplete="name" name="name" /></div>
        <div className="field"><label htmlFor="f-phone">Phone</label><input id="f-phone" type="tel" required autoComplete="tel" name="phone" /></div>
        <div className="field"><label htmlFor="f-addr">Building name or street</label><input id="f-addr" placeholder={addressPlaceholder || 'Street address or building name'} autoComplete="street-address" name="address" /></div>
        <div className="field"><label htmlFor="f-district">Where {areaIn}?</label><select id="f-district" name="district">{[...districts, 'Not sure'].map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="f-bldg">Building type</label><select id="f-bldg" name="buildingType">{[...buildings, 'Not sure'].map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="f-need">What do you need?</label><select id="f-need" name="issue">{NEEDS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="f-coi">{rulesQuestion || 'Does your building need a certificate of insurance or management approval?'}</label><select id="f-coi" name="buildingRules"><option>Not sure</option><option>Yes, I can share the requirements</option><option>No, it&apos;s my own building</option></select></div>
        <button className="btn btn-primary btn-block" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Request a walkthrough'}</button>
        <p className="form-note">Free estimates. Written scope before work starts.</p>
        {status === 'error' && <p className="form-error" role="alert">The form could not be sent. Please call us instead.</p>}
      </form>
    </aside>
  )
}
