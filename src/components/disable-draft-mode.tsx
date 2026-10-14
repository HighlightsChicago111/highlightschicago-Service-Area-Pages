'use client'

import {useSyncExternalStore} from 'react'
import {useIsPresentationTool} from 'next-sanity/hooks'

const noSubscribe = () => () => {}

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()
  // Inside a Studio tab (Presentation or the "Preview (draft)" pane) the Studio owns draft mode.
  const framed = useSyncExternalStore(noSubscribe, () => window.self !== window.top, () => false)
  if (isPresentationTool || framed) return null
  // Real anchor: this GETs an endpoint that clears the draft cookie and redirects; a client-side <Link> would not.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <a className="disable-draft" href="/service-areas/api/draft-mode/disable">Disable draft mode</a>
}
