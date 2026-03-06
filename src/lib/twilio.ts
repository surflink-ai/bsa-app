// Twilio WhatsApp integration for BSA blasts

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || ''

const TWILIO_API = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`

interface SendResult {
  success: boolean
  sid?: string
  error?: string
}

export async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  // Ensure E.164 format
  const toNum = to.startsWith('+') ? to : `+${to}`
  
  try {
    const params = new URLSearchParams({
      From: TWILIO_FROM,
      To: `whatsapp:${toNum}`,
      Body: body,
    })

    const res = await fetch(TWILIO_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json()

    if (res.ok) {
      return { success: true, sid: data.sid }
    } else {
      return { success: false, error: data.message || `HTTP ${res.status}` }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function sendWhatsAppBulk(
  recipients: { phone: string; body: string }[],
  onProgress?: (sent: number, total: number) => void
): Promise<{ sent: number; failed: number; results: { phone: string; success: boolean; sid?: string; error?: string }[] }> {
  let sent = 0, failed = 0
  const results: { phone: string; success: boolean; sid?: string; error?: string }[] = []

  // Send sequentially to respect rate limits (1 msg/sec for WhatsApp)
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i]
    const result = await sendWhatsApp(r.phone, r.body)
    
    if (result.success) {
      sent++
    } else {
      failed++
    }
    
    results.push({ phone: r.phone, ...result })
    onProgress?.(i + 1, recipients.length)

    // Rate limit: ~1 per second
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
  }

  return { sent, failed, results }
}

// Interpolate template variables
export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`)
}
