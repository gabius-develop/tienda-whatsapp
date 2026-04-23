/**
 * WhatsApp Business Cloud API wrapper
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WA_API_VERSION = 'v20.0'
const WA_BASE = `https://graph.facebook.com/${WA_API_VERSION}`

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaButton {
  id: string    // max 256 chars, unique per message
  title: string // max 20 chars
}

export interface WaListRow {
  id: string           // max 200 chars
  title: string        // max 24 chars
  description?: string // max 72 chars
}

export interface WaListSection {
  title?: string  // max 24 chars
  rows: WaListRow[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiUrl(phoneNumberId: string) {
  return `${WA_BASE}/${phoneNumberId}/messages`
}

function headers(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

async function post(phoneNumberId: string, accessToken: string, body: object): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(phoneNumberId), {
      method: 'POST',
      headers: headers(accessToken),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[WA Cloud API] Error:', res.status, text)
    }
    return res.ok
  } catch (err) {
    console.error('[WA Cloud API] Fetch error:', err)
    return false
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Envía un mensaje de texto simple */
export function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
): Promise<boolean> {
  return post(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  })
}

/**
 * Envía un mensaje interactivo con hasta 3 botones de respuesta rápida.
 * Los botones permiten al usuario elegir una opción sin escribir.
 */
export function sendButtonMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttons: WaButton[],
  opts?: { headerText?: string; footerText?: string },
): Promise<boolean> {
  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: bodyText },
    action: {
      buttons: buttons.slice(0, 3).map((btn) => ({
        type: 'reply',
        reply: {
          id: btn.id.substring(0, 256),
          title: btn.title.substring(0, 20),
        },
      })),
    },
  }

  if (opts?.headerText) {
    interactive.header = { type: 'text', text: opts.headerText.substring(0, 60) }
  }
  if (opts?.footerText) {
    interactive.footer = { text: opts.footerText.substring(0, 60) }
  }

  return post(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive,
  })
}

/**
 * Envía un mensaje de lista con secciones y hasta 10 opciones en total.
 * Ideal para menús con muchas opciones (categorías, productos, etc.).
 */
export function sendListMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttonText: string,
  sections: WaListSection[],
  opts?: { headerText?: string; footerText?: string },
): Promise<boolean> {
  const interactive: Record<string, unknown> = {
    type: 'list',
    body: { text: bodyText },
    action: {
      button: buttonText.substring(0, 20),
      sections: sections.map((s) => ({
        ...(s.title ? { title: s.title.substring(0, 24) } : {}),
        rows: s.rows.map((r) => ({
          id: r.id.substring(0, 200),
          title: r.title.substring(0, 24),
          ...(r.description ? { description: r.description.substring(0, 72) } : {}),
        })),
      })),
    },
  }

  if (opts?.headerText) {
    interactive.header = { type: 'text', text: opts.headerText.substring(0, 60) }
  }
  if (opts?.footerText) {
    interactive.footer = { text: opts.footerText.substring(0, 60) }
  }

  return post(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive,
  })
}

/** Marca un mensaje como leído (muestra las palomitas azules) */
export function markAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string,
): Promise<boolean> {
  return post(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  })
}
