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
  opts?: { headerText?: string; headerImageUrl?: string; footerText?: string },
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

  if (opts?.headerImageUrl) {
    interactive.header = { type: 'image', image: { link: opts.headerImageUrl } }
  } else if (opts?.headerText) {
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

/**
 * Envía una imagen con caption opcional.
 * La URL de la imagen debe ser públicamente accesible.
 */
export function sendImageMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  imageUrl: string,
  caption?: string,
): Promise<boolean> {
  return post(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      ...(caption ? { caption } : {}),
    },
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

/**
 * Envía un mensaje de plantilla (template) aprobada por Meta.
 * bodyParams: valores de texto para los variables {{1}}, {{2}}, … del cuerpo.
 * headerParams: valores de texto para los variables del encabezado (opcional).
 */
export function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[] = [],
  headerParams: string[] = [],
): Promise<boolean> {
  const components: object[] = []

  if (headerParams.length > 0) {
    components.push({
      type: 'header',
      parameters: headerParams.map((text) => ({ type: 'text', text })),
    })
  }

  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((text) => ({ type: 'text', text })),
    })
  }

  return post(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 ? { components } : {}),
    },
  })
}

/**
 * Obtiene las plantillas aprobadas desde la API de Meta.
 * Requiere el WABA ID (WhatsApp Business Account ID) y el access token.
 */
export async function fetchMetaTemplates(
  wabaId: string,
  accessToken: string,
): Promise<MetaTemplate[]> {
  try {
    const url = `https://graph.facebook.com/${WA_API_VERSION}/${wabaId}/message_templates?fields=name,status,language,category,components&limit=50`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[WA Cloud API] fetchMetaTemplates error:', res.status, text)
      return []
    }
    const json = await res.json() as { data?: MetaTemplate[] }
    return (json.data ?? []).filter((t) => t.status === 'APPROVED')
  } catch (err) {
    console.error('[WA Cloud API] fetchMetaTemplates fetch error:', err)
    return []
  }
}

export interface MetaTemplate {
  name:       string
  status:     string
  language:   string
  category:   string
  components: MetaTemplateComponent[]
}

export interface MetaTemplateComponent {
  type:    string
  format?: string
  text?:   string
  buttons?: Array<{ type: string; text: string }>
  example?: { body_text?: string[][]; header_text?: string[] }
}
