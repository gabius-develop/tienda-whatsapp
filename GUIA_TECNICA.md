# Guía Técnica Completa — TiendaWhatsApp

> Plataforma SaaS multi-tenant de e-commerce con checkout por WhatsApp, bot conversacional automatizado, pagos con MercadoPago y panel de administración.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| Lenguaje | TypeScript | 5.x |
| UI | React | 19.2.4 |
| Estilos | Tailwind CSS | 4.x |
| Base de datos | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | SSR 0.10.2 |
| Storage | Supabase Storage | Bucket público `product-images` |
| Estado cliente | Zustand | 5.0.12 |
| Formularios | React Hook Form + Zod | 7.72.1 / 4.3.6 |
| Pagos | MercadoPago SDK | 2.12.0 |
| Mensajería | WhatsApp Cloud API (Meta) | v20.0 |
| Iconos | Lucide React | 1.8.0 |
| Notificaciones | react-hot-toast | 2.6.0 |
| Deploy | Railway (Nixpacks) | — |
| Node.js | Requerido >= 20.9.0 | — |

---

## 2. Estructura del Proyecto

```
tiendawhatsapp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Homepage (storefront)
│   │   ├── layout.tsx                # Root layout (Geist font, Toaster)
│   │   ├── globals.css               # Tailwind imports, custom styles
│   │   │
│   │   ├── product/[id]/page.tsx     # Detalle de producto
│   │   ├── cart/page.tsx             # Carrito de compras
│   │   ├── live/page.tsx             # Live shopping (YouTube embed)
│   │   ├── manual/page.tsx           # Pedido manual
│   │   ├── privacy/page.tsx          # Política de privacidad
│   │   ├── terms/page.tsx            # Términos de servicio
│   │   ├── data-deletion/page.tsx    # Política eliminación de datos
│   │   │
│   │   ├── payment/
│   │   │   ├── success/page.tsx      # Pago exitoso (MercadoPago)
│   │   │   ├── pending/page.tsx      # Pago pendiente
│   │   │   └── failure/page.tsx      # Pago fallido
│   │   │
│   │   ├── auth/callback/route.ts    # Supabase OAuth callback
│   │   │
│   │   ├── admin/                    # Panel de administración
│   │   │   ├── login/page.tsx
│   │   │   └── (protected)/          # Route group (requiere auth)
│   │   │       ├── layout.tsx        # Sidebar + protección de sesión
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── products/         # CRUD productos
│   │   │       ├── promotions/       # CRUD promociones
│   │   │       ├── orders/page.tsx   # Gestión de pedidos
│   │   │       ├── settings/page.tsx # Configuración de tienda
│   │   │       ├── whatsapp/         # Config bot + conversaciones
│   │   │       ├── competencia/      # Monitoreo competencia
│   │   │       └── live/page.tsx     # Config live streaming
│   │   │
│   │   ├── superadmin/               # Panel SaaS (multi-tenant)
│   │   │   └── (panel)/
│   │   │       ├── clients/          # CRUD de tenants
│   │   │       └── settings/
│   │   │
│   │   └── api/                      # 24 API Routes
│   │       ├── products/             # GET, POST, [id]: GET/PUT/DELETE
│   │       ├── orders/               # POST (público), GET, [id]: GET/PATCH
│   │       ├── promotions/           # GET, POST, [id]: GET/PUT/DELETE
│   │       ├── settings/             # GET (público), PUT (superadmin)
│   │       ├── payments/
│   │       │   ├── create/           # POST: crear preferencia MercadoPago
│   │       │   └── webhook/          # POST: IPN callback
│   │       ├── whatsapp/webhook/     # GET: verificación, POST: mensajes entrantes
│   │       ├── live/                 # GET/POST/DELETE: live streaming
│   │       ├── admin/
│   │       │   ├── upload/           # POST: subir imágenes
│   │       │   ├── stats/            # GET: estadísticas
│   │       │   ├── metrics/          # GET: métricas por periodo
│   │       │   ├── settings/         # PUT: actualizar config
│   │       │   ├── competencia/      # GET: datos competencia
│   │       │   └── whatsapp/         # Config bot, conversaciones, flows, templates
│   │       └── superadmin/
│   │           ├── auth/             # POST/DELETE: login/logout
│   │           └── tenants/          # CRUD tenants
│   │
│   ├── components/
│   │   ├── store/                    # Componentes del storefront
│   │   │   ├── ProductCard.tsx       # Tarjeta de producto
│   │   │   ├── ImageCarousel.tsx     # Carrusel de imágenes
│   │   │   ├── SearchBar.tsx         # Búsqueda
│   │   │   ├── CategoryFilter.tsx    # Filtro por categorías
│   │   │   ├── FloatingCart.tsx      # Carrito flotante (mobile/desktop)
│   │   │   ├── FloatingWhatsApp.tsx  # Botón WhatsApp flotante
│   │   │   ├── PromotionsBanner.tsx  # Banner de promociones
│   │   │   ├── LiveBanner.tsx        # Banner live activo
│   │   │   ├── CartButton.tsx        # Botón carrito en header
│   │   │   └── StoreColorStyle.tsx   # Inyección CSS dinámica (tema de colores)
│   │   ├── cart/
│   │   │   ├── CartItem.tsx          # Línea de carrito
│   │   │   └── CheckoutForm.tsx      # Formulario checkout
│   │   ├── admin/
│   │   │   ├── ProductForm.tsx       # Form producto (multi-imagen, atributos)
│   │   │   ├── PromotionForm.tsx     # Form promoción
│   │   │   ├── Sidebar.tsx           # Navegación admin
│   │   │   └── StatsCard.tsx         # Card de métricas
│   │   ├── live/
│   │   │   └── JitsiEmbed.tsx        # Embed Jitsi (deshabilitado)
│   │   └── ui/                       # Primitivos UI
│   │       ├── Button.tsx            # Variantes: primary, outline, ghost
│   │       ├── Input.tsx             # Input con label y error
│   │       ├── Textarea.tsx          # Textarea con label
│   │       └── Badge.tsx             # Badge de estado
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Cliente browser (anon key)
│   │   │   ├── server.ts            # Cliente server (cookies SSR)
│   │   │   └── service.ts           # Cliente service role (sin RLS)
│   │   ├── utils.ts                 # cn(), formatCurrency(), formatDate(), slugify()
│   │   ├── settings.ts              # Interface StoreSettings + fetch
│   │   ├── tenant.ts                # Resolución multi-tenant + cache
│   │   ├── whatsapp.ts              # Constructores de mensajes WhatsApp
│   │   ├── whatsapp-cloud.ts        # Wrapper WhatsApp Cloud API
│   │   └── whatsapp-bot.ts          # Lógica del bot conversacional (~1300 líneas)
│   │
│   ├── store/
│   │   └── cartStore.ts             # Zustand store (carrito + localStorage)
│   │
│   ├── types/
│   │   └── index.ts                 # Product, Order, Promotion, CartItem, etc.
│   │
│   └── proxy.ts                     # Middleware: multi-tenancy + auth
│
├── supabase/                         # 19 archivos de migraciones SQL
├── public/                           # SVG assets
├── next.config.ts                    # Config imágenes Supabase
├── railway.json                      # Config deploy Railway
├── nixpacks.toml                     # Builder config
├── package.json
├── tsconfig.json
└── .env.local.example
```

