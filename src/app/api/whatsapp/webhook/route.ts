import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { handleIncomingMessage, saveMessage, IncomingMessage } from '@/lib/whatsapp-bot'

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/whatsapp/webhook
 * Verificación del webhook por Meta.
 * Meta enviará: hub.mode=subscribe, hub.verify_token, hub.challenge
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('[WA webhook GET] url:', request.url)
  console.log('[WA webhook GET] mode:', mode, '| token:', token, '| challenge:', challenge)

  if (mode !== 'subscribe' || !token || !challenge) {
    console.log('[WA webhook GET] Bad Request - falta algún parámetro')
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Buscar un bot activo con ese verify_token
  const db = srvClient()
  const { data } = await db
    .from('whatsapp_bot_config')
    .select('id')
    .eq('verify_token', token)
    .eq('is_active', true)
    .single()

  if (!data) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Responder con el challenge para confirmar el webhook
  return new NextResponse(challenge, { status: 200 })
}

/**
 * POST /api/whatsapp/webhook
 * Recibe notificaciones de mensajes entrantes de Meta.
 * Siempre debe responder 200 rápidamente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Solo procesar eventos de WhatsApp Business
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ok' })
    }

    const entries: unknown[] = body.entry ?? []

    for (const entry of entries) {
      const e = entry as Record<string, unknown>
      const changes: unknown[] = (e.changes as unknown[]) ?? []

      for (const change of changes) {
        const c = change as Record<string, unknown>
        if (c.field !== 'messages') continue

        const value = c.value as Record<string, unknown>
        const phoneNumberId = (value.metadata as Record<string, string>)?.phone_number_id
        const messages: unknown[] = (value.messages as unknown[]) ?? []

        console.log('[WA webhook] phone_number_id recibido:', phoneNumberId)
        console.log('[WA webhook] mensajes:', messages.length)

        for (const raw of messages) {
          const m = raw as Record<string, unknown>

          console.log('[WA webhook] mensaje tipo:', m.type, '| de:', m.from)

          const incoming: IncomingMessage = {
            messageId: m.id as string,
            from: m.from as string,
            type: 'other',
          }

          if (m.type === 'text') {
            incoming.type = 'text'
            incoming.text = (m.text as Record<string, string>)?.body
          } else if (m.type === 'interactive') {
            incoming.type = 'interactive'
            const interactive = m.interactive as Record<string, unknown>

            if (interactive?.type === 'button_reply') {
              const br = interactive.button_reply as Record<string, string>
              incoming.interactiveId    = br?.id
              incoming.interactiveTitle = br?.title
            } else if (interactive?.type === 'list_reply') {
              const lr = interactive.list_reply as Record<string, string>
              incoming.interactiveId    = lr?.id
              incoming.interactiveTitle = lr?.title
            }
          }

          // Guardar mensaje entrante en historial
          if (incoming.type === 'text' && incoming.text) {
            const db = srvClient()
            const { data: cfg } = await db
              .from('whatsapp_bot_config')
              .select('tenant_id')
              .eq('phone_number_id', phoneNumberId)
              .eq('is_active', true)
              .single()
            if (cfg?.tenant_id) {
              await saveMessage(db, cfg.tenant_id, incoming.from, 'inbound', incoming.text, incoming.messageId)
            }
          }

          // Procesar el mensaje (await para completar antes de responder a Meta)
          await handleIncomingMessage(phoneNumberId, incoming)
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp webhook] Error:', err)
  }

  // Siempre responder 200 a Meta para evitar reintentos
  return NextResponse.json({ status: 'ok' })
}
