# Tienda WhatsApp

Tienda online donde los clientes pueden ver productos, agregar al carrito y pagar por **WhatsApp Business** o **MercadoPago**. Incluye panel de administración, transmisiones en vivo y stock en tiempo real.

## Paneles incluidos

| Panel | URL | Para quién |
|---|---|---|
| Tienda pública | `/` | Clientes |
| Admin | `/admin` | Dueño de la tienda |
| Super Admin | `/superadmin` | Desarrollador |
| Transmisión en vivo | `/live` | Clientes durante live |

## Stack

Next.js 16 · TypeScript · Tailwind CSS · Supabase · Zustand · MercadoPago SDK v2

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

### 2.2 Ejecutar SQL (en este orden)

Ve a **SQL Editor** y ejecuta los archivos uno por uno:

1. `supabase/schema.sql` — tablas principales: products, orders, order_items, storage
2. `supabase/promotions.sql` — tabla de promociones
3. `supabase/settings.sql` — configuración de la tienda (nombre, bienvenida, footer)
4. SQL para activar stock en tiempo real:

```sql
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

### 2.3 Obtener credenciales

En Supabase → **Settings → API**:
- `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.4 Crear usuario admin de la tienda

En Supabase → **Authentication → Users → Add user**:
- Email: correo del dueño (ej: `admin@mitienda.com`)
- Password: contraseña segura
- Marca **"Auto Confirm User"**

Este usuario accede al panel `/admin` para gestionar productos, pedidos y promociones.

---

## PARTE 3 — Variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# WhatsApp Business (código de país + número, sin + ni espacios)
# México: 521 + 10 dígitos → 5217471234567
NEXT_PUBLIC_WHATSAPP_PHONE=5217471234567

# MercadoPago — obtener en mercadopago.com.mx → Credenciales
# Pruebas: token que empieza con TEST-
# Producción: token real sin TEST-
MERCADOPAGO_ACCESS_TOKEN=TEST-XXXXXXXXXXXXXXXXXXXX

# URL pública de la app (en local: http://localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Contraseña del Super Admin (la defines tú)
SUPERADMIN_PASSWORD=elige-una-contraseña-segura
```

### Correr localmente

```bash
npm run dev
```

Abre `http://localhost:3000`

---

## PARTE 4 — Despliegue en Railway

### 4.1 Subir código a GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 4.2 Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Selecciona tu repositorio
3. Railway detecta automáticamente Next.js

### 4.3 Variables de entorno en Railway

Ve a tu proyecto → **Variables** → agrega:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Número WhatsApp (ej: `5217471234567`) |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de MercadoPago |
| `NEXT_PUBLIC_APP_URL` | URL de Railway (ej: `https://tienda-xxx.up.railway.app`) |
| `SUPERADMIN_PASSWORD` | Contraseña para el panel de desarrollador |

> Cada vez que cambies una variable Railway hace redeploy automático.

### 4.4 Obtener dominio

Railway → tu servicio → **Settings → Networking → Generate Domain**  
Copia esa URL y ponla en `NEXT_PUBLIC_APP_URL` (sin `/` al final).

---

## PARTE 5 — MercadoPago