---

## 3. Arquitectura Multi-Tenant

### Resolución de Tenant (orden de prioridad)

1. **Path-based**: `/s/[slug]/*` → rewrite a `/*` + cookie
2. **Query param**: `?tenant=slug` (contexto admin login)
3. **Subdominio**: `tiendalaura.dominio.com` → slug `tiendalaura`
4. **Cookie fallback**: `x-tenant-slug` (persiste 24h)
5. **Default**: Variable `DEFAULT_TENANT_SLUG`

### Aislamiento de Datos

- Todas las tablas tienen columna `tenant_id` (FK a `tenants`)
- RLS (Row Level Security) en PostgreSQL filtra por `tenant_id`
- Queries de API siempre incluyen `.eq('tenant_id', tenant.id)`
- Cliente `service_role` bypassa RLS para operaciones del bot y webhooks

### Tenant Default

- ID: `00000000-0000-0000-0000-000000000001`
- Slug: configurado en `DEFAULT_TENANT_SLUG`

---

## 4. Sistema de Autenticación

### Nivel 1: Admin de Tienda (dueños de tienda)
- **Provider**: Supabase Auth (email/password)
- **Sesión**: Cookies server-side via `@supabase/ssr`
- **Protección**: Middleware en `proxy.ts` verifica `supabase.auth.getUser()` para rutas `/admin/*`
- **Login**: `/admin/login` → Supabase Auth → redirect a `/admin/dashboard`

