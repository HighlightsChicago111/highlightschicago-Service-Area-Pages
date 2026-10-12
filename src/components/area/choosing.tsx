import {Copy} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {choosingChecks} from '@/lib/area/copy'
import {pad2} from '@/lib/ds'
import {AreaHead} from './head'
import type {AreaCtx} from './types'

/** "Who are the best electricians in …?": seven checks anyone can verify, with Highlights' answer highlighted. */
export function ChoosingBlock({ctx}: {ctx: AreaCtx}) {
  const {page, co, editorial} = ctx
  const checks = choosingChecks(page, co)
  return (
    <div className="ds-wrap">
      <AreaHead id="choosing-title" layout="stack" eyebrow={`How to choose · ${checks.length} checks`} title={`Who are the best electricians ${page.areaIn}? How to tell for yourself`} editorial={editorial}
        lede={`There isn't one best electrician for ${page.areaThe}. There's the right one for your building and your job. These checks separate them, and every one can be verified without taking anyone's word for it, including ours.`} />
      <div className="ar-checks" role="table" aria-label="How to check an electrician">
        <div className="ar-checks-head" role="row">
          <span role="columnheader">What to check</span><span role="columnheader">Why it matters {page.areaIn}</span><span role="columnheader">How to verify it</span>
          <span role="columnheader" className="ar-checks-us">{"Highlights Chicago's answer"}</span>
        </div>
        {checks.map((check, index) => (
          <div className="ar-check" role="row" key={check.what}>
            <div className="ar-check-what" role="cell"><span>{pad2(index + 1)}</span><h3 className="ar-row-title">{check.what}</h3></div>
            <div className="ar-check-why" role="cell"><Copy value={check.why} show={editorial} /></div>
            <div className="ar-check-verify" role="cell"><p className="ar-mini-label">How to verify it</p><p>{check.verify}</p></div>
            <div className="ar-check-answer" role="cell"><Icon name="circleCheck" size={18} /><Copy value={check.answer} show={editorial} as="span" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
