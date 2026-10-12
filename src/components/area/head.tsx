import type {ReactNode} from 'react'
import {Copy, Eyebrow, keepHyphens} from '@/components/ds/atoms'

/** Section head: eyebrow and H2, with the lede beside it (`side`, default) or under it (`stack`). */
export function AreaHead({eyebrow, title, lede, editorial, id, layout = 'side'}: {eyebrow: ReactNode; title: ReactNode; lede?: string; editorial: boolean; id: string; layout?: 'side' | 'stack'}) {
  return (
    <div className={`ar-head ar-head--${layout}`}>
      <div className="ar-head-main">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="ds-h2" id={id}>{keepHyphens(title)}</h2>
        {layout === 'stack' && <Copy value={lede} show={editorial} className="ds-lede" />}
      </div>
      {layout === 'side' && <Copy value={lede} show={editorial} className="ds-lede ar-head-lede" />}
    </div>
  )
}