### Nivel 2: SuperAdmin (desarrollador/plataforma)
- **Provider**: Cookie con hash SHA-256
- **Flow**: POST `/api/superadmin/auth` con password → hash SHA-256 → cookie `superadmin_auth` (httpOnly, 7 días)
- **Verificación**: Comparación constante contra `SUPERADMIN_PASSWORD` hasheado
- **Protección**: Middleware verifica cookie en rutas `/superadmin/*`

### Nivel 3: Service Role (operaciones internas)
- **Uso**: Webhooks, bot WhatsApp, operaciones admin sin contexto de usuario
- **Key**: `SUPABASE_SERVICE_ROLE_KEY` (solo server)
- **Bypassa**: RLS completamente

---

## 5. Esquema de Base de Datos

### Tablas Principales

#### `tenants`
```sql
id              UUID PK
name            TEXT
slug            TEXT UNIQUE        -- subdominio: slug.dominio.com
whatsapp_phone  TEXT
admin_email     TEXT
is_active       BOOLEAN DEFAULT true
feature_live           BOOLEAN DEFAULT false
feature_competencia    BOOLEAN DEFAULT false
feature_mandadito      BOOLEAN DEFAULT false
feature_mercadopago    BOOLEAN DEFAULT false
mercadopago_access_token TEXT
waba_id                  TEXT     -- WhatsApp Business Account ID
created_at, updated_at   TIMESTAMPTZ
```

#### `products`
```sql
id              UUID PK
tenant_id       UUID FK → tenants
name            TEXT
description     TEXT
price           DECIMAL(10,2)
was_price       DECIMAL(10,2)    -- precio anterior (para mostrar descuento)
price_type      TEXT             -- 'fixed' | 'negotiable'
image_url       TEXT             -- imagen principal
images          TEXT[]           -- array de URLs adicionales
category        TEXT
stock           INTEGER
is_active       BOOLEAN DEFAULT true
product_type    TEXT             -- general|ropa|electronica|calzado|accesorio
attributes      JSONB            -- colores, tallas, material, género, medidas
created_at, updated_at TIMESTAMPTZ
-- Índices: category, is_active, tenant_id
-- RLS: lectura pública (is_active=true), escritura autenticada
```

#### `orders`
```sql
id               UUID PK
tenant_id        UUID FK → tenants
customer_name    TEXT
customer_phone   TEXT
customer_address TEXT
total            DECIMAL(10,2)
status           TEXT DEFAULT 'pending'  -- pending|confirmed|shipped|delivered|cancelled
whatsapp_sent_at TIMESTAMPTZ
created_at       TIMESTAMPTZ
-- RLS: cualquiera puede crear, autenticado puede leer/actualizar
```

#### `order_items`
```sql
id            UUID PK
order_id      UUID FK → orders (CASCADE)
tenant_id     UUID FK → tenants
product_id    UUID FK → products (nullable)
product_name  TEXT              -- desnormalizado para auditoría
quantity      INTEGER
unit_price    DECIMAL(10,2)
subtotal      DECIMAL(10,2)
price_type    TEXT
created_at    TIMESTAMPTZ
```

#### `promotions`
```sql
id              UUID PK
tenant_id       UUID FK → tenants
title           TEXT
description     TEXT
image_url       TEXT
discount_label  TEXT
badge_color     TEXT
is_active       BOOLEAN
sort_order      INTEGER
starts_at       TIMESTAMPTZ
ends_at         TIMESTAMPTZ
created_at, updated_at TIMESTAMPTZ
```

#### `store_settings` (key-value)
```sql
key        TEXT    -- PK compuesta con tenant_id
tenant_id  UUID FK → tenants
value      TEXT
updated_at TIMESTAMPTZ
```
**Keys**: `store_name`, `logo_url`, `welcome_title`, `welcome_subtitle`, `footer_text`, `whatsapp_contact_phone`, `primary_color`, `live_active`, `live_youtube_id`, `live_started_at`, `store_url`

