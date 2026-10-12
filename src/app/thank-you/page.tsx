import type {Metadata} from 'next'
import Link from 'next/link'
import {CollectionFooter, CollectionHeader} from '@/components/collection-chrome'

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

export default function ThankYouPage() {
  return (
    <div className="collection-page">
      <CollectionHeader />
      <main className="thank-you">
        <section className="thank-you-card" aria-labelledby="thank-you-title">
          <div className="thank-you-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m6.8 12.3 3.3 3.3 7.1-7.2" /></svg>
          </div>
          <p className="thank-you-kicker">Request received</p>
          <h1 id="thank-you-title">Thank you. Your request was sent to the team.</h1>
          <p className="thank-you-lede">A Highlights Chicago team member will contact you shortly to discuss your service request.</p>
          <div className="thank-you-actions">
            <a href="tel:773-262-3333">Need us sooner? Call <span className="thank-you-nowrap">773-262-3333</span></a>
            <Link href="/">Explore more service areas</Link>
          </div>
        </section>
        <section className="thank-you-steps" aria-labelledby="thank-you-steps-title">
          <h2 id="thank-you-steps-title">What happens next</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <CollectionFooter />
    </div>
  )
}
