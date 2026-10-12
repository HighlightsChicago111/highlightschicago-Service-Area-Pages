import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import {siteUrl} from '@/sanity/env'
import './globals.css'
import './area-page.css'

const inter = Inter({subsets: ['latin'], variable: '--font-inter', display: 'swap'})

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
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  )
}