#### `whatsapp_bot_config`
```sql
id                UUID PK
tenant_id         UUID UNIQUE FK → tenants
phone_number_id   TEXT          -- Meta Phone Number ID
access_token      TEXT          -- Meta API token
verify_token      TEXT          -- Webhook verification
waba_id           TEXT          -- WhatsApp Business Account ID
is_active         BOOLEAN
is_restaurant     BOOLEAN       -- modo restaurante
welcome_message   TEXT
welcome_image_url TEXT
menu_header       TEXT
orders_ask_phone  BOOLEAN       -- pedir teléfono para buscar pedidos
support_message   TEXT
no_orders_message TEXT
forward_phone     TEXT          -- reenvío de mensajes
created_at, updated_at TIMESTAMPTZ
```

#### `whatsapp_conversations`
```sql
id              UUID PK
tenant_id       UUID FK
customer_phone  TEXT
state           TEXT    -- idle|support|order_lookup
context         JSONB   -- datos del flujo actual
last_message_at TIMESTAMPTZ
created_at      TIMESTAMPTZ
UNIQUE(tenant_id, customer_phone)
```

#### `whatsapp_messages`
```sql
id              UUID PK
tenant_id       UUID FK
customer_phone  TEXT
direction       TEXT    -- inbound|outbound
content         TEXT
wa_message_id   TEXT
media_url       TEXT
media_type      TEXT
created_at      TIMESTAMPTZ
```

#### `bot_flow_steps` (menú personalizado del bot)
```sql
id                 UUID PK
tenant_id          UUID FK
parent_id          UUID FK (self-referencing, nullable)
button_id          TEXT
button_title       TEXT (max 20 chars)
step_type          TEXT    -- products|orders|support|custom|restaurant_menu|promotions
response_text      TEXT
response_image_url TEXT
sort_order         INTEGER
is_active          BOOLEAN
created_at, updated_at TIMESTAMPTZ
-- Estructura jerárquica: max 3 top-level, max 3 hijos cada uno
```

#### `bot_cart_items` (carrito del bot WhatsApp)
```sql
id              UUID PK
tenant_id       UUID FK
customer_phone  TEXT
product_id      UUID FK → products
promotion_id    UUID FK → promotions (nullable)
item_name       TEXT
item_price      DECIMAL
quantity        INTEGER
created_at      TIMESTAMPTZ
UNIQUE(tenant_id, customer_phone, product_id)
```

### Orden de Ejecución de Migraciones
1. `schema.sql` — tablas core
2. `promotions.sql`
3. `settings.sql`
4. `multitenancy.sql` — añade tenant_id y multi-tenancy
5. `add_mercadopago_token.sql`
6. Habilitar realtime: `ALTER TABLE products REPLICA IDENTITY FULL; ALTER PUBLICATION supabase_realtime ADD TABLE products;`

---

## 6. API Routes — Referencia Completa

### Productos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/products` | Público | Lista productos activos. Query: `category`, `search`, `includeInactive=true` (auth) |
| POST | `/api/products` | Auth | Crear producto. Inyecta `tenant_id` automáticamente |
| GET | `/api/products/[id]` | Público | Detalle de producto |
| PUT | `/api/products/[id]` | Auth | Actualizar producto |
| DELETE | `/api/products/[id]` | Auth | Eliminar producto (hard delete) |

### Pedidos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/orders` | **Público** | Crear pedido. **Verifica precios y stock en servidor** (nunca confía en el cliente). Decrementa stock |
| GET | `/api/orders` | Auth | Últimos 50 pedidos con order_items |
| GET | `/api/orders/[id]` | Auth | Detalle de pedido |
| PATCH | `/api/orders/[id]` | Auth | Cambiar status. Si → `cancelled`: restaura stock |

### Promociones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/promotions` | Público | Lista activas. `all=true` muestra todas (auth) |
| POST | `/api/promotions` | Auth | Crear promoción |
| GET | `/api/promotions/[id]` | Público | Detalle |
| PUT/PATCH | `/api/promotions/[id]` | Auth | Actualizar |
| DELETE | `/api/promotions/[id]` | Auth | Eliminar |

### Configuración

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/settings` | Público | Settings mergeados (defaults + store_settings + tenant) |
| PUT | `/api/settings` | SuperAdmin | Actualizar settings (whitelist de keys) |

### Pagos (MercadoPago)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/payments/create` | Público | Crear preferencia. Requiere `feature_mercadopago=true`. Usa token del tenant o fallback env |
| POST | `/api/payments/webhook` | Público | IPN callback. Verifica pago → actualiza order status a `confirmed` |

