# Tienda WhatsApp — Plataforma Multi-Tenant

Plataforma SaaS de tiendas online donde cada cliente tiene su propia tienda, recibe pedidos en su propio WhatsApp y cobra con su propia cuenta de MercadoPago. **Un solo servidor, muchos clientes.**

## Paneles incluidos

| Panel | URL | Para quién |
|---|---|---|
| Tienda pública | `slug.tudominio.com/` | Clientes del negocio |
| Admin de tienda | `slug.tudominio.com/admin` | Dueño de cada tienda |
| Super Admin | `tudominio.com/superadmin` | Tú (el desarrollador) |
| Transmisión en vivo | `slug.tudominio.com/live` | Clientes durante live |

## Stack

Next.js 14 · TypeScript · Tailwind CSS · Supabase · Zustand · MercadoPago SDK v2

---

## PARTE 1 — Clonar el proyecto

```bash
git clone https://github.com/TU_USUARIO/tiendawhatsapp.git
cd tiendawhatsapp
npm install
```

---

## PARTE 2 — Configurar Supabase

### 2.1 Crear proyecto

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Elige nombre, contraseña de DB y región (ej: `South America - São Paulo`)
3. Espera ~2 minutos a que esté listo

### 2.2 Ejecutar SQL (en este orden exacto)

Ve a **SQL Editor** y ejecuta los archivos uno por uno:

1. `supabase/schema.sql` — tablas principales: products, orders, order_items, storage
2. `supabase/promotions.sql` — tabla de promociones
3. `supabase/settings.sql` — configuración de tienda (nombre, bienvenida, footer)
4. `supabase/multitenancy.sql` — **tabla tenants + columnas tenant_id en todas las tablas** _(núcleo del sistema multi-cliente)_
5. `supabase/add_mercadopago_token.sql` — columna de token MercadoPago por cliente
6. SQL para activar stock en tiempo real:

```sql
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

> **Nota:** `supabase/add_product_images.sql` y `supabase/add_was_price.sql` solo se necesitan si actualizas un proyecto que existía antes de esas migraciones. En instalaciones nuevas no hacen falta.

### 2.3 Obtener credenciales

En Supabase → **Settings → API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` _(solo para el servidor, nunca en el frontend)_

### 2.4 Crear usuario admin para cada cliente

En Supabase → **Authentication → Users → Add user**:
- Email: correo del dueño de la tienda
- Password: contraseña
- Marca **"Auto Confirm User"**

Repite esto una vez por cada cliente. Luego en el Super Admin podrás vincular ese email al tenant correspondiente.

---

## PARTE 3 — Variables de entorno

Crea el archivo `.env.local` en la raíz:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Solo servidor — jamás exponer al cliente

# Contraseña del Super Admin (la defines tú)
SUPERADMIN_PASSWORD=elige-una-contraseña-segura

# Slug del tenant por defecto (para dev local y modo single-tenant)
# En producción con subdominios esto se detecta automáticamente del subdominio
DEFAULT_TENANT_SLUG=default

# Fallback global de WhatsApp (opcional, cada cliente tiene el suyo en la DB)
NEXT_PUBLIC_WHATSAPP_PHONE=5217471234567

# Fallback global de MercadoPago (opcional, cada cliente tiene el suyo en la DB)
MERCADOPAGO_ACCESS_TOKEN=TEST-XXXXXXXXXXXXXXXXXXXX
```

### Correr localmente

```bash
npm run dev
```

Abre `http://localhost:3000` — usará el tenant con slug `default` (el que creaste en `multitenancy.sql`).

---

## PARTE 4 — Despliegue en Railway

### 4.1 Subir código a GitHub

```bash
git push origin main
```

### 4.2 Crear proyecto en Railway

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Selecciona tu repositorio
3. Railway detecta automáticamente Next.js

### 4.3 Variables de entorno en Railway

Ve a tu proyecto → **Variables** → agrega:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `SUPERADMIN_PASSWORD` | Contraseña para el super admin |
| `DEFAULT_TENANT_SLUG` | `default` |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Número fallback (ej: `5217471234567`) |
| `MERCADOPAGO_ACCESS_TOKEN` | Token fallback de MercadoPago |

> Las variables de WhatsApp y MercadoPago son fallback global. Cada cliente tiene los suyos configurados en la base de datos desde el Super Admin — esos tienen prioridad.

### 4.4 Configurar dominio y subdominios

