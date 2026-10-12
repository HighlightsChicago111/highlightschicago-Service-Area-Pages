import {randomUUID} from 'node:crypto'
import {NextResponse} from 'next/server'

// district and buildingRules come from the service area page form.
const allowedFields = ['name', 'email', 'phone', 'address', 'district', 'buildingType', 'issue', 'buildingRules', 'service', 'area'] as const
const resendEndpoint = 'https://api.resend.com/emails'

function configured(value: string | undefined) {
  return value && !/^(PASTE_|your_)/i.test(value) ? value.trim() : ''
}

function cleanField(value: unknown) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000)
}

function notificationRecipients(value: string) {
  return value.split(',').map((email) => email.trim()).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).slice(0, 50)
}

/**
 * Best-effort forward of the lead to a CRM/automation webhook (GHL via Zapier,
 * or any Zapier/Make catch hook). This never affects the response sent to the
 * browser: the lead's own email delivery below is still the source of truth
 * that gates success/failure, so a slow or failing webhook can't block or
 * break a real lead. Failures are logged server-side only.
 */
async function forwardToLeadWebhook(clean: Record<string, string>, sourceUrl: string) {
  const webhookUrl = configured(process.env.LEAD_WEBHOOK_URL)
  if (!webhookUrl) return
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({...clean, sourceUrl, submittedAt: new Date().toISOString()}),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) console.error('Lead webhook delivery failed', {status: response.status})
  } catch (error: unknown) {
    console.error('Lead webhook delivery request failed', {error: error instanceof Error ? error.name : 'UnknownError'})
  }
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!payload || payload.website) return NextResponse.json({ok: true})
  const clean = Object.fromEntries(allowedFields.map((field) => [field, cleanField(payload[field])])) as Record<(typeof allowedFields)[number], string>
  if (!clean.name || clean.phone.replace(/\D/g, '').length < 7) return NextResponse.json({message: 'A valid name and phone are required'}, {status: 400})

  await forwardToLeadWebhook(clean, cleanField(request.headers.get('referer')))

  const apiKey = configured(process.env.RESEND_API_KEY)
  const from = configured(process.env.LEAD_FROM_EMAIL)
  const recipients = notificationRecipients(configured(process.env.LEAD_NOTIFICATION_EMAIL))
  if (!apiKey || !from || !recipients.length) return NextResponse.json({message: 'Lead email delivery is not configured'}, {status: 503})

  const subject = `New ${clean.service || 'service'} lead${clean.area ? ` — ${clean.area}` : ''}`.slice(0, 200)
  const text = [
    'New website service request',
    '',
    `Name: ${clean.name}`,
    `Email: ${clean.email || 'Not provided'}`,
    `Phone: ${clean.phone}`,
    `Address: ${clean.address || 'Not provided'}`,
    `Building type: ${clean.buildingType || 'Not provided'}`,
    `Request: ${clean.issue || 'Not provided'}`,
    ...(clean.district ? [`Where in the area: ${clean.district}`] : []),
    ...(clean.buildingRules ? [`Building rules: ${clean.buildingRules}`] : []),
    `Service: ${clean.service || 'Not provided'}`,
    `Area: ${clean.area || 'Not provided'}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n')

  try {
    const response = await fetch(resendEndpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'Idempotency-Key': `lead/${randomUUID()}`,
      },
      body: JSON.stringify({from, to: recipients, subject, text}),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error('Resend lead delivery failed', {status: response.status})
      return NextResponse.json({message: 'Lead email delivery failed'}, {status: 502})
    }
    return NextResponse.json({ok: true})
  } catch (error: unknown) {
    console.error('Resend lead delivery request failed', {error: error instanceof Error ? error.name : 'UnknownError'})
    return NextResponse.json({message: 'Lead email delivery failed'}, {status: 502})
  }
}
