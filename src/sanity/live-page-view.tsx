'use client'

import {useState} from 'react'
import {BASE_PATH} from '@/lib/urls'

type ViewProps = {document: {published?: {slug?: {current?: string}} | null; displayed?: {slug?: {current?: string}} | null}}

/** "Live page" tab: the published page as visitors see it, reloadable after each publish. */
export function LivePageView({document}: ViewProps) {
  const [version, setVersion] = useState(0)
  const slug = document.published?.slug?.current
  if (!slug) {
    const draftSlug = document.displayed?.slug?.current
    return (
      <div style={{padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5}}>
        <p style={{margin: '0 0 8px', fontWeight: 600}}>Not published yet</p>
        <p style={{margin: 0}}>Press Publish and this tab shows the live page{draftSlug ? ` at ${BASE_PATH}/${draftSlug}` : ''}. To look at the draft before publishing, use the Presentation tab at the top.</p>
      </div>
    )
  }
  const href = `${BASE_PATH}/${slug}`
  const button = {padding: '6px 12px', borderRadius: 6, border: '1px solid #cfcfcf', background: '#fff', cursor: 'pointer', font: '500 13px system-ui, sans-serif', color: '#1d2a36', textDecoration: 'none'}
  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e4e4e4', font: '13px system-ui, sans-serif'}}>
        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{href}</span>
        <button type="button" style={button} onClick={() => setVersion((value) => value + 1)}>Reload</button>
        <a style={button} href={href} target="_blank" rel="noreferrer">Open in a new tab</a>
      </div>
      <iframe key={version} title="Live page" src={href} style={{flex: 1, width: '100%', border: 0}} />
    </div>
  )
}
