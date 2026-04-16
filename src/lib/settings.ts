export interface StoreSettings {
  store_name: string
  welcome_title: string
  welcome_subtitle: string
  footer_text: string
}

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Mi Tienda',
  welcome_title: 'Bienvenido a nuestra tienda',
  welcome_subtitle: 'Los mejores productos al mejor precio. ¡Compra fácil por WhatsApp!',
  footer_text: 'Compra segura por WhatsApp Business',
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