### Pruebas (sandbox)
1. [mercadopago.com.mx](https://mercadopago.com.mx) → **Panel de desarrollador → Credenciales de prueba**
2. Copia el Access Token que empieza con `TEST-`

### Producción (cobros reales)
1. MercadoPago → **Credenciales de producción**
2. Copia el Access Token real (no empieza con `TEST-`)
3. Actualiza `MERCADOPAGO_ACCESS_TOKEN` en Railway

---

## PARTE 6 — Accesos a los paneles

### Panel Admin `/admin`
- URL: `https://tu-dominio.railway.app/admin/login`
- Credenciales: el usuario creado en el paso 2.4
- Funciones: productos, pedidos, promociones, estadísticas, transmisión en vivo

### Panel Super Admin `/superadmin`
- URL: `https://tu-dominio.railway.app/superadmin/login`
- Contraseña: la que pusiste en `SUPERADMIN_PASSWORD`
- Funciones: nombre de tienda, mensaje de bienvenida, footer

---

## PARTE 7 — Transmisión en vivo

El sistema usa **YouTube Live** (gratis, sin tarjeta de crédito, sin anuncios en el embed):

1. Abre [studio.youtube.com](https://studio.youtube.com)
2. **Crear → Iniciar transmisión en directo**
3. En **"Más opciones" → "Latencia"** → selecciona **"Ultra baja latencia"** (~2s de delay)
4. Inicia el stream → copia la URL del video (ej: `youtube.com/watch?v=XXXX`)
5. En el panel admin → **"En Vivo"** → pega la URL → **"Publicar transmisión"**
6. Comparte el link `/live` por WhatsApp — los clientes ven el stream con productos al lado

---

## PARTE 8 — Stock en tiempo real

El stock funciona así:

| Momento | Comportamiento |
|---|---|
| Cliente agrega al carrito | Stock NO cambia |
| Cliente termina checkout | Stock baja automáticamente |
| Otro cliente ve la tienda | Ve el stock actualizado en tiempo real |
| Stock llega a 0 | Producto muestra "Agotado", botón desactivado |
| Admin cancela un pedido | Stock se restaura automáticamente |

El SQL del paso 2.2 activa la sincronización en tiempo real (Supabase Realtime).

---

## PARTE 9 — Flujo de compra

```
Cliente ve productos → Agrega al carrito → Llena datos (nombre, teléfono, dirección)
    │
    ├── "Solo por WhatsApp"
    │     → Stock descontado → WhatsApp abierto con pedido formateado
    │
    └── "Pagar con MercadoPago"
          → Overlay de carga → Redirige a MercadoPago → Paga
          → Pantalla de éxito con cuenta regresiva 5s
          → WhatsApp abierto con confirmación de pago ✅
```

---

## PARTE 10 — Checklist para nuevo cliente

- [ ] Crear proyecto en Supabase
- [ ] Ejecutar los 4 SQLs (schema, promotions, settings, realtime)
- [ ] Crear usuario admin con email del cliente
- [ ] Crear proyecto en Railway conectado al repo de GitHub
- [ ] Agregar las 6 variables de entorno en Railway
- [ ] Configurar `NEXT_PUBLIC_WHATSAPP_PHONE` con el número del cliente
- [ ] Agregar token de MercadoPago del cliente
- [ ] Entrar a Super Admin → personalizar nombre, bienvenida y footer
- [ ] Entrar a Admin → cargar los primeros productos con fotos

---

## Archivos importantes

| Archivo | Función |
|---|---|
| `supabase/schema.sql` | Tablas principales + RLS + Storage |
| `supabase/promotions.sql` | Tabla de promociones |
| `supabase/settings.sql` | Configuración de la tienda |
| `src/middleware.ts` | Protege rutas `/admin` y `/superadmin` |
| `src/app/api/orders/route.ts` | Crea pedidos y descuenta stock |
| `src/app/api/orders/[id]/route.ts` | Cambia estado y restaura stock al cancelar |
| `src/app/api/payments/create/route.ts` | Crea preferencia MercadoPago |
| `src/app/api/superadmin/auth/route.ts` | Login superadmin por cookie (sin Supabase) |
| `src/app/api/live/route.ts` | Gestiona sesión de transmisión en vivo |
| `nixpacks.toml` | Fuerza Node 20 en Railway |
| `.env.local.example` | Plantilla de variables de entorno |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                          ← Tienda pública con realtime
│   ├── live/page.tsx                     ← Página de transmisión en vivo
│   ├── cart/page.tsx                     ← Carrito + checkout
│   ├── payment/success/page.tsx          ← Éxito de pago + countdown WhatsApp
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── (protected)/
│   │       ├── dashboard/page.tsx        ← Estadísticas + ranking
│   │       ├── products/                 ← CRUD productos
│   │       ├── orders/page.tsx           ← Gestión de pedidos
│   │       ├── promotions/               ← CRUD promociones
│   │       └── live/page.tsx             ← Control de transmisión en vivo
│   ├── superadmin/
│   │   ├── login/page.tsx                ← Login por contraseña (sin Supabase)
│   │   └── (panel)/settings/page.tsx    ← Configuración de tienda
│   └── api/                              ← REST API completa
├── components/
│   ├── store/                            ← ProductCard, FloatingCart, LiveBanner...
│   ├── cart/                             ← CheckoutForm
│   ├── admin/                            ← Sidebar, StatsCard...
│   └── ui/                              ← Button, Input, Badge...
├── store/cartStore.ts                    ← Zustand con persistencia en localStorage
├── lib/whatsapp.ts                       ← Generador de mensajes WhatsApp
└── middleware.ts                         ← Auth guard para admin y superadmin
```
