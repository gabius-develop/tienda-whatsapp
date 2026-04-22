/**
 * Inyecta clases CSS usando el color primario del tenant.
 * Clases disponibles para los componentes de la tienda:
 *   .sp-btn   → botón primario (fondo + hover/active)
 *   .sp-bg    → fondo primario (sin estados interactivos)
 *   .sp-text  → color de texto primario
 *   .sp-badge → badge/pastilla pequeña
 */
export function StoreColorStyle({ color }: { color: string }) {
  const c = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#16a34a'
  return (
    <style>{`
      .sp-btn  { background-color:${c};color:#fff;transition:filter .15s,transform .15s; }
      .sp-btn:hover  { filter:brightness(.88); }
      .sp-btn:active { filter:brightness(.78);transform:scale(.95); }
      .sp-bg   { background-color:${c}; }
      .sp-text { color:${c}; }
      .sp-badge{ background-color:${c};color:#fff; }
      .sp-cnt  { color:${c}; }
    `}</style>
  )
}
