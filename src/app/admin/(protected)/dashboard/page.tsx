'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign, Target,
  MessageSquare, FileSpreadsheet, FileText, RefreshCw, Package,
} from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month'

interface DayData { date: string; revenue: number; orders: number }
interface ProductStat {
  product_id: string; product_name: string
  total_sold: number; total_revenue: number; image_url: string | null
}
interface OrderExport {
  id: string; customer_name: string; customer_phone: string
  total: number; status: string; created_at: string
}
interface Metrics {
  period: Period; label: string
  revenue: number; orders: number; avg_ticket: number
  prev_revenue: number; prev_orders: number
  orders_by_status: Record<string, number>
  revenue_by_day: DayData[]
  top_products: ProductStat[]
  wa_inbound: number; wa_outbound: number
  orders_list: OrderExport[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_ES: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-400', confirmed: 'bg-blue-400',
  shipped: 'bg-purple-400', delivered: 'bg-green-500', cancelled: 'bg-red-400',
}

function pct(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function PctBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">Sin datos previos</span>
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value.toFixed(1)}% vs período anterior
    </span>
  )
}

// ── Bar chart (puro CSS) ──────────────────────────────────────────────────────

function BarChart({ data }: { data: DayData[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)

  const label = (date: string, total: number) => {
    const d = new Date(date + 'T12:00:00')
    if (total <= 7) return d.toLocaleDateString('es-MX', { weekday: 'short' })
    if (total <= 31) return d.toLocaleDateString('es-MX', { day: 'numeric' })
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  if (data.every(d => d.revenue === 0)) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-400 text-sm">
        Sin ingresos en este período
      </div>
    )
  }

  return (
    <div className="flex items-end gap-1 h-36 pt-2">
      {data.map((d) => {
        const h = d.revenue > 0 ? Math.max((d.revenue / max) * 100, 6) : 0
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <div className="relative w-full flex-1 flex flex-col justify-end">
              {d.revenue > 0 && (
                <div
                  className="relative w-full bg-green-500 rounded-t-sm group-hover:bg-green-400 transition-colors cursor-default"
                  style={{ height: `${h}%` }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {formatCurrency(d.revenue)}
                  </span>
                </div>
              )}
              {d.revenue === 0 && (
                <div className="w-full h-[2px] bg-gray-100 rounded" />
              )}
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center leading-tight">
              {label(d.date, data.length)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Export helpers ────────────────────────────────────────────────────────────

function exportExcel(m: Metrics) {
  const periodLabel = m.label
  const now = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })

  const statusRows = Object.entries(m.orders_by_status)
    .map(([s, n]) => `<tr><td>${STATUS_ES[s] ?? s}</td><td>${n}</td></tr>`)
    .join('')

  const orderRows = m.orders_list.map(o =>
    `<tr>
      <td>${new Date(o.created_at).toLocaleDateString('es-MX')}</td>
      <td>${o.customer_name}</td>
      <td>${o.customer_phone}</td>
      <td>${o.total.toFixed(2)}</td>
      <td>${STATUS_ES[o.status] ?? o.status}</td>
    </tr>`
  ).join('')

  const productRows = m.top_products.map(p =>
    `<tr>
      <td>${p.product_name}</td>
      <td>${p.total_sold}</td>
      <td>${p.total_revenue.toFixed(2)}</td>
    </tr>`
  ).join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;font-size:11px}
      h2{color:#166534;font-size:14px;margin:16px 0 6px}
      th{background:#166534;color:#fff;padding:6px 10px;text-align:left}
      td{padding:5px 10px;border-bottom:1px solid #e5e7eb}
      tr:nth-child(even) td{background:#f9fafb}
      .kpi{display:inline-block;border:1px solid #e5e7eb;border-radius:6px;padding:8px 14px;margin:4px}
      .kpi-v{font-size:18px;font-weight:bold;color:#111}
      .kpi-l{font-size:11px;color:#6b7280}
    </style>
    </head>
    <body>
      <h1 style="color:#166534;margin-bottom:2px">Reporte de Ventas</h1>
      <p style="color:#6b7280;font-size:12px">Período: ${periodLabel} &nbsp;·&nbsp; Generado: ${now}</p>

      <h2>Resumen del período</h2>
      <div>
        <div class="kpi"><div class="kpi-l">Ingresos totales</div><div class="kpi-v">${formatCurrency(m.revenue)}</div></div>
        <div class="kpi"><div class="kpi-l">Pedidos</div><div class="kpi-v">${m.orders}</div></div>
        <div class="kpi"><div class="kpi-l">Ticket promedio</div><div class="kpi-v">${formatCurrency(m.avg_ticket)}</div></div>
        <div class="kpi"><div class="kpi-l">Mensajes WA recibidos</div><div class="kpi-v">${m.wa_inbound}</div></div>
      </div>

      <h2>Pedidos por estado</h2>
      <table><thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
      <tbody>${statusRows}</tbody></table>

      <h2>Detalle de pedidos</h2>
      <table><thead><tr><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Total (MXN)</th><th>Estado</th></tr></thead>
      <tbody>${orderRows}</tbody></table>

      <h2>Productos más vendidos</h2>
      <table><thead><tr><th>Producto</th><th>Unidades vendidas</th><th>Ingresos (MXN)</th></tr></thead>
      <tbody>${productRows}</tbody></table>
    </body></html>`

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-${m.period}-${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(m: Metrics) {
  const periodLabel = m.label
  const now = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })

  const statusRows = Object.entries(m.orders_by_status)
    .map(([s, n]) => `<tr><td>${STATUS_ES[s] ?? s}</td><td>${n}</td></tr>`)
    .join('')

  const orderRows = m.orders_list.map(o =>
    `<tr>
      <td>${new Date(o.created_at).toLocaleDateString('es-MX')}</td>
      <td>${o.customer_name}</td>
      <td>${o.customer_phone}</td>
      <td>${formatCurrency(o.total)}</td>
      <td>${STATUS_ES[o.status] ?? o.status}</td>
    </tr>`
  ).join('')

  const productRows = m.top_products.map(p =>
    `<tr><td>${p.product_name}</td><td>${p.total_sold}</td><td>${formatCurrency(p.total_revenue)}</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Reporte de Ventas</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;margin:28px;color:#111;font-size:12px}
    h1{color:#166534;font-size:20px;margin:0 0 4px}
    .sub{color:#6b7280;font-size:12px;margin:0 0 20px}
    .kpis{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .kpi{flex:1;min-width:120px;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px}
    .kpi-l{font-size:10px;color:#6b7280;margin-bottom:4px}
    .kpi-v{font-size:18px;font-weight:700;color:#111}
    h2{font-size:13px;color:#374151;margin:16px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
    th{background:#166534;color:#fff;padding:7px 10px;text-align:left}
    td{padding:6px 10px;border-bottom:1px solid #f3f4f6}
    tr:nth-child(even) td{background:#f9fafb}
    .footer{margin-top:20px;font-size:10px;color:#9ca3af;text-align:center}
    @media print{body{margin:10px}h1{font-size:16px}}
  </style></head>
  <body>
    <h1>Reporte de Ventas</h1>
    <p class="sub">Período: <strong>${periodLabel}</strong> &nbsp;·&nbsp; Generado: ${now}</p>

    <div class="kpis">
      <div class="kpi"><div class="kpi-l">Ingresos totales</div><div class="kpi-v">${formatCurrency(m.revenue)}</div></div>
      <div class="kpi"><div class="kpi-l">Pedidos</div><div class="kpi-v">${m.orders}</div></div>
      <div class="kpi"><div class="kpi-l">Ticket promedio</div><div class="kpi-v">${formatCurrency(m.avg_ticket)}</div></div>
      <div class="kpi"><div class="kpi-l">Mensajes WA recibidos</div><div class="kpi-v">${m.wa_inbound}</div></div>
    </div>

    <h2>Pedidos por estado</h2>
    <table><thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
    <tbody>${statusRows}</tbody></table>

    <h2>Detalle de pedidos</h2>
    <table><thead><tr><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Total</th><th>Estado</th></tr></thead>
    <tbody>${orderRows}</tbody></table>

    <h2>Productos más vendidos</h2>
    <table><thead><tr><th>Producto</th><th>Unidades</th><th>Ingresos</th></tr></thead>
    <tbody>${productRows}</tbody></table>

    <div class="footer">Panel Admin &nbsp;·&nbsp; ${new Date().toLocaleString('es-MX')}</div>
    <script>window.onload=()=>{window.print();}</script>
  </body></html>`

  const pw = window.open('', '_blank', 'width=900,height=700')
  if (pw) { pw.document.write(html); pw.document.close() }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const fetchMetrics = useCallback(async (p: Period, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/admin/metrics?period=${p}`)
      const data = await res.json()
      setMetrics(data)
    } catch { /* silencioso */ }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { fetchMetrics(period) }, [period, fetchMetrics])

  const handleExcel = () => {
    if (!metrics) return
    setExporting('excel')
    try { exportExcel(metrics) } finally { setExporting(null) }
  }

  const handlePDF = () => {
    if (!metrics) return
    setExporting('pdf')
    try { exportPDF(metrics) } finally { setExporting(null) }
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-56 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
        ))}
      </div>
      <div className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100" />
        <div className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100" />
      </div>
    </div>
  )

  if (!metrics) return null

  const revPct = pct(metrics.revenue, metrics.prev_revenue)
  const ordPct = pct(metrics.orders, metrics.prev_orders)
  const avgPct = pct(
    metrics.orders > 0 ? metrics.revenue / metrics.orders : 0,
    metrics.prev_orders > 0 ? metrics.prev_revenue / metrics.prev_orders : 0,
  )

  const totalStatusOrders = Object.values(metrics.orders_by_status).reduce((s, n) => s + n, 0)
  const maxProductRevenue = Math.max(...metrics.top_products.map(p => p.total_revenue), 1)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Métricas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{metrics.label}</p>
        </div>

        {/* Selector de período */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 self-start sm:self-auto">
          {(['today', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
          <button
            onClick={() => fetchMetrics(period)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Ingresos */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Ingresos</p>
            <div className="p-2 bg-green-50 rounded-xl"><DollarSign className="w-4 h-4 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(metrics.revenue)}</p>
          <PctBadge value={revPct} />
        </div>

        {/* Pedidos */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Pedidos</p>
            <div className="p-2 bg-blue-50 rounded-xl"><ShoppingBag className="w-4 h-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.orders}</p>
          <PctBadge value={ordPct} />
        </div>

        {/* Ticket promedio */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">Ticket promedio</p>
            <div className="p-2 bg-purple-50 rounded-xl"><Target className="w-4 h-4 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(metrics.avg_ticket)}</p>
          <PctBadge value={avgPct} />
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">WhatsApp</p>
            <div className="p-2 bg-orange-50 rounded-xl"><MessageSquare className="w-4 h-4 text-orange-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.wa_inbound}</p>
          <span className="text-xs text-gray-400">
            mensajes recibidos · {metrics.wa_outbound} enviados
          </span>
        </div>
      </div>

      {/* Gráfica de ingresos por día */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Ingresos por día
          </h2>
          <span className="text-xs text-gray-400">{metrics.label}</span>
        </div>
        <BarChart data={metrics.revenue_by_day} />
      </div>

      {/* Status + Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pedidos por estado */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            Pedidos por estado
          </h2>
          {totalStatusOrders === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Sin pedidos en este período</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.orders_by_status).map(([status, count]) => {
                const pctVal = (count / totalStatusOrders) * 100
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-700">{STATUS_ES[status] ?? status}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'}`}
                        style={{ width: `${pctVal}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            Productos más vendidos
          </h2>
          {metrics.top_products.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Sin ventas en este período</p>
          ) : (
            <div className="space-y-3">
              {metrics.top_products.map((p, i) => (
                <div key={p.product_id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    {p.image_url ? (
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <Image src={p.image_url} alt={p.product_name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm">
                        📦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.product_name}</p>
                      <p className="text-xs text-gray-400">{p.total_sold} vendidos</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 shrink-0">
                      {formatCurrency(p.total_revenue)}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-8">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${(p.total_revenue / maxProductRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exportar */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Exportar reporte</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Descarga los datos de <strong>{metrics.label.toLowerCase()}</strong> en el formato que prefieras
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleExcel}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting === 'excel' ? 'Generando…' : 'Exportar Excel'}
          </button>
          <button
            onClick={handlePDF}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4" />
            {exporting === 'pdf' ? 'Generando…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

    </div>
  )
}
