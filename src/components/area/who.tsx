import {GoogleG, IconBadge, PhotoFrame, Stars} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {FAMILY_POINTS, HOW_WE_WORK} from '@/lib/area/copy'
import {credentials, pad2, PHOTOS} from '@/lib/ds'
import {AreaHead} from './head'
import type {AreaCtx} from './types'

/** "Who you're actually calling" (navy): photo, four verified credentials, Google rating, family-owned, how we work. */
export function WhoBlock({ctx}: {ctx: AreaCtx}) {
  const {page, co, editorial} = ctx
  return (
    <div className="ds-wrap">
      <AreaHead id="who-title" eyebrow="About Highlights Chicago" title="Who you're actually calling" editorial={editorial}
        lede="A family-owned Chicago electrical contracting company on N Lincoln Ave, run by its founder, with salaried electricians in named crews. Nobody sells your phone number on, and nobody earns a commission on what you're quoted." />
      <div className="ds-cred">
        <PhotoFrame photo={PHOTOS.van} pill={false} className="ds-cred-photo">
          {co.address?.street && <span className="ds-address-chip"><Icon name="mapPin" size={16} />{co.address.street}</span>}
        </PhotoFrame>
        <div className="ds-cred-stats">
          {credentials(co).map((stat) => (
            <div className="ds-stat-tile" key={stat.kind}>
              <p className="ds-stat-tag"><Icon name={stat.icon} size={16} />{stat.tag}</p>
              <p className="ds-stat-value">{stat.value}</p>
              <p className="ds-stat-caption">{stat.caption}</p>
            </div>
          ))}
          <div className="ds-stat-tile ds-stat-tile--google">
            <span className="ds-google-disc"><GoogleG size={36} /></span>
            <p className="ds-google-score"><b>{co.googleRating}</b><span>/5</span></p>
            <div className="ds-google-meta"><Stars size={18} /><p>{co.googleReviews} Google reviews</p></div>
            <p className="ds-stat-tag ds-stat-tag--end"><Icon name="check" size={16} />Google rating</p>
          </div>
        </div>
      </div>
      {co.founderConfirm && editorial && <p className="ar-note-dark"><span className="ds-confirm">[CONFIRM: {co.founderConfirm}]</span></p>}
      <div className="ar-family">
        <div className="ar-family-head"><p className="ar-kicker ar-kicker--green">Family-owned</p><h3 className="ds-h4">Why family-owned matters on a {page.area} job</h3></div>
        <ol className="ar-family-points">{FAMILY_POINTS.map((point, index) => <li key={point}><span>{pad2(index + 1)}</span><p>{point}</p></li>)}</ol>
      </div>
      <div className="ar-rule-title"><h3 className="ds-h4">How we work</h3><span aria-hidden="true" /></div>
      <ul className="ds-promises">
        {HOW_WE_WORK.map((item) => <li key={item.title}><IconBadge icon={item.icon} tone="navy" /><h3 className="ds-h5">{item.title}</h3><p>{item.body}</p></li>)}
      </ul>
    </div>
  )
}
