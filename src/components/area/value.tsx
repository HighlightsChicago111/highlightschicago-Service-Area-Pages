import {GoogleG} from '@/components/ds/atoms'
import {Icon} from '@/components/ds/icon'
import {initial} from '@/lib/ds'
import {AreaHead} from './head'
import {Carousel} from './phone'
import {ReviewText} from './review-text'
import type {AreaCtx} from './types'

/** "What clients say about value": four review-theme counts with bars, then the tagged reviews. */
export function ValueBlock({ctx}: {ctx: AreaCtx}) {
  const {page, co, editorial} = ctx
  const stats = co.reviewStats
  const total = stats?.total || 0
  const pct = (value: number) => (total ? Math.round((value * 100) / total) : 0)
  const tiles: Array<[number, string]> = stats ? [
    [stats.owner, 'name the owner, or say they dealt with him directly'],
    [stats.punctual, 'mention punctuality'],
    [stats.fairPrice, 'call the price fair, reasonable or competitive'],
    [stats.clean, 'mention cleanliness or protecting furniture and floors'],
  ] : []

  return (
    <div className="ds-wrap">
      <AreaHead id="value-title" eyebrow={`Google reviews · ${total} read`} title="What clients say about value" editorial={editorial}
        lede={`We don't publish prices, because they depend on the scope. Here is what ${total} of our ${co.googleReviews} Google reviews say instead, counted by what reviewers chose to mention.`} />
      {tiles.length > 0 && <>
        <ul className="ar-stats">
          {tiles.map(([value, label]) => (
            <li key={label}>
              <b>{value}</b>
              <p>{label}</p>
              <span className="ar-stat-bar"><span className="ar-bar"><span style={{width: `${pct(value)}%`}} /></span><em>{pct(value)}%</em></span>
            </li>
          ))}
        </ul>
        <p className="ar-footnote"><Icon name="info" size={16} />Counted by keyword matching across the {total} reviews Google returns for Highlights (of {co.googleReviews}), so the numbers are approximate. {stats?.fiveStar ?? 0} of those {total} reviews are five stars.</p>
      </>}
      {Boolean(page.reviews?.length) && <div className="ar-reviews" id="reviews">
        <Carousel className="ar-review-grid" headClassName="ar-reviews-head" label="Google reviews"
          head={<><h3 className="ds-h5">{page.reviewsHeading || 'Reviews from jobs like yours'}</h3><p><GoogleG size={24} /><b>{co.googleRating}</b><span>· {co.googleReviews} Google reviews</span></p></>}>
          {(page.reviews || []).map((review, index) => (
            <li className="ar-review" key={review._key || index}>
              <div className="ar-review-top">
                <span className="ar-avatar" aria-hidden="true">{initial(review.reviewer)}</span>
                <div><p className="ar-review-name">{review.reviewer}</p><p className="ar-review-meta">Google review{review.year ? `, ${review.year}` : ''}</p></div>
                <GoogleG size={18} />
              </div>
              <p className="ar-review-stars" aria-label="5 out of 5 stars">★★★★★</p>
              <ReviewText text={review.text} />
              {review.label && <p className="ar-review-foot"><span className="ar-tag-green">{review.label}</span></p>}
            </li>
          ))}
        </Carousel>
      </div>}
    </div>
  )
}