1. Railway → tu servicio → **Settings → Networking → Custom Domain**
2. Agrega tu dominio raíz: `tudominio.com`
3. Agrega un wildcard: `*.tudominio.com`
4. En tu proveedor de DNS configura ambos apuntando a Railway

Con esto, cada cliente en slug `tiendalaura` automáticamente tiene su tienda en `tiendalaura.tudominio.com`.

---

## PARTE 5 — Qué es el Slug y qué poner

El **slug** es el identificador único de cada cliente y se convierte en su subdominio.

**Ejemplos:**

| Nombre del negocio | Slug sugerido | URL de la tienda |
|---|---|---|
| Tienda de Ropa Laura | `tienda-laura` | `tienda-laura.tudominio.com` |
| Abarrotes Don José | `abarrotes-jose` | `abarrotes-jose.tudominio.com` |
| Farmacia El Ángel | `farmacia-angel` | `farmacia-angel.tudominio.com` |

**Reglas para el slug:**
- Solo letras **minúsculas**, números y guiones (`-`)
- Sin espacios, acentos ni caracteres especiales
- No puede empezar ni terminar con guion
- Debe ser único — dos clientes no pueden tener el mismo slug
- Una vez creado **no cambiar**, porque cambia la URL del cliente

---

## PARTE 6 — Gestión de clientes (Super Admin)

Entra a `tudominio.com/superadmin` con tu contraseña.

### Crear un nuevo cliente

1. **Clientes → Nuevo cliente**
2. Llena los campos:
   - **Nombre del negocio** — el slug se genera automáticamente
   - **Slug** — revisa que quede bien (ver reglas arriba)
   - **Email del administrador** — el email con el que el cliente entra a `/admin`
   - **WhatsApp** — número que recibe los pedidos (con código de país, sin `+`)
   - **MercadoPago Access Token** — token de la cuenta de MercadoPago del cliente
   - **En Vivo** — activa si el cliente contrata esa función
   - **Competencia** — activa si el cliente contrata esa función
3. Guardar → el cliente ya tiene su tienda en `slug.tudominio.com`

### Editar un cliente existente

**Clientes → ícono de lápiz** junto al cliente.

Puedes cambiar en cualquier momento:
- Número de WhatsApp
- Token de MercadoPago
- Activar/desactivar features (En Vivo, Competencia)
- Desactivar la cuenta (la tienda deja de funcionar)

---

## PARTE 7 — MercadoPago por cliente

Cada cliente cobra con **su propia cuenta de MercadoPago**. El dinero va directo a ellos, tú no tocas los pagos.

### Cómo obtener el token de cada cliente

