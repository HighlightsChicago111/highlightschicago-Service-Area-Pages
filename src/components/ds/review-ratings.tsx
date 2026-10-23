/** Google and Yelp ratings for a page hero, each a link to the reviews on that site. */

/** Opens the Google reviews panel for Highlights Chicago Inc (Google Business Profile, CID 0xae9382f0c0f6b3b). */
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=Highlights+Chicago+Inc&ludocid=786221384669817659#lrd=0x0:0xae9382f0c0f6b3b,1,,,'
export const YELP_URL = 'https://www.yelp.com/biz/highlights-chicago-chicago-2'
/** Yelp's average for Highlights Chicago, read from the Yelp page on 2026-10-23 (4.9 from 306 reviews). */
export const YELP_RATING = 4.9

function GoogleMark() {
  return (
    <svg className="hc-rating-mark" width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.6h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.2z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8 41.3 15.4 46 24 46z" />
      <path fill="#FBBC04" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.6z" />
      <path fill="#EA4335" d="M24 10.3c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C35 3.8 30 1.8 24 1.8 15.4 1.8 8 6.5 4.5 13.9l7.3 5.7c1.7-5.2 6.5-9.3 12.2-9.3z" />
    </svg>
  )
}

/** Yelp's red burst: five rounded petals around a centre. */
function YelpMark() {
  return (
    <svg className="hc-rating-mark" width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
      <g fill="#E00707">
        {[0, 72, 144, 216, 288].map((angle) => <rect key={angle} x="20" y="2" width="8.5" height="18" rx="4.25" transform={`rotate(${angle} 24 24)`} />)}
      </g>
    </svg>
  )
}

const STAR = 'M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z'

function GoogleStars() {
  return <span className="hc-stars-google" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <svg key={i} width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d={STAR} /></svg>)}</span>
}

function YelpStars() {
  return <span className="hc-stars-yelp" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span key={i}><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d={STAR} /></svg></span>)}</span>
}

/** "G 4.9 ★★★★★ 507 Google reviews | Yelp 4.9 ★★★★★". `tone` matches the hero: light text on a dark photo, or dark text on a pale band. */
export function ReviewRatings({googleRating, googleCount, tone = 'dark', className}: {googleRating?: number | string; googleCount?: number | string; tone?: 'dark' | 'light'; className?: string}) {
  return (
    <div className={`hc-ratings hc-ratings--${tone}${className ? ` ${className}` : ''}`}>
      {googleRating ? (
        <a className="hc-rating" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" aria-label={`Rated ${googleRating} out of 5${googleCount ? ` from ${googleCount} Google reviews` : ' on Google'}. Read the reviews on Google`}>
          <GoogleMark />
          <b className="hc-rating-num hc-rating-num--google">{googleRating}</b>
          <GoogleStars />
          {googleCount ? <span className="hc-rating-count">{googleCount} Google reviews</span> : null}
        </a>
      ) : null}
      {googleRating ? <span className="hc-rating-sep" aria-hidden="true" /> : null}
      <a className="hc-rating" href={YELP_URL} target="_blank" rel="noopener noreferrer" aria-label={`Rated ${YELP_RATING} out of 5 on Yelp. Read the reviews on Yelp`}>
        <YelpMark />
        <b className="hc-rating-num">{YELP_RATING}</b>
        <YelpStars />
      </a>
    </div>
  )
}