### WhatsApp

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/whatsapp/webhook` | Público | Verificación Meta (challenge/response) |
| POST | `/api/whatsapp/webhook` | Público | Mensajes entrantes → guarda + procesa bot |
| GET | `/api/admin/whatsapp` | Auth | Config del bot (token enmascarado) |
| PUT | `/api/admin/whatsapp` | Auth | Guardar/actualizar config bot |
| GET | `/api/admin/whatsapp/conversations` | Auth | Lista conversaciones o detalle por `?phone=` |
| POST | `/api/admin/whatsapp/conversations` | Auth | Enviar mensaje manual (texto o imagen) |
| PATCH | `/api/admin/whatsapp/conversations` | Auth | Cambiar estado conversación (idle/support) |
| GET | `/api/admin/whatsapp/templates` | Auth | Listar templates aprobados de Meta |
| POST | `/api/admin/whatsapp/templates` | Auth | Enviar template con variables |
| GET | `/api/admin/whatsapp/flows` | Auth | Árbol de flujos del bot |
| PUT | `/api/admin/whatsapp/flows` | Auth | Reemplazar todos los flujos |
| GET | `/api/admin/whatsapp/forward-phone` | Auth | Obtener teléfono de reenvío |
| PUT | `/api/admin/whatsapp/forward-phone` | Auth | Configurar teléfono de reenvío |

### Admin

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/admin/upload` | Auth | Subir imagen a Supabase Storage. Query: `?folder=products` |
| GET | `/api/admin/stats` | Auth | Estadísticas: revenue, orders, top products |
| GET | `/api/admin/metrics` | Auth | Métricas por periodo: `?period=today|week|month` con comparación vs periodo anterior |
| GET | `/api/admin/competencia` | Auth | Datos de competidores |

### SuperAdmin

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/superadmin/auth` | Público | Login con password → cookie SHA-256 |
| DELETE | `/api/superadmin/auth` | — | Logout (limpia cookie) |
| GET | `/api/superadmin/tenants` | SuperAdmin | Lista todos los tenants |
| POST | `/api/superadmin/tenants` | SuperAdmin | Crear tenant + usuario auth opcional |
| GET | `/api/superadmin/tenants/[id]` | SuperAdmin | Detalle tenant |
| PUT | `/api/superadmin/tenants/[id]` | SuperAdmin | Actualizar tenant |
| POST | `/api/superadmin/tenants/[id]` | SuperAdmin | Reset password admin |
| DELETE | `/api/superadmin/tenants/[id]` | SuperAdmin | Soft delete o `?permanent=true` (cascade) |

### Live Streaming

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/live` | Público | Estado del live (active, youtube_id) |
| POST | `/api/live` | Auth | Iniciar broadcast (YouTube URL) |
| DELETE | `/api/live` | Auth | Terminar broadcast |

---

## 7. Bot de WhatsApp — Arquitectura

### Archivo Principal
`src/lib/whatsapp-bot.ts` (~1300 líneas)

### Máquina de Estados
```
idle → (usuario saluda) → muestra menú principal
     → ver_productos → detalle_producto → agregar_carrito
     → ver_carrito → checkout → nombre → dirección → confirmar_pedido
     → order_lookup → ingresa_teléfono → muestra_pedidos
     → support → reenvío a operador humano
     → custom_flow → muestra respuesta personalizada
```

### Umbral de Inactividad
30 minutos sin interacción → conversación se resetea a `idle`

### Funcionalidades del Bot

1. **Bienvenida**: Mensaje + imagen configurable → menú principal
2. **Catálogo**: Top 5 productos más vendidos (o recientes si no hay ventas)
3. **Carrito**: Persistido en DB (`bot_cart_items`), increment/decrement, limpiar
4. **Checkout**:
   - Solicita nombre → dirección → muestra resumen
   - Crea pedido vía `POST /api/orders` (precios verificados en servidor)
   - Si MercadoPago habilitado: genera link de pago
5. **Consulta de Pedidos**: Cliente ingresa teléfono → muestra pedidos recientes
6. **Modo Restaurante**: Menú categorizado (entradas, principales, postres)
7. **Soporte**: Cambia estado a `support`, reenvía mensajes a `forward_phone`
8. **Flujos Personalizados**: Menú de hasta 3 botones × 3 sub-botones con respuestas custom

### WhatsApp Cloud API Wrapper
`src/lib/whatsapp-cloud.ts`

