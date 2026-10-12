import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {Button, IconBadge} from '@/components/ds/atoms'
import {SiteFooter, SiteHeader} from '@/components/ds/chrome'
import {Icon} from '@/components/ds/icon'
import {getAreaCards, getAreaSettings} from '@/lib/content'
import {pad2, telHref} from '@/lib/ds'

// A confirmation page has no value in search results, and indexing it would let
// stray visits pad the conversion count the team tracks on this URL.
export const metadata: Metadata = {
  title: 'Thank you — request received',
  description: 'Your request was sent to the Highlights Chicago team. A team member will contact you shortly.',
  robots: {index: false, follow: false},
}

const steps = [
  {title: 'We review your request', body: 'The team reads the details you sent so the conversation starts with your project.'},
  {title: 'We contact you', body: 'A team member reaches out to confirm the scope and answer your questions.'},
  {title: 'You get a clear plan', body: 'We walk through your options and provide a free estimate with a written scope.'},
]

export default async function ThankYouPage() {
  const [areas, co] = await Promise.all([getAreaCards(), getAreaSettings()])
  if (!co) notFound()
  const tel = telHref(co.phoneTel, co.phoneDisplay)
  return (
    <div className="ds">
      <SiteHeader co={co} areas={areas} tel={tel} />
      <main id="main" className="ds-band ds-band--grey">
        <div className="ds-wrap ar-thanks">
          <section className="ar-thanks-card" aria-labelledby="thank-you-title">
            <IconBadge icon="check" tone="green" size={64} />
            <p className="ar-kicker ar-kicker--green-ink">Request received</p>
            <h1 className="ds-h2" id="thank-you-title">Thank you. Your request was sent to the team.</h1>
            <p className="ds-lede">A Highlights Chicago team member will contact you shortly to discuss your service request.</p>
            <div className="ds-cta-row">
              <Button href={tel} icon="phone">Need us sooner? Call {co.phoneDisplay}</Button>
              <Link className="ds-btn ds-btn--secondary" href="/"><span>Explore more service areas</span><Icon name="arrowRight" size={18} /></Link>
            </div>
          </section>
          <section className="ar-thanks-steps" aria-labelledby="thank-you-steps-title">
            <h2 className="ds-h5" id="thank-you-steps-title">What happens next</h2>
            <ol>{steps.map((step, index) => <li key={step.title}><span>{pad2(index + 1)}</span><div><h3 className="ar-row-title">{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
          </section>
        </div>
      </main>
      <SiteFooter co={co} tel={tel} />
    </div>
  )
}
