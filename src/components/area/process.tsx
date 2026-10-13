import {Copy, IconBadge} from '@/components/ds/atoms'
import {PROCESS_STEPS} from '@/lib/area/copy'
import {pad2} from '@/lib/ds'
import {AreaHead} from './head'
import {ProcessTrack} from './process-track'
import type {AreaCtx} from './types'

/** "What happens when you call": the six steps on the service pages' swipe track. */
export function ProcessBlock({ctx}: {ctx: AreaCtx}) {
  return (
    <>
      <div className="ds-wrap">
        <AreaHead id="process-title" eyebrow={`The process · ${PROCESS_STEPS.length} steps`} title="What happens when you call" editorial={ctx.editorial}
          lede="From the first call to the closed permit, drawn from what reviewers describe." />
      </div>
      <ProcessTrack titles={PROCESS_STEPS.map((step) => step.title)}>
        {PROCESS_STEPS.map((step, index) => (
          <li className="ds-step" key={step.title}>
            <div className="ds-step-top"><span className="ds-step-num">{pad2(index + 1)}</span><IconBadge icon={step.icon} tone="blue" /></div>
            <h3 className="ds-h5">{step.title}</h3>
            <Copy value={step.body} show={ctx.editorial} />
          </li>
        ))}
      </ProcessTrack>
      <div className="ds-wrap">
        <p className="ds-track-hint"><IconBadge icon="pointer" tone="white" size={32} />Swipe or use the arrows to see all {PROCESS_STEPS.length} steps</p>
      </div>
    </>
  )
}
