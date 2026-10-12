import {Button, ConfirmNotes, Eyebrow, GoogleG, IconBadge, PhotoFrame, Stars} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {PHOTOS, splitConfirm} from '@/lib/ds'
import type {AreaCtx} from './types'

/** FAQ split: sticky left rail (photo, call, proof), numbered accordion with the first answer open. */
export function FaqBlock({ctx}: {ctx: AreaCtx}) {
  const {page, co, faqs, editorial, tel} = ctx
  return (
    <div className="ds-wrap ds-faq">
      <aside className="ds-faq-rail">
        <Eyebrow>FAQs · {faqs.length} questions</Eyebrow>
        <h2 className="ds-h2 ar-faq-title" id="faq-title">Electricians {page.areaIn}: questions</h2>
        <PhotoFrame photo={PHOTOS.techTesting} pill={false} className="ds-faq-photo">
          <div className="ds-faq-photo-body"><p className="ds-h5">{"Didn't find your question?"}</p><Button href={tel} tone="light" icon="phone" size="m">Call {co.phoneDisplay}</Button></div>
        </PhotoFrame>
        <div className="ds-proof-card">
          <div className="ds-proof-row"><span className="ds-google-disc ds-google-disc--line"><GoogleG size={24} /></span><div><p className="ds-proof-num"><b>{co.googleRating}</b><Stars size={14} /></p><p className="ds-proof-cap">{co.googleReviews} Google reviews</p></div></div>
          <div className="ds-proof-row"><IconBadge icon="shieldCheck" tone="green" /><div><p className="ds-proof-num"><b>{co.licence}</b></p><p className="ds-proof-cap">City of Chicago Electrical Contractor</p></div></div>
        </div>
      </aside>
      <div className="ds-faq-list">
        {faqs.map((faq, index) => {
          const answer = splitConfirm(faq.answer)
          const question = splitConfirm(faq.question)
          return (
            <details className="ds-faq-item" open={index === 0} key={faq.key}>
              <summary>
                <span className="ds-faq-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="ds-faq-q">{question.text}</span>
                <span className="ds-faq-toggle" aria-hidden="true"><Icon name="plus" size={16} className="ds-faq-plus" /><Icon name="minus" size={16} className="ds-faq-minus" /></span>
              </summary>
              <div className="ds-faq-a">{answer.text && <p>{answer.text}</p>}<ConfirmNotes notes={[...question.notes, ...answer.notes]} show={editorial} /></div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
