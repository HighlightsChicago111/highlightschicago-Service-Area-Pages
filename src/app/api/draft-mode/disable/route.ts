import {draftMode} from 'next/headers'
import {NextResponse, type NextRequest} from 'next/server'
import {siteUrl} from '@/sanity/env'
import {BASE_PATH} from '@/lib/urls'

/** Clears draft mode, then goes to `?redirect=` when it is a path on this site (the Studio's Live page tab), else the collection page. */
export async function GET(request: NextRequest) {
  ;(await draftMode()).disable()
  const to = request.nextUrl.searchParams.get('redirect') || ''
  const safe = to.startsWith(`${BASE_PATH}/`) && !to.includes('//') && !to.includes('\\') ? to : BASE_PATH
  return NextResponse.redirect(new URL(safe, siteUrl))
}
