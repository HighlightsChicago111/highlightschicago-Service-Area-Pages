import {Copy, IconBadge} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {COMPANY_KINDS} from '@/lib/area/copy'
import {pad2} from '@/lib/ds'
import {AreaHead} from './head'
import {Carousel} from './phone'
import type {AreaCtx} from './types'

/** "The kinds of electrical company": five cards, the family-owned one marked as where Highlights fits. */
export function CompaniesBlock({ctx}: {ctx: AreaCtx}) {
  const {page, editorial} = ctx
  return (
    <div className="ds-wrap">
      <AreaHead id="companies-title" eyebrow={`${COMPANY_KINDS.length} kinds of electrical company`} title={`The kinds of electrical company ${page.areaIn}, and when each one fits`} editorial={editorial}
        lede="Service businesses can't be compared on features. They differ in how they're run, and that decides who answers the phone and how the price is set." />
      <Carousel className="ar-kinds" headClassName="ar-carousel-top" label="Kinds of electrical company" head={<span className="ar-swipe">Swipe to compare</span>}>
        {COMPANY_KINDS.map((kind, index) => (
          <li className={kind.us ? 'ar-kind is-us' : 'ar-kind'} key={kind.title}>
            {kind.us ? <span className="ar-us-pill"><Icon name="check" size={12} />Where Highlights fits</span> : <span className="ar-kind-num">{pad2(index + 1)}</span>}
            <h3 className="ar-kind-title">{kind.title}</h3>
            <dl>
              <div><dt>Who you talk to</dt><dd>{kind.who}</dd></div>
              <div><dt>How the price is set</dt><dd>{kind.price}</dd></div>
              <div><dt>Fits best when</dt><dd>{kind.fits}</dd></div>
            </dl>
          </li>
        ))}
      </Carousel>
      {page.whereWeFit && <div className="ar-fit">
        <IconBadge icon="shieldCheck" tone="white" size={44} />
        <div><p className="ar-kicker ar-kicker--green-ink">Where we fit, honestly</p><Copy value={page.whereWeFit} show={editorial} /></div>
      </div>}
    </div>
  )
}
