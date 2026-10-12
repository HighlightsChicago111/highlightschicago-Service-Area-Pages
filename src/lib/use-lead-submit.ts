'use client'

import {FormEvent, useEffect, useState} from 'react'
import {BASE_PATH, THANK_YOU_PATH} from './urls'

// fetch() is not rewritten by basePath, so the API path is prefixed manually.
export const LEAD_ENDPOINT = `${BASE_PATH}/api/lead`

type LeadStatus = 'idle' | 'sending' | 'error'

/**
 * Shared submit behaviour for every lead form: post to /api/lead, then send the
 * visitor to the thank-you page.
 */
export function useLeadSubmit() {
  const [status, setStatus] = useState<LeadStatus>('idle')

  // After a successful submit the button stays disabled while the browser
  // navigates. If the visitor comes back with Back, the browser may restore
  // this page from its cache with that state frozen, so release the button.
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) setStatus('idle')
    }
    window.addEventListener('pageshow', restore)
    return () => window.removeEventListener('pageshow', restore)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(Object.fromEntries(form.entries())),
      })
      if (!response.ok) {
        setStatus('error')
        return
      }
      // A full page load (not client-side routing) so page-view based
      // conversion tracking on the thank-you URL always fires.
      window.location.assign(THANK_YOU_PATH)
    } catch {
      setStatus('error')
    }
  }

  return {status, submit}
}