El cliente entra a su cuenta de MercadoPago:
1. [mercadopago.com.mx](https://mercadopago.com.mx) → **Tu negocio → Credenciales**
2. **Pruebas:** Access Token que empieza con `TEST-`
3. **Producción:** Access Token que empieza con `APP_USR-`

El cliente te da ese token y tú lo pegas en **Super Admin → Clientes → [cliente] → MercadoPago**.

### Cómo funciona el webhook

MercadoPago llama a `slug.tudominio.com/api/payments/webhook` cuando se aprueba un pago. El sistema:
1. Busca la orden por su ID (`external_reference`)
2. Identifica a qué tenant pertenece
3. Verifica el pago con el token de ese tenant
4. Marca el pedido como `confirmed`

---

## PARTE 8 — Transmisión en vivo

Usa **YouTube Live** (gratis, sin tarjeta de crédito, sin anuncios en el embed):

1. [studio.youtube.com](https://studio.youtube.com) → **Crear → Iniciar transmisión en directo**
2. En **"Más opciones" → "Latencia"** → selecciona **"Ultra baja latencia"** (~2s de delay)
3. Inicia el stream → copia la URL del video
4. En el panel admin → **"En Vivo"** → pega la URL → **"Publicar transmisión"**
5. Comparte el link `/live` por WhatsApp

> Esta función solo aparece en el panel admin si el Super Admin la activó para ese cliente.

---

## PARTE 9 — Stock en tiempo real

| Momento | Comportamiento |
|---|---|
| Cliente agrega al carrito | Stock NO cambia |
| Cliente termina checkout | Stock baja automáticamente |
| Otro cliente ve la tienda | Ve el stock actualizado en tiempo real |
| Stock llega a 0 | Producto muestra "Agotado", botón desactivado |
| Admin cancela un pedido | Stock se restaura automáticamente |

---

## PARTE 10 — Flujo de compra

```
Cliente ve productos → Agrega al carrito → Llena datos (nombre, teléfono, dirección)
    │
    ├── "Solo por WhatsApp"
    │     → Stock descontado → WhatsApp del cliente abierto con pedido formateado
    │
    └── "Pagar con MercadoPago"
          → Redirige a MercadoPago del cliente → Paga
          → Pantalla de éxito → WhatsApp con confirmación ✅
```

---

## PARTE 11 — Checklist para onboarding de un nuevo cliente

- [ ] Ejecutar los SQLs en Supabase (si es instalación nueva)
- [ ] Crear usuario admin en Supabase Auth con el email del cliente
- [ ] En Super Admin → **Nuevo cliente**:
  - [ ] Nombre y slug (ver reglas de slug)
  - [ ] Email del admin
  - [ ] Número de WhatsApp (con código de país, sin `+`)
  - [ ] Token de MercadoPago del cliente
  - [ ] Activar features según el plan contratado
- [ ] Apuntar el subdominio `slug.tudominio.com` a Railway en el DNS
- [ ] Entrar al admin del cliente (`slug.tudominio.com/admin`) y cargar productos
- [ ] Hacer una compra de prueba y verificar que llega al WhatsApp correcto

---

## Archivos importantes

| Archivo | Función |
|---|---|
| `supabase/schema.sql` | Tablas principales + RLS + Storage |
| `supabase/promotions.sql` | Tabla de promociones |
| `supabase/settings.sql` | Configuración de tienda (key-value) |
| `supabase/multitenancy.sql` | Tabla tenants + columnas tenant_id en todas las tablas |
| `supabase/add_mercadopago_token.sql` | Columna mercadopago_access_token en tenants |
| `src/middleware.ts` | Extrae slug del subdominio → header x-tenant-slug |
| `src/lib/tenant.ts` | getTenantBySlug() con caché de 60s |
| `src/lib/supabase/service.ts` | Cliente Supabase con service_role (solo superadmin) |
| `src/app/api/superadmin/tenants/` | CRUD de tenants |
| `src/app/superadmin/(panel)/clients/` | UI de gestión de clientes |
| `src/app/api/payments/create/route.ts` | Crea preferencia MercadoPago con token del tenant |
| `src/app/api/payments/webhook/route.ts` | Verifica pago con token del tenant correcto |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                          ← Tienda pública con realtime
│   ├── live/page.tsx                     ← Transmisión en vivo
│   ├── cart/page.tsx                     ← Carrito + checkout
│   ├── payment/success/page.tsx          ← Éxito de pago + WhatsApp
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── (protected)/
│   │       ├── dashboard/page.tsx        ← Stats + ranking (por tenant)
│   │       ├── products/                 ← CRUD productos (por tenant)
│   │       ├── orders/page.tsx           ← Pedidos (por tenant)
│   │       ├── promotions/               ← Promociones (por tenant)
│   │       ├── live/page.tsx             ← Control de transmisión (si feature activa)
│   │       └── competencia/page.tsx      ← Comparador de precios (si feature activa)
│   ├── superadmin/
│   │   ├── login/page.tsx
│   │   └── (panel)/
│   │       ├── clients/                  ← Gestión de todos los clientes ✨
│   │       └── settings/page.tsx         ← Config del tenant por defecto
│   └── api/                              ← REST API (todas las rutas filtran por tenant_id)
├── components/
│   ├── store/                            ← ProductCard, ImageCarousel, FloatingCart, LiveBanner
│   ├── cart/                             ← CheckoutForm (lee WhatsApp del tenant)
│   ├── admin/                            ← Sidebar (muestra/oculta items según features activas)
│   └── ui/                              ← Button, Input, Badge
├── lib/
│   ├── tenant.ts                         ← getTenantBySlug(), getTenantSlugFromRequest()
│   ├── settings.ts                       ← StoreSettings con whatsapp_phone y feature flags
│   ├── whatsapp.ts                       ← Generador de mensajes WhatsApp
│   └── supabase/
│       ├── client.ts                     ← Cliente browser
│       ├── server.ts                     ← Cliente servidor (con cookies)
│       └── service.ts                    ← Cliente service_role (solo superadmin)
├── store/cartStore.ts                    ← Zustand con persistencia localStorage
└── middleware.ts                         ← Extrae tenant del subdominio, protege /admin y /superadmin
```
