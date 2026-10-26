'use client'

import Script from 'next/script'
import {usePathname} from 'next/navigation'

/**
 * Google Tag Manager and Google Analytics 4, the same IDs as the Webflow site. The container
 * holds only the Google Ads tag, so GA4 loads alongside it exactly as Webflow does.
 * The layout renders this only on the production deployment; the Studio is skipped
 * so editors are not counted as visitors.
 */
export const GTM_ID = 'GTM-W2LPM3MG'
export const GA4_ID = 'G-65YRFSCX8J'

export function GoogleTagManager() {
  const pathname = usePathname()
  if (pathname?.startsWith('/studio')) return null
  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <Script id="google-analytics-src" src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`}
      </Script>
    </>
  )
}

/** No-JavaScript fallback; belongs straight after the opening body tag. */
export function GoogleTagManagerNoScript() {
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{display: 'none', visibility: 'hidden'}} />
    </noscript>
  )
}
