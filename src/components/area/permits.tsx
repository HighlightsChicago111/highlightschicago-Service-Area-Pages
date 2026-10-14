import {Copy, IconBadge} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {andList, cityOf, DEFAULT_MIX_NOTES, isChicago, monthYear, municipalityKind, permitTypeWords} from '@/lib/area/copy'
import {AreaHead} from './head'
import type {AreaCtx} from './types'

/** "What the … permit record shows": the City's permit mix as bars, our own record and the honest context. */
export function PermitsBlock({ctx}: {ctx: AreaCtx}) {
  const {page, editorial} = ctx
  const permits = page.permits
  const hl = permits?.highlights
  const notes = new Map((page.mixNotes || []).map((item) => [item.label, item.note]))
  const mix = (permits?.mix || []).filter((item) => item.label !== 'Signs').slice(0, 9)
  const max = Math.max(1, ...mix.map((item) => item.count))
  const chicago = isChicago(page)
  // Suburbs run their own permit systems, and most do not publish them as open data.
  const city = cityOf(page)
  const kind = municipalityKind(page)
  const suburbLede = `${city} doesn't publish its building permits as open data, so the permit mix we show for Chicago neighbourhoods isn't available here. This is the record we can show, and where it comes from.`
  const lede = !chicago && !permits ? suburbLede : permits ? `The City of Chicago publishes every building permit. We pulled ${page.areaThe}'s for the ${permits.months} months to ${monthYear(permits.windowTo)}: about ${permits.electricalTotal.toLocaleString('en-US')} permits involved electrical work, and ${permits.contractors} different electrical contractors were named on them.` : undefined

  return (
    <div className="ds-wrap">
      <AreaHead id="permit-record-title" layout="stack" eyebrow={chicago || permits ? 'Permit record · City of Chicago data' : `Permit record · ${city}`} title={chicago || permits ? `What the ${page.area} permit record shows` : `Permits and our record ${page.areaIn}`} lede={lede} editorial={editorial} />
      {!chicago && !permits && <div className="ar-source">
        <p className="ar-source-label"><IconBadge icon="info" tone="blue" size={32} />Data source</p>
        <p>Our Chicago record below is City of Chicago building permit data naming Highlights, shown by block, never by address. {city} permits are kept by the {kind} of {city} and are not published as open data, so any {city} count comes from the {kind}&apos;s own contractor register.</p>
      </div>}
      {permits && <div className="ar-source">
        <p className="ar-source-label"><IconBadge icon="info" tone="blue" size={32} />Data source</p>
        <p>Permits issued {monthYear(permits.windowFrom, true)} to {monthYear(permits.windowTo, true)}, inside {page.bboxText}. A permit can count in more than one row. Grouped by keywords in the City&apos;s work descriptions, so treat the counts as approximate. Source: City of Chicago building permits data.</p>
      </div>}
      {mix.length > 0 && <div className="ar-mix" role="table" aria-label={`${page.area} electrical permit mix`}>
        <div className="ar-mix-head" role="row"><span role="columnheader">Type of work</span><span role="columnheader">Permits</span><span role="columnheader">What it tells you</span></div>
        {mix.map((row) => (
          <div className="ar-mix-row" role="row" key={row.label}>
            <h3 className="ar-mix-label" role="cell">{row.label}</h3>
            <div className="ar-mix-count" role="cell"><b>{row.count.toLocaleString('en-US')}</b><span className="ar-bar ar-bar--wide"><span style={{width: `${Math.round((row.count / max) * 100)}%`}} /></span></div>
            <p role="cell">{notes.get(row.label) || DEFAULT_MIX_NOTES[row.label] || ''}</p>
          </div>
        ))}
      </div>}
      <div className="ar-record">
        <div className="ar-record-own">
          <div className="ar-record-head"><IconBadge icon="fileCheck" tone="green" size={44} /><h3 className="ds-h4">{chicago || permits ? `Our own ${page.area} record` : `Our record in and around ${page.area}`}</h3></div>
          {hl?.count ? <>
            <p className="ar-record-lead">{`${hl.count} permits on ${hl.addresses ?? 0} addresses since ${hl.firstYear || '2012'}: ${andList((hl.byType || []).map((item) => `${item.count} ${permitTypeWords(item.type, item.count)}`))}.`}</p>
            <ul>{(page.recordBullets || []).map((bullet, index) => <li key={index}><Copy value={bullet} show={editorial} as="span" /></li>)}</ul>
          </> : <>
            <Copy value={page.noRecordText || 'We do not yet hold City permits inside this boundary.'} show={editorial} className="ar-record-lead" />
            {Boolean(page.recordBullets?.length) && <ul>{page.recordBullets?.map((bullet, index) => <li key={index}><Copy value={bullet} show={editorial} as="span" /></li>)}</ul>}
          </>}
        </div>
        {Boolean(page.honestContext?.length) && <div className="ar-record-context">
          <div className="ar-record-head"><IconBadge icon="help" tone="blue" size={44} /><h3 className="ds-h4">The honest context</h3></div>
          {page.honestContext?.map((paragraph, index) => <Copy value={paragraph} show={editorial} key={index} />)}
        </div>}
      </div>
      {!permits && chicago && <p className="ar-footnote"><Icon name="info" size={16} />No City permit data has been imported for this area yet.</p>}
    </div>
  )
}
