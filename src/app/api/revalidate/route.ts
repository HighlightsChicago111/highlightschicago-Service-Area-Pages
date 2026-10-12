import {revalidatePath} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

type Payload = {path?: string; documentType?: string}

const serviceContentTypes = new Set(['areaPage', 'areaSettings'])

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret || /^PASTE_/i.test(secret)) return NextResponse.json({message: 'Revalidation secret is not configured'}, {status: 503})
  const {isValidSignature, body} = await parseBody<Payload>(request, secret, true)
  if (!isValidSignature) return NextResponse.json({message: 'Invalid signature'}, {status: 401})
  if (body?.path?.startsWith('/')) {
    revalidatePath(body.path)
    return NextResponse.json({revalidated: body.path})
  }
  if (body?.documentType && serviceContentTypes.has(body.documentType)) {
    revalidatePath('/', 'layout')
    return NextResponse.json({revalidated: 'all service area routes', documentType: body.documentType})
  }
  return NextResponse.json({message: 'Unsupported webhook payload'}, {status: 400})
}
