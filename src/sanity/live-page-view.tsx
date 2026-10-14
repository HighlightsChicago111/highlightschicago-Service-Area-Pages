'use client'

import {createPreviewSecret} from '@sanity/preview-url-secret/create-secret'
import {urlSearchParamPreviewPathname, urlSearchParamPreviewSecret} from '@sanity/preview-url-secret/constants'
import {useEffect, useState, type CSSProperties, type ReactNode} from 'react'
import {useClient, useCurrentUser} from 'sanity'
import {BASE_PATH} from '@/lib/urls'

type ViewProps = {document: {published?: {slug?: {current?: string}} | null; displayed?: {slug?: {current?: string}} | null}}

const button: CSSProperties = {padding: '6px 12px', borderRadius: 6, border: '1px solid #cfcfcf', background: '#fff', cursor: 'pointer', font: '500 13px system-ui, sans-serif', color: '#1d2a36', textDecoration: 'none'}

function Notice({title, children}: {title: string; children: ReactNode}) {
  return (
    <div style={{padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5}}>
      <p style={{margin: '0 0 8px', fontWeight: 600}}>{title}</p>
      <p style={{margin: 0}}>{children}</p>
    </div>
  )
}

/** A page in an iframe under a toolbar with its address, Reload and Open in a new tab. */
function PageFrame({title, label, src, openHref, onReload}: {title: string; label: string; src: string; openHref: string; onReload: () => void}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #e4e4e4', font: '13px system-ui, sans-serif'}}>
        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{label}</span>
        <button type="button" style={button} onClick={onReload}>Reload</button>
        <a style={button} href={openHref} target="_blank" rel="noreferrer">Open in a new tab</a>
      </div>
      <iframe title={title} src={src} style={{flex: 1, width: '100%', border: 0}} />
    </div>
  )
}

/**
 * "Live page" tab: the published page as visitors see it, reloadable after each publish.
 * It loads through the draft-mode exit so a draft preview opened earlier can't leak into it.
 */
export function LivePageView({document}: ViewProps) {
  const [version, setVersion] = useState(0)
  const slug = document.published?.slug?.current
  if (!slug) {
    const draftSlug = document.displayed?.slug?.current
    return <Notice title="Not published yet">Press Publish and this tab shows the live page{draftSlug ? ` at ${BASE_PATH}/${draftSlug}` : ''}. To look at the draft now, open the Preview (draft) tab.</Notice>
  }
  const href = `${BASE_PATH}/${slug}`
  const src = `${BASE_PATH}/api/draft-mode/disable?${new URLSearchParams({redirect: href, v: String(version)})}`
  return <PageFrame key={version} title="Live page" label={`${href} · published`} src={src} openHref={href} onReload={() => setVersion((value) => value + 1)} />
}

/**
 * "Preview (draft)" tab: the page with its unsaved-to-live draft, rendered by the site in Next draft mode.
 * Same handshake as the Presentation tool: the Studio user creates a short-lived preview secret
 * (a sanity.previewUrlSecret document, valid one hour) and the site's enable route checks it.
 */
export function DraftPreviewView({document}: ViewProps) {
  const client = useClient({apiVersion: '2025-02-19'})
  const user = useCurrentUser()
  const slug = document.displayed?.slug?.current
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<{key: string; src?: string; error?: string}>()
  const key = `${slug}:${version}`

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    // Studio and this package resolve different @sanity/client versions; the calls it makes exist on both.
    createPreviewSecret(client as unknown as Parameters<typeof createPreviewSecret>[0], 'service-areas-preview-tab', window.location.href, user?.id)
      .then(({secret}) => {
        const params = new URLSearchParams({[urlSearchParamPreviewSecret]: secret, [urlSearchParamPreviewPathname]: `${BASE_PATH}/${slug}`})
        if (!cancelled) setResult({key, src: `${BASE_PATH}/api/draft-mode/enable?${params}`})
      })
      .catch((error: unknown) => { if (!cancelled) setResult({key, error: error instanceof Error ? error.message : String(error)}) })
    return () => { cancelled = true }
  }, [client, user?.id, slug, key])

  if (!slug) return <Notice title="No slug yet">Fill in the slug and this tab shows the draft page.</Notice>
  if (result?.key === key && result.error) return <Notice title="Preview could not start">{result.error}. Check that you are signed in with an Editor role.</Notice>
  if (result?.key !== key || !result.src) return <Notice title="Opening the draft preview…">Creating a one-hour preview link.</Notice>
  return <PageFrame key={key} title="Draft preview" label={`${BASE_PATH}/${slug} · draft`} src={result.src} openHref={result.src} onReload={() => setVersion((value) => value + 1)} />
}
