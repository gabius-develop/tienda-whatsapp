/**
 * Inyecta clases CSS usando el color primario del tenant.
 * Clases disponibles para los componentes de la tienda:
 *   .sp-btn    → botón primario (fondo + hover/active)
 *   .sp-bg     → fondo primario (sin estados interactivos)
 *   .sp-text   → color de texto primario
 *   .sp-badge  → badge/pastilla pequeña
 *   .sp-border → borde con color primario
 *   .sp-bg-soft→ fondo primario suave (10% opacidad)
 *   .sp-ring   → ring/outline con color primario
 *   .sp-gradient → gradiente con color primario
 */
export function StoreColorStyle({ color }: { color: string }) {
  const c = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#16a34a'
  // Calcular variante oscura para gradientes
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  const dark = `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`
  return (
    <style>{`
      .sp-btn  { background-color:${c};color:#fff;transition:filter .15s,transform .15s; }
      .sp-btn:hover  { filter:brightness(.88); }
      .sp-btn:active { filter:brightness(.78);transform:scale(.95); }
      .sp-bg   { background-color:${c}; }
      .sp-text { color:${c}; }
      .sp-badge{ background-color:${c};color:#fff; }
      .sp-cnt  { color:${c}; }
      .sp-border { border-color:${c}; }
      .sp-bg-soft { background-color:${c}10; }
      .sp-ring { --tw-ring-color:${c}; }
      .sp-gradient { background:linear-gradient(135deg, ${c} 0%, ${dark} 100%); }
    `}</style>
  )
}
