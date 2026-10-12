import type {Metadata} from 'next'
import localFont from 'next/font/local'
import {siteUrl} from '@/sanity/env'
import './globals.css'
import './design-system-v3.css'
import './area-ds.css'

// Design System v3: two families only, self-hosted (src/app/fonts) so builds never depend on Google Fonts.
// Inter keeps its optical-size axis so `opsz` can be pinned.
const inter = localFont({src: './fonts/inter-latin-variable.woff2', weight: '100 900', variable: '--font-inter', display: 'swap', fallback: ['system-ui', 'sans-serif']})
const spaceGrotesk = localFont({src: './fonts/space-grotesk-latin-variable.woff2', weight: '300 700', variable: '--font-space-grotesk', display: 'swap', fallback: ['system-ui', 'sans-serif']})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {default: 'Highlights Chicago Service Areas', template: '%s | Highlights Chicago'},
  description: 'Licensed electrical services across Chicago.',
  icons: {
    icon: [
      {url: '/service-areas/icons/highlights-chicago-32.png', type: 'image/png', sizes: '32x32', media: '(prefers-color-scheme: light)'},
      {url: '/service-areas/icons/highlights-chicago-32.png', type: 'image/png', sizes: '32x32', media: '(prefers-color-scheme: dark)'},
      {url: '/service-areas/icons/highlights-chicago-48.png', type: 'image/png', sizes: '48x48'},
      {url: '/service-areas/icons/highlights-chicago-192.png', type: 'image/png', sizes: '192x192'},
      {url: '/service-areas/icons/highlights-chicago-512.png', type: 'image/png', sizes: '512x512'},
    ],
    apple: [{url: '/service-areas/icons/highlights-chicago-180.png', type: 'image/png', sizes: '180x180'}],
  },
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  )
}