| Función | Uso |
|---------|-----|
| `sendTextMessage()` | Texto simple |
| `sendButtonMessage()` | Hasta 3 botones quick-reply |
| `sendListMessage()` | Menú con secciones (hasta 10 items) |
| `sendImageMessage()` | Imagen con caption opcional |
| `sendTemplateMessage()` | Templates aprobados por Meta con variables |
| `getMediaUrl()` | URL temporal de descarga de media |
| `downloadMedia()` | Descargar contenido media |
| `markAsRead()` | Marcar como leído (checks azules) |

---

## 8. Sistema de Pagos (MercadoPago)

### Flujo de Pago
```
1. Cliente completa checkout → POST /api/payments/create
2. Server verifica feature_mercadopago en tenant
3. Crea preferencia con items, redirect URLs, webhook URL
4. Retorna { preference_id, payment_url }
5. Frontend redirige a MercadoPago
6. Cliente paga → MercadoPago → POST /api/payments/webhook
7. Webhook verifica pago con token del tenant
8. Actualiza order.status a 'confirmed'
```

### Detección Sandbox/Producción
- Token con prefijo `TEST-` → sandbox mode
- Token sin prefijo → producción

### Tokens
- **Fallback**: `MERCADOPAGO_ACCESS_TOKEN` (env)
- **Por tenant**: `tenants.mercadopago_access_token` (DB, prioridad)

---

## 9. Estado del Cliente (Frontend)

### Zustand Cart Store
```typescript
useCartStore = {
  items: CartItem[],
  addItem(product): void,
  removeItem(productId): void,
  updateQuantity(productId, qty): void,
  clearCart(): void,
  totalItems(): number,
  totalPrice(): number,       // Excluye items "negotiable"
  hasNegotiableItems(): boolean
}
```
- Persistencia en `localStorage` (key: `shopping-cart`)
- Solo client-side (no sincroniza con servidor)

### Datos del Servidor
- Productos, pedidos, settings → fetch a `/api/*`
- Real-time: Supabase subscriptions en tabla `products`
- Settings: cache con `{ next: { revalidate: 60 } }`

---

## 10. Sistema de Estilos y Tematización

### Color Dinámico
El componente `StoreColorStyle.tsx` inyecta CSS dinámico basado en el `primary_color` del tenant:

```css
/* Clases generadas dinámicamente */
.sp-btn        /* Botón con color primario */
.sp-bg         /* Fondo color primario */
.sp-text       /* Texto color primario */
.sp-badge      /* Badge con color primario */
.sp-border     /* Borde color primario */
.sp-bg-soft    /* Fondo suave (con opacidad) */
.sp-ring       /* Ring/outline color primario */
.sp-gradient   /* Gradiente con color primario */
.sp-gradient-light  /* Gradiente claro */
```

### Color Default
`#16a34a` (green-600) — configurable por tenant desde admin

### UI Components
Componentes custom sin librería externa (no shadcn/ui, no Material-UI):
- `Button` con variantes: primary, outline, ghost + tamaños + loading state
- `Input` con label y mensaje de error
- `Textarea` con label
- `Badge` con variantes de color

---

## 11. Funcionalidades del Storefront

### Homepage
- Header sticky con logo, búsqueda, carrito
- Hero section (desktop/mobile)
- Filtro por categorías (chips horizontales)
- Grid de productos (2-5 columnas responsive)
- Banner de promociones (carrusel horizontal)
- Banner de live activo
- Footer
- Botón flotante WhatsApp
- Carrito flotante (barra inferior mobile / botón lateral desktop)

### Página de Producto
- Carrusel de imágenes (hasta 8, con thumbnails y flechas)
- Precio: fijo o "A convenir"
- Badge de descuento (-X% OFF) calculado de `was_price`
- Indicador de stock
- Atributos de ropa: tallas, colores, material, medidas, género
- Selector de cantidad
- Botón agregar al carrito
- Compartir producto (Web Share API o clipboard)
- Badges de confianza (envío, compra segura, soporte)

### Carrito y Checkout
- Items con controles de cantidad + eliminar
- Formulario: nombre, teléfono, dirección
- Dos métodos de pago:
  - **WhatsApp**: Construye mensaje → redirige a `wa.me`
  - **MercadoPago**: Crea preferencia → redirige a checkout MercadoPago
