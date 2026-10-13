import {Copy, IconBadge} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {PRICING_POINTS} from '@/lib/area/copy'
import {pad2} from '@/lib/ds'
import {AreaHead} from './head'
import {Carousel} from './phone'
import type {AreaCtx} from './types'

const DEFAULT_LEDE = 'The same job on paper can cost very differently from one building to the next. These are the things that change it, and most are settled at the walkthrough.'
const DEFAULT_HOURLY = 'We quote by scope, not by the hour, because the hours on a job depend on the factors below. The written quote tells you the whole price before you agree to it.'

/** Who settles a factor sets the chip colour: us green, shared grey, the building or board blue. */
const whoTone = (who?: string) => (/^us\b/i.test(who || '') ? 'us' : /^you and us\b/i.test(who || '') ? 'shared' : 'them')

/** "What changes the scope and price": how we price, the hourly-rate answer, then the numbered factor cards in one horizontal row. */
export function ScopeBlock({ctx}: {ctx: AreaCtx}) {
  const {page, editorial} = ctx
  const rows = page.scopeRows || []
  return (
    <div className="ds-wrap">
      <AreaHead id="scope-title" layout="stack" eyebrow={`Scope & price · ${rows.length} factors`} title={`What changes the scope and price of electrical work in a ${page.area} building`} lede={page.scopeLede || DEFAULT_LEDE} editorial={editorial} />
      <div className="ar-scope">
        <div className="ar-scope-rail">
          <div className="ar-price-card">
            <div className="ar-price-head">
              <IconBadge icon="tag" tone="green" size={44} />
              <h3 className="ds-h5">How we price</h3>
            </div>
            <ul>{PRICING_POINTS.map((point) => <li key={point}><Icon name="check" size={18} />{point}</li>)}</ul>
          </div>
          <div className="ar-rule-card">
            <h3 className="ar-card-title">{"“What's your hourly rate?”"}</h3>
            <Copy value={page.hourlyAnswer || DEFAULT_HOURLY} show={editorial} />
          </div>
        </div>
        {rows.length > 0 && <div className="ar-factors">
          <Carousel rail ordered className="ar-factor-list" headClassName="ar-factors-head" label="Scope and price factors"
            head={<h3 className="ds-h5">Factor · why it changes the work</h3>}>
            {rows.map((row, index) => (
              <li className="ar-factor" key={row._key || index}>
                <span className="ar-factor-num">{pad2(index + 1)}</span>
                <h4 className="ar-row-title">{row.factor}</h4>
                <Copy value={row.why} show={editorial} />
                {row.who && <div className="ar-factor-foot"><p className="ar-mini-label">Who settles it</p><span className={`ar-who-chip ar-who-chip--${whoTone(row.who)}`}>{row.who}</span></div>}
              </li>
            ))}
          </Carousel>
        </div>}
      </div>
    </div>
  )
}
