export interface StoreSettings {
  store_name: string
  logo_url: string
  welcome_title: string
  welcome_subtitle: string
  footer_text: string
  whatsapp_phone: string
  whatsapp_contact_phone: string
  feature_live: boolean
  feature_competencia: boolean
  feature_mercadopago: boolean
  primary_color: string
}

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Mi Tienda',
  logo_url: '',
  welcome_title: 'Bienvenido a nuestra tienda',
  welcome_subtitle: 'Los mejores productos al mejor precio. ¡Compra fácil por WhatsApp!',
  footer_text: 'Compra segura por WhatsApp Business',
  whatsapp_phone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '',
  whatsapp_contact_phone: '',
  feature_live: false,
  feature_competencia: false,
  feature_mercadopago: false,
  primary_color: '#16a34a',
}

export async function fetchSettings(): Promise<StoreSettings> {
  try {
    const res = await fetch('/api/settings', { next: { revalidate: 60 } })
    if (!res.ok) return DEFAULT_SETTINGS
    return await res.json()
  } catch {
    return DEFAULT_SETTINGS
  }
}