- Manejo de items "a convenir" (total marcado como pendiente)

### Live Shopping
- Embed YouTube (autoplay)
- Contador de tiempo transcurrido
- Sidebar con top 8 productos
- Agregar al carrito mientras se mira
- Botón rápido de consulta WhatsApp por producto
- Tema oscuro

---

## 12. Panel de Administración

### Dashboard / Métricas
- Cards KPI: revenue, pedidos, ticket promedio, mensajes WhatsApp
- Porcentaje de cambio vs periodo anterior
- Gráfico de barras (revenue por día)
- Pedidos por estado
- Top 5 productos más vendidos
- Exportar a Excel (tabla HTML) y PDF (auto-print)
- Selector de periodo: hoy / semana / mes

### Gestión de Productos
- CRUD completo con tabla listado
- Upload múltiple de imágenes (hasta 8, drag-drop)
- Selector de tipo: general, ropa, calzado, accesorio, electrónica
- Toggle tipo de precio: fijo vs negociable
- Atributos de ropa: colores (tags), tallas (preset + custom), material, género, medidas
- Control de stock y categoría
- Toggle activo/inactivo

### Gestión de Pedidos
- Lista con detalle expandible
- Info del cliente (nombre, teléfono, dirección, fecha)
- Items del pedido desglosados
- Dropdown de status: pending → confirmed → shipped → delivered / cancelled
- Restauración automática de stock al cancelar

### Configuración de Tienda
- **Marca**: Logo (upload con preview), nombre, título y subtítulo de bienvenida
- **Tema**: Color picker (presets + hex custom) con preview en vivo
- **WhatsApp**: Teléfono del botón flotante
- **Seguridad**: Cambio de contraseña admin

### Configuración WhatsApp Bot
- Credenciales: Phone Number ID, Access Token, Verify Token, WABA ID
- Toggles: bot on/off, modo restaurante
- Mensajes personalizables: bienvenida, soporte, sin pedidos
- Imagen de bienvenida
- Flujos: hasta 3 botones principales × 3 sub-botones
- Templates: cargar de Meta, enviar con variables
- Reenvío de mensajes a número externo

### Conversaciones WhatsApp
- Vista de chat con historial de mensajes
- Envío manual de texto e imágenes
- Toggle soporte/bot (pausar bot para atención humana)

---

## 13. Panel SuperAdmin (SaaS)

### Gestión de Tenants
- Crear tenant con: nombre, slug, teléfono WhatsApp, email admin, feature flags
- Genera automáticamente usuario Supabase Auth con contraseña temporal
- Editar features, datos, activar/desactivar
- Reset de contraseña admin
- Soft delete (is_active=false) o hard delete con cascade completo

### Feature Flags por Tenant
- `feature_live` — Live shopping (YouTube)
- `feature_competencia` — Monitoreo de competencia
- `feature_mandadito` — Servicio de mandados
- `feature_mercadopago` — Pagos con MercadoPago

---

## 14. Variables de Entorno

```bash
# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co        # URL pública
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                     # Key anónima (browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                          # Key service role (server only)

# === APP ===
APP_DOMAIN=tienda-whatsapp-production-099c.up.railway.app
NEXT_PUBLIC_APP_DOMAIN=tienda-whatsapp-production-099c.up.railway.app
NEXT_PUBLIC_APP_URL=https://tienda-whatsapp-production-099c.up.railway.app
DEFAULT_TENANT_SLUG=default

# === STORE (fallbacks) ===
NEXT_PUBLIC_WHATSAPP_PHONE=521XXXXXXXXXX
NEXT_PUBLIC_STORE_NAME=Mi Tienda Online

# === PAGOS ===
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx...    # Token fallback global

# === SUPERADMIN ===
SUPERADMIN_PASSWORD=tu-password-seguro    # Se hashea con SHA-256
SUPERADMIN_EMAIL=email@ejemplo.com        # Opcional, informativo
```

---

## 15. Deployment (Railway)

