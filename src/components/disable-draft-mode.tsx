'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()
  if (isPresentationTool) return null
  // Real anchor: this GETs an endpoint that clears the draft cookie and redirects; a client-side <Link> would not.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <a className="disable-draft" href="/service-areas/api/draft-mode/disable">Disable draft mode</a>
}
