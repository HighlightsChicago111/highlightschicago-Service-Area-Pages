import {draftMode} from 'next/headers'
import {NextResponse} from 'next/server'
import {siteUrl} from '@/sanity/env'

export async function GET() {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/service-areas', siteUrl))
}
