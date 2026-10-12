import {Copy, IconBadge} from '@/components/ds/atoms'
import {PROCESS_STEPS} from '@/lib/area/copy'
import {pad2} from '@/lib/ds'
import {AreaHead} from './head'
import type {AreaCtx} from './types'

/** "What happens when you call": six numbered step cards. */
export function ProcessBlock({ctx}: {ctx: AreaCtx}) {
  return (
    <div className="ds-wrap">
      <AreaHead id="process-title" eyebrow={`The process · ${PROCESS_STEPS.length} steps`} title="What happens when you call" editorial={ctx.editorial}
        lede="From the first call to the closed permit, drawn from what reviewers describe." />
      <ol className="ar-steps">
        {PROCESS_STEPS.map((step, index) => (
          <li key={step.title}>
            <div className="ar-step-top"><span className="ar-step-num">{pad2(index + 1)}</span><IconBadge icon={step.icon} tone="blue" /></div>
            <h3 className="ar-card-title">{step.title}</h3>
            <Copy value={step.body} show={ctx.editorial} />
          </li>
        ))}
      </ol>
    </div>
  )
}
