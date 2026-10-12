'use client'

import {useId, useState} from 'react'
import {useLeadSubmit} from '@/lib/use-lead-submit'
import {Icon} from './icon'

const NEEDS = [
  "Something's not working (repair)", "It's urgent or unsafe", 'Lighting', 'Outlets, switches or appliance circuits', 'Panel or service',
  'EV charger', 'Generator, solar or battery', 'Inspection or code correction', 'Data, security or AV wiring', 'Remodel, build-out or new construction',
]
const RULES = ['Not sure', 'Yes, I can share the requirements', "No, it's my own building"]

type Props = {area: string; areaIn: string; districts: string[]; buildings: string[]; addressPlaceholder?: string; rulesQuestion?: string}

function Select({id, name, label, options}: {id: string; name: string; label: string; options: string[]}) {
  return (
    <div className="ds-field">
      <label htmlFor={id}>{label}</label>
      <span className="ds-select"><select id={id} name={name}>{options.map((item) => <option key={item}>{item}</option>)}</select><Icon name="chevronDown" size={18} /></span>
    </div>
  )
}

/** Area request form: two numbered groups, "What do you need?" as chips (design system v3 quote form). */
export function AreaQuoteForm({area, areaIn, districts, buildings, addressPlaceholder, rulesQuestion}: Props) {
  const {status, submit} = useLeadSubmit()
  const id = useId()
  const [need, setNeed] = useState(NEEDS[0])

  return (
    <aside className="ds-form-card" id="quote" aria-labelledby={`${id}-title`}>
      <h2 className="ds-form-title" id={`${id}-title`}>Book an electrician {areaIn}</h2>
      <p className="ds-form-sub">Free estimate. The person who walks your space is the person who writes the quote.</p>
      <form onSubmit={submit}>
        <input type="hidden" name="service" value={`Service area page: ${area}`} />
        <input type="hidden" name="area" value={area} />
        <label className="ds-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>

        <div className="ds-form-group" role="group" aria-labelledby={`${id}-g1`}>
          <p className="ds-form-group-title" id={`${id}-g1`}><span className="ds-step-dot">1</span>Your details</p>
          <div className="ds-form-row">
            <div className="ds-field"><label htmlFor={`${id}-name`}>Name</label><input id={`${id}-name`} name="name" required autoComplete="name" /></div>
            <div className="ds-field"><label htmlFor={`${id}-phone`}>Phone</label><input id={`${id}-phone`} name="phone" type="tel" required autoComplete="tel" inputMode="tel" /></div>
          </div>
          <div className="ds-field ds-field--icon">
            <label htmlFor={`${id}-address`}>Building name or street</label>
            <span className="ds-input-icon"><Icon name="mapPin" size={18} /><input id={`${id}-address`} name="address" placeholder={addressPlaceholder || 'Street address or building name'} autoComplete="street-address" /></span>
          </div>
        </div>

        <div className="ds-form-group" role="group" aria-labelledby={`${id}-g2`}>
          <p className="ds-form-group-title" id={`${id}-g2`}><span className="ds-step-dot">2</span>Your {area} job</p>
          <Select id={`${id}-district`} name="district" label={`Where ${areaIn}?`} options={[...districts, 'Not sure']} />
          <Select id={`${id}-building`} name="buildingType" label="Building type" options={[...buildings, 'Not sure']} />
          <div className="ds-field" role="radiogroup" aria-labelledby={`${id}-need`}>
            <span className="ds-label" id={`${id}-need`}>What do you need?</span>
            <div className="ds-chip-options">
              {NEEDS.map((option) => (
                <label className={`ds-chip-option${need === option ? ' is-selected' : ''}`} key={option}>
                  <input type="radio" name="issue" value={option} checked={need === option} onChange={() => setNeed(option)} />
                  {need === option && <Icon name="check" size={14} />}
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
          <Select id={`${id}-rules`} name="buildingRules" label={rulesQuestion || 'Does your building need a certificate of insurance or management approval?'} options={RULES} />
        </div>

        <button className="ds-btn ds-btn--primary ds-btn--block" type="submit" disabled={status === 'sending'}>
          <span>{status === 'sending' ? 'Sending…' : 'Request a walkthrough'}</span><Icon name="arrowRight" size={18} />
        </button>
        {status === 'error' && <p className="ds-form-error" role="alert">We could not send the form. Please call us instead.</p>}
        <p className="ds-form-note"><Icon name="circleCheck" size={16} />Free estimates. Written scope before work starts.</p>
      </form>
    </aside>
  )
}