### Configuración
```json
// railway.json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Scripts
```bash
npm run dev    # Desarrollo local
npm run build  # Build producción
npm run start  # Iniciar servidor producción
npm run lint   # ESLint
```

### Requisitos
- Node.js >= 20.9.0
- Variables de entorno configuradas
- Supabase project con migraciones ejecutadas
- Bucket `product-images` creado (público)
- Dominio con wildcard DNS para subdominios (`*.dominio.com`)

---

## 16. Seguridad

### Implementado
- RLS en todas las tablas (aislamiento por tenant_id)
- Verificación de precios en servidor (nunca confía en precios del cliente)
- Verificación de stock antes de crear pedido
- Cookies httpOnly y Secure en producción
- Hash SHA-256 para password de superadmin
- Token de acceso enmascarado en respuestas API (solo últimos 6 chars)
- Service role solo en server (nunca expuesto al browser)

### Consideraciones
- Webhooks de WhatsApp: verifican `verify_token` pero no firma criptográfica
- Webhooks de MercadoPago: sin verificación de firma (confía en IP whitelist)
- Tokens de WhatsApp/MercadoPago almacenados en texto plano en DB
- Sin rate limiting en endpoints públicos

---

## 17. Patrones de Arquitectura Clave

1. **Server-side Price Verification**: `POST /api/orders` re-calcula todos los precios desde la DB
2. **Denormalized Order Items**: `order_items` almacena nombre y precio al momento del pedido (auditoría)
3. **Async Webhook Processing**: Siempre retorna 200 inmediatamente a Meta/MercadoPago
4. **Conversation State Machine**: Bot mantiene estado + contexto en DB por customer_phone
5. **Key-Value Settings**: `store_settings` permite features flexibles sin cambios de schema
6. **Tenant Caching**: `unstable_cache` con revalidación cada 30 segundos
7. **Stock as Inventory**: Decrementa al crear pedido, restaura al cancelar
8. **Dynamic CSS Theming**: Color primario inyectado como clases CSS en runtime
9. **Feature Flags en DB**: Cada tenant tiene flags que habilitan/deshabilitan módulos
10. **Service Role para Bot**: El bot ejecuta server-side sin contexto de usuario autenticado

---

## 18. Flujos de Negocio Principales

### Flujo de Compra (Storefront → WhatsApp)
```
Cliente navega productos → Agrega al carrito (Zustand/localStorage)
→ Va a /cart → Llena formulario (nombre, teléfono, dirección)
→ Click "Enviar por WhatsApp"
→ POST /api/orders (verifica precios + stock, decrementa stock)
→ Construye mensaje WhatsApp con items verificados
→ Redirige a wa.me/{phone}?text={mensaje}
→ Admin recibe pedido en WhatsApp Business
```

### Flujo de Compra (Storefront → MercadoPago)
```
Cliente navega → Carrito → Checkout
→ POST /api/orders (verifica precios + stock)
→ POST /api/payments/create (genera preferencia MercadoPago)
→ Redirige a MercadoPago checkout
→ Cliente paga → MercadoPago POST /api/payments/webhook
→ Webhook verifica pago → Actualiza order.status = 'confirmed'
→ Cliente redirigido a /payment/success
```

### Flujo de Compra (Bot WhatsApp)
```
Cliente envía mensaje → Meta webhook → POST /api/whatsapp/webhook
→ handleIncomingMessage() determina estado de conversación
→ Muestra menú → Cliente selecciona producto → Agrega a carrito (DB)
→ Checkout: solicita nombre → dirección → crea pedido via API
→ Si MercadoPago: incluye link de pago en mensaje
→ Confirma pedido al cliente por WhatsApp
```

### Flujo de Cancelación
```
Admin cambia status a 'cancelled' → PATCH /api/orders/[id]
→ Detecta cambio A cancelled → Consulta order_items
→ Para cada item: restaura quantity al stock del producto
→ Actualiza status del pedido
```

---

## 19. Localización

- **Idioma**: Español (es-MX) — toda la UI y mensajes
- **Moneda**: MXN (pesos mexicanos) via `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
- **Fechas**: Formato español via `Intl.DateTimeFormat` (locale español)
- **Sin i18n framework**: Textos hardcoded en español

---

## 20. Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| `next.config.ts` | Imágenes remotas de Supabase |
| `tsconfig.json` | Target ES2017, strict, path alias `@/*` → `./src/*` |
| `postcss.config.mjs` | Plugin `@tailwindcss/postcss` (Tailwind v4) |
| `eslint.config.mjs` | Next.js core-web-vitals + TypeScript rules |
| `railway.json` | Deploy config Railway (Nixpacks builder) |
| `nixpacks.toml` | Builder config (defaults) |
| `.env.local.example` | Template de variables de entorno |
