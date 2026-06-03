'use client'

import { useState } from 'react'
import {
  BookOpen,
  Download,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Search,
  User,
  CreditCard,
  LayoutDashboard,
  Package,
  ClipboardList,
  Tag,
  MessageSquare,
  Settings,
  Video,
  BarChart3,
  Users,
  Bot,
  ArrowLeft,
  Menu,
  X,
  Smartphone,
  Globe,
  Shield,
  Truck,
  Store,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Section {
  id: string
  title: string
  icon: React.ReactNode
  subsections?: { id: string; title: string }[]
}

/* ------------------------------------------------------------------ */
/*  Table of contents definition                                       */
/* ------------------------------------------------------------------ */
const TOC: Section[] = [
  {
    id: 'introduccion',
    title: 'Introduccion',
    icon: <BookOpen className="w-5 h-5" />,
    subsections: [
      { id: 'que-es', title: 'Que es Tienda WhatsApp' },
      { id: 'roles', title: 'Roles de usuario' },
      { id: 'requisitos', title: 'Requisitos del sistema' },
    ],
  },
  {
    id: 'cliente',
    title: 'Guia del Cliente (Comprador)',
    icon: <ShoppingCart className="w-5 h-5" />,
    subsections: [
      { id: 'explorar-tienda', title: 'Explorar la tienda' },
      { id: 'buscar-productos', title: 'Buscar y filtrar productos' },
      { id: 'detalle-producto', title: 'Ver detalle de un producto' },
      { id: 'carrito', title: 'Usar el carrito de compras' },
      { id: 'checkout-whatsapp', title: 'Checkout por WhatsApp' },
      { id: 'checkout-mercadopago', title: 'Checkout por MercadoPago' },
      { id: 'promociones-cliente', title: 'Ver promociones' },
      { id: 'live-cliente', title: 'Ver transmision en vivo' },
      { id: 'bot-whatsapp-cliente', title: 'Comprar por WhatsApp Bot' },
    ],
  },
  {
    id: 'admin',
    title: 'Guia del Administrador',
    icon: <LayoutDashboard className="w-5 h-5" />,
    subsections: [
      { id: 'admin-login', title: 'Iniciar sesion' },
      { id: 'admin-dashboard', title: 'Dashboard y metricas' },
      { id: 'admin-productos', title: 'Gestion de productos' },
      { id: 'admin-pedidos', title: 'Gestion de pedidos' },
      { id: 'admin-promociones', title: 'Gestion de promociones' },
      { id: 'admin-whatsapp', title: 'Configuracion del Bot WhatsApp' },
      { id: 'admin-conversaciones', title: 'Conversaciones de WhatsApp' },
      { id: 'admin-live', title: 'Transmision en vivo' },
      { id: 'admin-competencia', title: 'Monitor de competencia' },
      { id: 'admin-config', title: 'Configuracion de la tienda' },
    ],
  },
  {
    id: 'superadmin',
    title: 'Guia del SuperAdmin',
    icon: <Shield className="w-5 h-5" />,
    subsections: [
      { id: 'super-login', title: 'Acceso al panel SuperAdmin' },
      { id: 'super-clientes', title: 'Gestion de clientes (tenants)' },
      { id: 'super-features', title: 'Activar/desactivar funcionalidades' },
    ],
  },
  {
    id: 'bot',
    title: 'Bot de WhatsApp (Detalle)',
    icon: <Bot className="w-5 h-5" />,
    subsections: [
      { id: 'bot-menu', title: 'Menu principal del bot' },
      { id: 'bot-productos', title: 'Comprar productos por chat' },
      { id: 'bot-promociones', title: 'Promociones en el bot' },
      { id: 'bot-pedidos', title: 'Consultar pedidos' },
      { id: 'bot-mandaditos', title: 'Solicitar mandaditos' },
      { id: 'bot-soporte', title: 'Contactar soporte' },
      { id: 'bot-flujos', title: 'Flujos personalizados' },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos e Integraciones',
    icon: <CreditCard className="w-5 h-5" />,
    subsections: [
      { id: 'pago-whatsapp', title: 'Pago por WhatsApp' },
      { id: 'pago-mercadopago', title: 'Pago por MercadoPago' },
      { id: 'seguridad-pagos', title: 'Seguridad en los pagos' },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas frecuentes',
    icon: <MessageSquare className="w-5 h-5" />,
  },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ManualPage() {
  const [tocOpen, setTocOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(TOC.map((s) => s.id)),
  )

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTocOpen(false)
  }

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-white">
      {/* ---- Print-specific styles ---- */}
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .manual-content { max-width: 100% !important; padding: 0 !important; }
          .manual-content h2 { page-break-after: avoid; }
          .manual-content h3 { page-break-after: avoid; }
          .manual-content table { page-break-inside: avoid; }
          .manual-content .info-box { page-break-inside: avoid; }
          a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>

      {/* ---- Top bar (hidden on print) ---- */}
      <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <BookOpen className="w-6 h-6 text-green-600" />
            <h1 className="text-lg font-bold text-gray-900">Manual de Usuario</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {tocOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* ---- Sidebar TOC (hidden on print) ---- */}
        <aside
          className={`no-print fixed lg:sticky top-[57px] left-0 z-40 h-[calc(100vh-57px)] w-72 bg-white border-r border-gray-200 overflow-y-auto transition-transform lg:transition-none lg:translate-x-0 ${tocOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <nav className="p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Contenido
            </p>
            {TOC.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => {
                    if (section.subsections) toggleSection(section.id)
                    else scrollTo(section.id)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                >
                  {section.icon}
                  <span className="flex-1 text-left">{section.title}</span>
                  {section.subsections &&
                    (expandedSections.has(section.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ))}
                </button>
                {section.subsections && expandedSections.has(section.id) && (
                  <div className="ml-7 border-l border-gray-200 pl-3 space-y-0.5 mt-1">
                    {section.subsections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => scrollTo(sub.id)}
                        className="w-full text-left px-2 py-1.5 text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* ---- Overlay for mobile TOC ---- */}
        {tocOpen && (
          <div className="no-print fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setTocOpen(false)} />
        )}

        {/* ---- Main content ---- */}
        <main className="manual-content flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
          {/* ============================================================ */}
          {/*  COVER                                                        */}
          {/* ============================================================ */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-6">
              <Store className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Tienda WhatsApp
            </h1>
            <p className="text-xl text-gray-500 mb-2">Manual de Usuario Completo</p>
            <p className="text-sm text-gray-400">
              Version 1.0 &mdash; Junio 2026
            </p>
          </div>

          {/* ============================================================ */}
          {/*  1. INTRODUCCION                                              */}
          {/* ============================================================ */}
          <SectionHeading id="introduccion" icon={<BookOpen />} title="1. Introduccion" />

          <SubHeading id="que-es" title="1.1 Que es Tienda WhatsApp" />
          <P>
            <b>Tienda WhatsApp</b> es una plataforma de comercio electronico disenada para
            que negocios de cualquier tamano puedan vender sus productos en linea y
            gestionar los pedidos a traves de WhatsApp. La plataforma combina una tienda
            web moderna y responsiva con un bot automatizado de WhatsApp que permite a los
            clientes explorar productos, agregarlos al carrito y completar compras
            directamente desde su celular.
          </P>
          <InfoBox title="Caracteristicas principales">
            <ul className="list-disc ml-5 space-y-1">
              <li>Tienda en linea responsiva (se adapta a celular y computadora)</li>
              <li>Carrito de compras persistente (no se pierde al cerrar la pagina)</li>
              <li>Checkout por WhatsApp o MercadoPago (tarjetas, OXXO, transferencia)</li>
              <li>Bot automatizado de WhatsApp para ventas 24/7</li>
              <li>Panel de administracion completo con metricas y reportes</li>
              <li>Gestion de productos, pedidos, promociones y transmisiones en vivo</li>
              <li>Monitor de precios de la competencia</li>
              <li>Arquitectura multi-tenant (multiples tiendas independientes)</li>
            </ul>
          </InfoBox>

          <SubHeading id="roles" title="1.2 Roles de usuario" />
          <P>El sistema tiene tres roles principales:</P>
          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Rol</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Descripcion</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Acceso</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" /> Cliente
                    </span>
                  </td>
                  <td className="p-3 border border-gray-200">
                    Persona que visita la tienda, explora productos y realiza compras.
                  </td>
                  <td className="p-3 border border-gray-200">
                    Pagina principal de la tienda. No requiere cuenta ni contrasena.
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-green-500" /> Administrador
                    </span>
                  </td>
                  <td className="p-3 border border-gray-200">
                    Dueno de la tienda. Gestiona productos, pedidos, promociones, bot y
                    configuracion.
                  </td>
                  <td className="p-3 border border-gray-200">
                    Panel en <code>/admin</code>. Requiere email y contrasena.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" /> SuperAdmin
                    </span>
                  </td>
                  <td className="p-3 border border-gray-200">
                    Dueno de la plataforma. Gestiona multiples tiendas (tenants) y
                    controla funcionalidades globales.
                  </td>
                  <td className="p-3 border border-gray-200">
                    Panel en <code>/superadmin</code>. Requiere contrasena maestra.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading id="requisitos" title="1.3 Requisitos del sistema" />
          <InfoBox title="Para usar la tienda (clientes)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Navegador web moderno (Chrome, Firefox, Safari, Edge)</li>
              <li>Conexion a internet</li>
              <li>WhatsApp instalado en el celular (para finalizar compra por WhatsApp)</li>
            </ul>
          </InfoBox>
          <InfoBox title="Para administrar la tienda">
            <ul className="list-disc ml-5 space-y-1">
              <li>Navegador web moderno en computadora o tablet</li>
              <li>Credenciales de acceso (email y contrasena proporcionados)</li>
              <li>Conexion a internet estable</li>
            </ul>
          </InfoBox>

          {/* ============================================================ */}
          {/*  2. GUIA DEL CLIENTE                                          */}
          {/* ============================================================ */}
          <SectionHeading id="cliente" icon={<ShoppingCart />} title="2. Guia del Cliente (Comprador)" print />

          <SubHeading id="explorar-tienda" title="2.1 Explorar la tienda" />
          <P>
            Al ingresar a la tienda veras la pagina principal con todos los productos
            disponibles organizados en una cuadricula. En dispositivos moviles se muestran
            2 columnas y en computadora 3 o 4 columnas.
          </P>
          <StepList
            steps={[
              'Abre tu navegador y visita la direccion de la tienda (ejemplo: mitienda.com).',
              'Veras un banner de bienvenida con el nombre de la tienda y un mensaje personalizado.',
              'Debajo del banner aparecen las promociones activas (si existen) en un carrusel horizontal.',
              'A continuacion se muestra la barra de categorias para filtrar productos.',
              'Finalmente veras la cuadricula de productos con imagen, nombre, precio y boton de agregar al carrito.',
            ]}
          />
          <Tip>
            Si la tienda tiene una transmision en vivo activa, veras un banner rojo con el
            texto &quot;EN VIVO&quot; en la parte superior. Puedes hacer clic para ver la
            transmision.
          </Tip>

          <SubHeading id="buscar-productos" title="2.2 Buscar y filtrar productos" />
          <P>
            La tienda ofrece dos formas de encontrar productos rapidamente:
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Busqueda por texto</h4>
          <StepList
            steps={[
              'Localiza la barra de busqueda en la parte superior de la pagina.',
              'Escribe el nombre o descripcion del producto que buscas.',
              'Los resultados se actualizan en tiempo real mientras escribes.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Filtro por categoria</h4>
          <StepList
            steps={[
              'Debajo de la barra de busqueda veras botones con las categorias disponibles.',
              'Haz clic en una categoria para ver solo los productos de esa categoria.',
              'Para ver todos los productos nuevamente, haz clic en la categoria seleccionada para deseleccionarla.',
            ]}
          />
          <Tip>
            En dispositivos moviles, la barra de categorias se queda fija mientras haces
            scroll, para que siempre puedas cambiar de categoria facilmente.
          </Tip>

          <SubHeading id="detalle-producto" title="2.3 Ver detalle de un producto" />
          <P>
            Para ver informacion completa de un producto:
          </P>
          <StepList
            steps={[
              'Haz clic en la imagen o nombre del producto en la cuadricula.',
              'Se abrira la pagina de detalle del producto con:',
            ]}
          />
          <ul className="list-disc ml-10 space-y-1 text-gray-600 mb-4">
            <li><b>Imagenes:</b> Galeria con multiples fotos del producto. Desliza para ver todas.</li>
            <li><b>Precio:</b> Precio actual y, si tiene descuento, el precio original tachado con el porcentaje de ahorro.</li>
            <li><b>Descripcion:</b> Texto detallado del producto.</li>
            <li><b>Atributos:</b> Para ropa se muestran colores, tallas, genero, material y tabla de medidas.</li>
            <li><b>Disponibilidad:</b> Indicador de stock disponible o agotado.</li>
            <li><b>Boton &quot;Agregar al carrito&quot;:</b> Para agregar el producto a tu carrito. Se desactiva si no hay stock.</li>
            <li><b>Boton de compartir:</b> Permite compartir el producto por WhatsApp o copiar el enlace.</li>
          </ul>

          <SubHeading id="carrito" title="2.4 Usar el carrito de compras" />
          <P>
            El carrito de compras te permite acumular productos antes de comprar. Se guarda
            en tu navegador, asi que no se pierde si cierras la pagina.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Agregar productos</h4>
          <StepList
            steps={[
              'En la cuadricula de productos, haz clic en el boton verde &quot;+&quot; o &quot;Agregar&quot; del producto deseado.',
              'Tambien puedes agregar desde la pagina de detalle del producto.',
              'Veras una notificacion confirmando que el producto fue agregado.',
              'El contador del carrito (esquina superior derecha) se actualizara.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Ver y editar el carrito</h4>
          <StepList
            steps={[
              'Haz clic en el icono del carrito (esquina superior derecha o boton flotante en movil).',
              'Veras la lista de productos agregados con imagen, nombre, precio y cantidad.',
              'Usa los botones &quot;+&quot; y &quot;-&quot; para ajustar la cantidad de cada producto.',
              'Haz clic en el icono de basura para eliminar un producto completamente.',
              'Usa el boton &quot;Vaciar carrito&quot; para eliminar todos los productos.',
            ]}
          />
          <Warning>
            El carrito se guarda localmente en tu navegador. Si limpias los datos del
            navegador o usas otro dispositivo, el carrito estara vacio.
          </Warning>

          <SubHeading id="checkout-whatsapp" title="2.5 Checkout por WhatsApp" />
          <P>
            Esta es la forma mas sencilla de completar tu compra. El pedido se envia
            directamente al WhatsApp del vendedor.
          </P>
          <StepList
            steps={[
              'Abre tu carrito y verifica que los productos y cantidades sean correctos.',
              'En la seccion &quot;Datos de envio&quot; llena los campos:',
            ]}
          />
          <ul className="list-disc ml-10 space-y-1 text-gray-600 mb-4">
            <li><b>Nombre completo:</b> Tu nombre para identificar el pedido.</li>
            <li><b>Telefono:</b> Numero de 10 digitos para que el vendedor te contacte.</li>
            <li><b>Direccion de entrega:</b> Calle, numero, colonia y ciudad donde recibiras tu pedido.</li>
          </ul>
          <StepList
            start={3}
            steps={[
              'Haz clic en el boton verde &quot;Pagar en WhatsApp&quot; (o &quot;Solo por WhatsApp&quot;).',
              'Se abrira WhatsApp automaticamente con un mensaje preformateado que incluye tu pedido completo.',
              'Envia el mensaje al vendedor. El te confirmara la disponibilidad y el metodo de pago.',
            ]}
          />
          <InfoBox title="Que incluye el mensaje de WhatsApp">
            <ul className="list-disc ml-5 space-y-1">
              <li>Lista de productos con cantidades y precios</li>
              <li>Total del pedido</li>
              <li>Tu nombre, telefono y direccion de entrega</li>
              <li>Numero de orden para seguimiento</li>
            </ul>
          </InfoBox>

          <SubHeading id="checkout-mercadopago" title="2.6 Checkout por MercadoPago" />
          <P>
            Si la tienda tiene habilitado MercadoPago, puedes pagar con tarjeta de
            credito, debito, OXXO o transferencia bancaria.
          </P>
          <StepList
            steps={[
              'Llena los datos de envio (nombre, telefono, direccion) igual que en el checkout de WhatsApp.',
              'Haz clic en el boton azul &quot;Pagar con MercadoPago&quot;.',
              'Seras redirigido a la pagina segura de MercadoPago.',
              'Selecciona tu metodo de pago preferido:',
            ]}
          />
          <ul className="list-disc ml-10 space-y-1 text-gray-600 mb-4">
            <li><b>Tarjeta de credito o debito:</b> Ingresa los datos de tu tarjeta.</li>
            <li><b>OXXO:</b> Recibiras un numero de referencia para pagar en cualquier OXXO.</li>
            <li><b>Transferencia bancaria:</b> Se generara una CLABE para que hagas la transferencia.</li>
          </ul>
          <StepList
            start={5}
            steps={[
              'Completa el pago en MercadoPago.',
              'Seras redirigido a una pagina de confirmacion con los detalles de tu orden.',
              'El vendedor recibira una notificacion automatica de tu pedido y pago.',
            ]}
          />
          <Warning>
            El servidor verifica los precios al momento del pago. Si un precio cambio
            desde que agregaste el producto al carrito, se usara el precio actualizado.
          </Warning>

          <SubHeading id="promociones-cliente" title="2.7 Ver promociones" />
          <P>
            Las promociones activas se muestran en un banner horizontal en la pagina
            principal, justo debajo del mensaje de bienvenida. Cada promocion puede
            incluir:
          </P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Imagen promocional personalizada</li>
            <li>Titulo y descripcion de la oferta</li>
            <li>Etiqueta de descuento (ejemplo: &quot;-30%&quot;, &quot;2x1&quot;)</li>
            <li>Precio especial (si aplica)</li>
            <li>Fecha de vigencia (las promociones expiran automaticamente)</li>
          </ul>

          <SubHeading id="live-cliente" title="2.8 Ver transmision en vivo" />
          <P>
            Si el administrador inicia una transmision en vivo por YouTube, podras verla
            directamente en la tienda.
          </P>
          <StepList
            steps={[
              'Cuando haya una transmision activa, veras un banner rojo &quot;EN VIVO&quot; en la pagina principal.',
              'Haz clic en el banner para ir a la pagina de transmision.',
              'Veras el video de YouTube en vivo a la izquierda y el catalogo de productos a la derecha.',
              'Puedes agregar productos al carrito mientras ves la transmision.',
              'Un temporizador muestra cuanto tiempo lleva la transmision activa.',
            ]}
          />

          <SubHeading id="bot-whatsapp-cliente" title="2.9 Comprar por WhatsApp Bot" />
          <P>
            Si la tienda tiene un bot de WhatsApp configurado, puedes comprar directamente
            desde WhatsApp sin necesidad de abrir la pagina web.
          </P>
          <StepList
            steps={[
              'Envia un mensaje al numero de WhatsApp de la tienda.',
              'El bot te saludara con un mensaje de bienvenida y un menu interactivo.',
              'Selecciona &quot;Productos&quot; para ver los articulos disponibles.',
              'Elige un producto y agregalo al carrito.',
              'Cuando estes listo, selecciona &quot;Finalizar compra&quot;.',
              'El bot te pedira tu nombre y direccion de entrega.',
              'Recibiras un resumen del pedido con el total a pagar.',
            ]}
          />
          <Tip>
            La seccion &quot;Bot de WhatsApp (Detalle)&quot; mas adelante en este manual
            explica todas las opciones del bot en profundidad.
          </Tip>

          {/* ============================================================ */}
          {/*  3. GUIA DEL ADMINISTRADOR                                    */}
          {/* ============================================================ */}
          <SectionHeading id="admin" icon={<LayoutDashboard />} title="3. Guia del Administrador" print />

          <SubHeading id="admin-login" title="3.1 Iniciar sesion" />
          <StepList
            steps={[
              'Abre tu navegador y ve a la direccion de tu tienda seguido de /admin (ejemplo: mitienda.com/admin).',
              'Ingresa tu correo electronico y contrasena.',
              'Haz clic en &quot;Iniciar sesion&quot;.',
              'Seras redirigido al Dashboard del panel de administracion.',
            ]}
          />
          <Warning>
            Si olvidaste tu contrasena, contacta al SuperAdmin de la plataforma para que
            la restablezca.
          </Warning>

          <SubHeading id="admin-dashboard" title="3.2 Dashboard y metricas" />
          <P>
            El Dashboard es la pagina principal del panel de administracion. Aqui puedes
            ver un resumen del rendimiento de tu tienda.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Selector de periodo</h4>
          <P>
            En la parte superior encontraras tres botones para cambiar el periodo de las
            metricas:
          </P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li><b>Hoy:</b> Datos del dia actual comparados con ayer.</li>
            <li><b>Semana:</b> Datos de la semana actual comparados con la semana anterior.</li>
            <li><b>Mes:</b> Datos del mes actual comparados con el mes anterior.</li>
          </ul>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Tarjetas de indicadores (KPIs)</h4>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Indicador</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Que muestra</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">Ingresos</td>
                  <td className="p-3 border border-gray-200">Total de ventas en el periodo seleccionado, con porcentaje de cambio respecto al periodo anterior.</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">Pedidos</td>
                  <td className="p-3 border border-gray-200">Numero total de pedidos recibidos y comparacion con el periodo anterior.</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-medium">Ticket promedio</td>
                  <td className="p-3 border border-gray-200">Valor promedio de cada pedido (ingresos / numero de pedidos).</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">WhatsApp</td>
                  <td className="p-3 border border-gray-200">Cantidad de mensajes entrantes y salientes de WhatsApp.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Graficos y rankings</h4>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li><b>Ingresos por dia:</b> Grafico de barras mostrando las ventas diarias del periodo.</li>
            <li><b>Pedidos por estado:</b> Distribucion visual de pedidos (Pendiente, Confirmado, Enviado, Entregado, Cancelado).</li>
            <li><b>Productos mas vendidos:</b> Ranking con imagen del producto, unidades vendidas e ingresos generados.</li>
          </ul>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Exportar reportes</h4>
          <StepList
            steps={[
              'Haz clic en &quot;Exportar Excel&quot; para descargar las metricas en formato XLS.',
              'Haz clic en &quot;Exportar PDF&quot; para abrir el dialogo de impresion y guardar como PDF.',
            ]}
          />

          <SubHeading id="admin-productos" title="3.3 Gestion de productos" />
          <P>
            Desde la seccion <b>Productos</b> del menu lateral puedes crear, editar y
            eliminar los productos de tu tienda.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Crear un producto nuevo</h4>
          <StepList
            steps={[
              'En el menu lateral haz clic en &quot;Productos&quot;.',
              'Haz clic en el boton &quot;Nuevo producto&quot; (esquina superior derecha).',
              'Completa el formulario con la informacion del producto:',
            ]}
          />
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Campo</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Descripcion</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Obligatorio</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Nombre</td><td className="p-3 border border-gray-200">Nombre del producto tal como lo veran los clientes.</td><td className="p-3 border border-gray-200">Si</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Descripcion</td><td className="p-3 border border-gray-200">Texto descriptivo del producto.</td><td className="p-3 border border-gray-200">No</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Precio</td><td className="p-3 border border-gray-200">Precio de venta actual.</td><td className="p-3 border border-gray-200">Si</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Precio original</td><td className="p-3 border border-gray-200">Precio anterior (si tiene descuento). Se mostrara tachado.</td><td className="p-3 border border-gray-200">No</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Stock</td><td className="p-3 border border-gray-200">Cantidad disponible. Se descuenta automaticamente con cada venta.</td><td className="p-3 border border-gray-200">Si</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Categoria</td><td className="p-3 border border-gray-200">Texto libre para agrupar productos (ej: Playeras, Accesorios).</td><td className="p-3 border border-gray-200">No</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Tipo de producto</td><td className="p-3 border border-gray-200">General, Ropa, Electronica, Calzado o Accesorio.</td><td className="p-3 border border-gray-200">Si</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Imagenes</td><td className="p-3 border border-gray-200">Una o varias fotos del producto. Se suben al servidor.</td><td className="p-3 border border-gray-200">Si</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Activo</td><td className="p-3 border border-gray-200">Si esta activo, se muestra en la tienda. Si no, queda oculto.</td><td className="p-3 border border-gray-200">Si</td></tr>
              </tbody>
            </table>
          </div>
          <StepList
            start={4}
            steps={[
              'Si el tipo de producto es &quot;Ropa&quot;, aparecen campos adicionales: colores, tallas (XS-XL), genero, material y guia de medidas (pecho, cintura, cadera, largo, entrepierna).',
              'Haz clic en &quot;Guardar producto&quot; para crear el producto.',
              'El producto aparecera en la lista y, si esta activo, tambien en la tienda publica.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Editar un producto</h4>
          <StepList
            steps={[
              'En la lista de productos, haz clic en el boton de editar (icono de lapiz) junto al producto.',
              'Modifica los campos que necesites.',
              'Haz clic en &quot;Guardar cambios&quot;.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Eliminar un producto</h4>
          <StepList
            steps={[
              'En la lista de productos, haz clic en el boton de eliminar (icono de basura).',
              'Confirma la eliminacion en el dialogo que aparece.',
              'El producto sera eliminado permanentemente.',
            ]}
          />
          <Warning>
            La eliminacion de productos es permanente y no se puede deshacer. Considera
            desactivar el producto en lugar de eliminarlo si podrias necesitarlo en el
            futuro.
          </Warning>

          <SubHeading id="admin-pedidos" title="3.4 Gestion de pedidos" />
          <P>
            La seccion <b>Pedidos</b> muestra todos los pedidos recibidos en tu tienda.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Ver pedidos</h4>
          <P>
            La lista de pedidos muestra para cada uno:
          </P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Nombre del cliente y numero de telefono</li>
            <li>Direccion de entrega</li>
            <li>Fecha del pedido</li>
            <li>Total del pedido</li>
            <li>Estado actual con badge de color</li>
          </ul>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Ver detalle de un pedido</h4>
          <StepList
            steps={[
              'Haz clic en cualquier pedido de la lista para expandir sus detalles.',
              'Veras la lista detallada de productos: nombre, cantidad, precio unitario y subtotal.',
              'El total del pedido se muestra al final.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Cambiar estado de un pedido</h4>
          <P>Los estados disponibles y su significado:</P>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Estado</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Significado</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Color</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Pendiente</td><td className="p-3 border border-gray-200">El pedido fue recibido pero no ha sido procesado.</td><td className="p-3 border border-gray-200"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Amarillo</span></td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Confirmado</td><td className="p-3 border border-gray-200">El vendedor confirmo el pedido y esta en preparacion.</td><td className="p-3 border border-gray-200"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Azul</span></td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Enviado</td><td className="p-3 border border-gray-200">El pedido fue enviado al cliente.</td><td className="p-3 border border-gray-200"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Morado</span></td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Entregado</td><td className="p-3 border border-gray-200">El pedido fue entregado al cliente exitosamente.</td><td className="p-3 border border-gray-200"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Verde</span></td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Cancelado</td><td className="p-3 border border-gray-200">El pedido fue cancelado.</td><td className="p-3 border border-gray-200"><span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Rojo</span></td></tr>
              </tbody>
            </table>
          </div>
          <StepList
            steps={[
              'En el pedido, busca el selector de estado (dropdown).',
              'Selecciona el nuevo estado deseado.',
              'El cambio se guarda automaticamente.',
            ]}
          />

          <SubHeading id="admin-promociones" title="3.5 Gestion de promociones" />
          <P>
            Las promociones son ofertas especiales que aparecen destacadas en la tienda y
            en el bot de WhatsApp.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Crear una promocion</h4>
          <StepList
            steps={[
              'En el menu lateral haz clic en &quot;Promociones&quot;.',
              'Haz clic en &quot;Nueva promocion&quot;.',
              'Completa el formulario:',
            ]}
          />
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Campo</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Descripcion</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Titulo</td><td className="p-3 border border-gray-200">Nombre de la promocion (ej: &quot;Oferta de Verano&quot;).</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Descripcion</td><td className="p-3 border border-gray-200">Detalle de la oferta.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Imagen</td><td className="p-3 border border-gray-200">Banner o imagen de la promocion.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Etiqueta de descuento</td><td className="p-3 border border-gray-200">Texto corto (ej: &quot;-30%&quot;, &quot;2x1&quot;, &quot;Gratis&quot;).</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Precio</td><td className="p-3 border border-gray-200">Precio especial (opcional, para promos que se pueden comprar).</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Color del badge</td><td className="p-3 border border-gray-200">Color visual: verde, rojo, amarillo, azul, morado, naranja o gris.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Fecha inicio / fin</td><td className="p-3 border border-gray-200">Vigencia de la promocion (se oculta automaticamente al expirar).</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Orden</td><td className="p-3 border border-gray-200">Numero para controlar el orden de aparicion.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Activa</td><td className="p-3 border border-gray-200">Toggle para activar/desactivar la promocion.</td></tr>
              </tbody>
            </table>
          </div>
          <StepList
            start={4}
            steps={[
              'Haz clic en &quot;Guardar promocion&quot;.',
              'La promocion aparecera en el banner de la tienda y en el bot de WhatsApp.',
            ]}
          />

          <SubHeading id="admin-whatsapp" title="3.6 Configuracion del Bot WhatsApp" />
          <P>
            Desde la seccion <b>Bot WhatsApp</b> puedes configurar el comportamiento del
            bot automatizado que atiende a tus clientes por WhatsApp.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Configuracion general</h4>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Configuracion</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Que hace</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Mensaje de bienvenida</td><td className="p-3 border border-gray-200">El texto que el bot envia cuando un cliente escribe por primera vez.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Imagen de bienvenida</td><td className="p-3 border border-gray-200">Imagen opcional que acompana al saludo (puede ser tu logo).</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Encabezado del menu</td><td className="p-3 border border-gray-200">Texto que aparece en la parte superior del menu principal.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Texto de consulta de pedido</td><td className="p-3 border border-gray-200">Mensaje que se muestra cuando el cliente quiere consultar un pedido.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Mensaje de soporte</td><td className="p-3 border border-gray-200">Texto enviado cuando el cliente solicita hablar con un operador.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Mensaje sin pedidos</td><td className="p-3 border border-gray-200">Respuesta cuando no se encuentran pedidos del cliente.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Telefono de reenvio</td><td className="p-3 border border-gray-200">Numero al que se reenvian copias de todos los mensajes de clientes.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Bot activo</td><td className="p-3 border border-gray-200">Toggle para activar o desactivar el bot completamente.</td></tr>
              </tbody>
            </table>
          </div>
          <Tip>
            Todos los campos de texto soportan emojis. Puedes usar el selector de emojis
            incluido en la interfaz.
          </Tip>

          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Flujos personalizados</h4>
          <P>
            Los flujos personalizados te permiten crear menus interactivos adicionales en
            el bot. Cada flujo es un arbol de opciones donde cada boton puede llevar a:
          </P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Otro submenu con mas opciones</li>
            <li>Un mensaje de texto</li>
            <li>Una imagen</li>
            <li>La lista de productos de la tienda</li>
            <li>La lista de promociones activas</li>
          </ul>
          <StepList
            steps={[
              'En la seccion &quot;Flujos&quot;, haz clic en &quot;Agregar flujo&quot;.',
              'Define el titulo del boton que aparecera en el menu principal del bot.',
              'Agrega los pasos del flujo: cada paso puede ser texto, imagen, productos o submenus.',
              'Guarda el flujo. El boton aparecera automaticamente en el menu del bot.',
            ]}
          />
          <InfoBox title="Limite de botones">
            El menu principal del bot soporta hasta 3 botones personalizados ademas de los
            botones del sistema (Productos, Promociones, Mis pedidos, Soporte, Mandaditos).
          </InfoBox>

          <SubHeading id="admin-conversaciones" title="3.7 Conversaciones de WhatsApp" />
          <P>
            La seccion <b>Conversaciones</b> te permite ver el historial de todos los
            mensajes intercambiados entre el bot y tus clientes.
          </P>
          <StepList
            steps={[
              'En el menu lateral haz clic en &quot;Conversaciones&quot;.',
              'Veras una lista de todas las conversaciones ordenadas por fecha.',
              'Usa el buscador para filtrar por numero de telefono del cliente.',
              'Haz clic en una conversacion para ver el historial completo de mensajes.',
              'Cada mensaje muestra la hora de envio y si fue del cliente o del bot.',
            ]}
          />
          <Tip>
            Si ves un badge rojo con un numero en el menu lateral, significa que tienes
            mensajes de WhatsApp sin leer. El numero indica la cantidad de mensajes
            nuevos.
          </Tip>

          <SubHeading id="admin-live" title="3.8 Transmision en vivo" />
          <P>
            Si esta funcionalidad esta habilitada por el SuperAdmin, podras iniciar
            transmisiones en vivo que se muestran directamente en tu tienda.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Iniciar una transmision</h4>
          <StepList
            steps={[
              'Inicia tu transmision en vivo en YouTube Studio (studio.youtube.com).',
              'Copia la URL del video en vivo.',
              'En el panel de administracion, ve a &quot;En Vivo&quot; en el menu lateral.',
              'Pega la URL de YouTube en el campo indicado.',
              'Haz clic en &quot;Publicar&quot;.',
              'Tu tienda mostrara automaticamente el banner de &quot;EN VIVO&quot; y los clientes podran ver la transmision.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Durante la transmision</h4>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Veras el video embebido con la etiqueta &quot;EN VIVO&quot; y un temporizador.</li>
            <li>Puedes compartir el enlace usando los botones de &quot;Copiar link&quot; o &quot;Compartir por WhatsApp&quot;.</li>
            <li>El boton &quot;Ver como cliente&quot; te permite ver como se muestra la transmision para tus compradores.</li>
          </ul>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Terminar la transmision</h4>
          <StepList
            steps={[
              'Haz clic en el boton &quot;Detener transmision&quot;.',
              'La tienda dejara de mostrar el banner de en vivo.',
              'Tambien detene la transmision en YouTube Studio.',
            ]}
          />

          <SubHeading id="admin-competencia" title="3.9 Monitor de competencia" />
          <P>
            Si esta funcionalidad esta habilitada, puedes buscar productos en tiendas de
            la competencia para comparar precios.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Buscar productos de la competencia</h4>
          <StepList
            steps={[
              'En el menu lateral haz clic en &quot;Competencia&quot;.',
              'Escribe el nombre del producto que quieres buscar.',
              'Selecciona la tienda donde buscar: Walmart, Sam\'s Club, Mercado Libre, Bodega Aurrera, o todas.',
              'Opcionalmente activa &quot;Solo ofertas&quot; para ver productos con descuento.',
              'Haz clic en &quot;Buscar&quot;.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Resultados de busqueda</h4>
          <P>Para cada producto encontrado veras:</P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Imagen del producto</li>
            <li>Nombre y precio actual</li>
            <li>Precio original y porcentaje de descuento (si aplica)</li>
            <li>Tienda de origen y calificacion</li>
          </ul>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Publicar producto de la competencia</h4>
          <StepList
            steps={[
              'Haz clic en el boton &quot;Publicar&quot; de cualquier producto encontrado.',
              'Se abrira el formulario de nuevo producto con los datos prellenados (nombre, precio, imagen).',
              'Ajusta los datos segun necesites (precio, descripcion, stock).',
              'Guarda el producto. Ya esta publicado en tu tienda.',
            ]}
          />
          <Tip>
            Esta herramienta es ideal para mantenerte competitivo, verificar tus precios
            contra el mercado y encontrar nuevos productos para agregar a tu catalogo.
          </Tip>

          <SubHeading id="admin-config" title="3.10 Configuracion de la tienda" />
          <P>
            Desde la seccion <b>Configuracion</b> puedes personalizar la apariencia de tu
            tienda y cambiar tu contrasena.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Personalizar la tienda</h4>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Opcion</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Efecto</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Nombre de la tienda</td><td className="p-3 border border-gray-200">Se muestra en el encabezado de la tienda publica.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Titulo de bienvenida</td><td className="p-3 border border-gray-200">Texto grande que aparece en el banner principal.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Subtitulo de bienvenida</td><td className="p-3 border border-gray-200">Texto secundario debajo del titulo.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Texto del footer</td><td className="p-3 border border-gray-200">Aparece en la parte inferior de la tienda (solo en escritorio).</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Color principal</td><td className="p-3 border border-gray-200">Cambia el color de botones, enlaces y elementos interactivos en toda la tienda.</td></tr>
              </tbody>
            </table>
          </div>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Cambiar el color principal</h4>
          <StepList
            steps={[
              'En la seccion &quot;Color principal de la tienda&quot;, veras una vista previa del color actual.',
              'Elige uno de los 10 colores predefinidos (Verde, Azul, Rojo, etc.).',
              'O usa el selector de color personalizado para ingresar un codigo hexadecimal exacto.',
              'Haz clic en &quot;Guardar color&quot;.',
              'El cambio se aplica inmediatamente en toda la tienda.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Cambiar contrasena</h4>
          <StepList
            steps={[
              'En la seccion &quot;Cambiar contrasena&quot;, ingresa tu contrasena actual.',
              'Escribe tu nueva contrasena (minimo 8 caracteres).',
              'Confirma la nueva contrasena.',
              'Haz clic en &quot;Guardar nueva contrasena&quot;.',
            ]}
          />

          {/* ============================================================ */}
          {/*  4. GUIA DEL SUPERADMIN                                       */}
          {/* ============================================================ */}
          <SectionHeading id="superadmin" icon={<Shield />} title="4. Guia del SuperAdmin" print />

          <SubHeading id="super-login" title="4.1 Acceso al panel SuperAdmin" />
          <P>
            El SuperAdmin es el administrador de la plataforma completa. Gestiona todas las
            tiendas (clientes/tenants) desde un panel centralizado.
          </P>
          <StepList
            steps={[
              'Navega a la direccion /superadmin (ejemplo: midominio.com/superadmin).',
              'Ingresa la contrasena maestra de la plataforma.',
              'Haz clic en &quot;Entrar&quot;.',
              'Seras redirigido al panel de gestion de clientes.',
            ]}
          />
          <Warning>
            La contrasena del SuperAdmin es una contrasena maestra que da acceso a todos
            los datos de la plataforma. Mantenla segura y no la compartas.
          </Warning>

          <SubHeading id="super-clientes" title="4.2 Gestion de clientes (tenants)" />
          <P>
            Cada &quot;cliente&quot; o &quot;tenant&quot; es una tienda independiente dentro de la plataforma.
            Cada una tiene sus propios productos, pedidos, promociones y configuracion.
          </P>
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Crear un nuevo cliente</h4>
          <StepList
            steps={[
              'En el panel de clientes, haz clic en &quot;Nuevo cliente&quot;.',
              'Completa el formulario:',
            ]}
          />
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Campo</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Descripcion</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Nombre del negocio</td><td className="p-3 border border-gray-200">Nombre comercial de la tienda.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Slug</td><td className="p-3 border border-gray-200">Identificador unico que se usa como subdominio (ej: &quot;moda-express&quot; = moda-express.midominio.com). Se genera automaticamente del nombre.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Email del admin</td><td className="p-3 border border-gray-200">Correo electronico con el que el dueno de la tienda iniciara sesion.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Telefono WhatsApp</td><td className="p-3 border border-gray-200">Numero de WhatsApp donde recibira los pedidos (con codigo de pais, sin +).</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Token MercadoPago</td><td className="p-3 border border-gray-200">Access Token de la cuenta de MercadoPago del cliente (para recibir pagos).</td></tr>
              </tbody>
            </table>
          </div>
          <StepList
            start={3}
            steps={[
              'Activa las funcionalidades que desees para este cliente (ver siguiente seccion).',
              'Haz clic en &quot;Crear cliente&quot;.',
              'El cliente recibira sus credenciales de acceso y podra comenzar a configurar su tienda.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Editar un cliente</h4>
          <StepList
            steps={[
              'En la lista de clientes, haz clic en el boton de editar del cliente deseado.',
              'Modifica los campos necesarios (telefono, token de MercadoPago, features).',
              'Guarda los cambios.',
            ]}
          />
          <h4 className="font-semibold text-gray-800 mt-4 mb-2">Desactivar / reactivar un cliente</h4>
          <P>
            Desactivar un cliente oculta su tienda para los compradores pero conserva
            todos los datos. Puedes reactivarlo en cualquier momento.
          </P>
          <StepList
            steps={[
              'En la lista de clientes, haz clic en &quot;Desactivar&quot; junto al cliente.',
              'La tienda dejara de ser accesible para los compradores.',
              'Para reactivar, haz clic en &quot;Reactivar&quot; en el mismo lugar.',
            ]}
          />

          <SubHeading id="super-features" title="4.3 Activar/desactivar funcionalidades" />
          <P>
            Cada cliente puede tener diferentes funcionalidades activadas segun sus
            necesidades:
          </P>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Funcionalidad</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Que habilita</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">En Vivo</td><td className="p-3 border border-gray-200">Permite al admin publicar transmisiones en vivo de YouTube y a los clientes verlas en la tienda.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Competencia</td><td className="p-3 border border-gray-200">Habilita la herramienta de monitoreo de precios en tiendas competidoras (Walmart, Sam&apos;s, etc.).</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Mandaditos</td><td className="p-3 border border-gray-200">Permite a los clientes solicitar entregas/mandados a traves del bot de WhatsApp.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">MercadoPago</td><td className="p-3 border border-gray-200">Habilita el boton de pago por MercadoPago en el checkout de la tienda.</td></tr>
              </tbody>
            </table>
          </div>
          <P>
            Estas funcionalidades se controlan desde la pagina de edicion de cada cliente
            mediante toggles (interruptores on/off). Cuando una funcionalidad esta
            desactivada, el boton correspondiente desaparece del menu lateral del admin y
            de la tienda publica.
          </P>

          {/* ============================================================ */}
          {/*  5. BOT DE WHATSAPP                                           */}
          {/* ============================================================ */}
          <SectionHeading id="bot" icon={<Bot />} title="5. Bot de WhatsApp (Detalle)" print />

          <P>
            Esta seccion detalla todas las opciones disponibles en el bot automatizado de
            WhatsApp desde la perspectiva del cliente que interactua con el.
          </P>

          <SubHeading id="bot-menu" title="5.1 Menu principal del bot" />
          <P>
            Cuando un cliente envia un mensaje al numero de WhatsApp de la tienda, el bot
            responde con un mensaje de bienvenida y un menu interactivo con las siguientes
            opciones:
          </P>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Opcion</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Icono</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Funcion</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Productos</td><td className="p-3 border border-gray-200 text-center text-xl">&#x1F6CD;&#xFE0F;</td><td className="p-3 border border-gray-200">Ver el catalogo de productos populares.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Promociones</td><td className="p-3 border border-gray-200 text-center text-xl">&#x1F381;</td><td className="p-3 border border-gray-200">Ver ofertas y descuentos activos.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Mandaditos</td><td className="p-3 border border-gray-200 text-center text-xl">&#x1F6F5;</td><td className="p-3 border border-gray-200">Solicitar un servicio de entrega o mandado.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Mis Pedidos</td><td className="p-3 border border-gray-200 text-center text-xl">&#x1F4E6;</td><td className="p-3 border border-gray-200">Consultar el estado de pedidos anteriores.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Soporte</td><td className="p-3 border border-gray-200 text-center text-xl">&#x1F4AC;</td><td className="p-3 border border-gray-200">Hablar con un operador humano.</td></tr>
              </tbody>
            </table>
          </div>
          <InfoBox title="Nota sobre la conversacion">
            La conversacion con el bot tiene un tiempo de inactividad de 30 minutos.
            Despues de ese tiempo sin interaccion, la conversacion se reinicia y el bot
            enviara nuevamente el menu principal al recibir un nuevo mensaje.
          </InfoBox>

          <SubHeading id="bot-productos" title="5.2 Comprar productos por chat" />
          <StepList
            steps={[
              'Selecciona &quot;Productos&quot; en el menu principal.',
              'El bot muestra los 5 productos mas populares organizados por categoria.',
              'Selecciona un producto para ver su detalle (nombre, precio, descripcion, stock).',
              'Haz clic en &quot;Agregar al carrito&quot; para anadirlo.',
              'Puedes seguir agregando mas productos o seleccionar &quot;Ver carrito&quot; para revisar.',
              'En el carrito veras todos los productos, cantidades, precios y el total.',
              'Selecciona &quot;Finalizar compra&quot; para proceder al checkout.',
              'El bot te pedira tu nombre completo.',
              'Luego te pedira tu direccion de entrega (puedes enviar texto o compartir tu ubicacion en vivo).',
              'El bot verifica el stock y los precios, crea el pedido y te envia el resumen con el total a pagar.',
              'El dueno de la tienda recibe una notificacion de tu pedido.',
            ]}
          />
          <Warning>
            El bot siempre verifica los precios y el stock al momento de crear el pedido.
            Si un producto se agoto mientras estabas comprando, el bot te avisara.
          </Warning>

          <SubHeading id="bot-promociones" title="5.3 Promociones en el bot" />
          <P>
            Al seleccionar &quot;Promociones&quot;, el bot muestra todas las ofertas activas
            que esten dentro de su fecha de vigencia. Si la promocion tiene un precio,
            puedes agregarla al carrito. Si no tiene precio, es solo informativa.
          </P>

          <SubHeading id="bot-pedidos" title="5.4 Consultar pedidos" />
          <StepList
            steps={[
              'Selecciona &quot;Mis Pedidos&quot; en el menu principal.',
              'El bot te pedira que ingreses tu numero de telefono.',
              'Escribe tu numero de 10 digitos.',
              'El bot buscara tus ultimos 3 pedidos y te mostrara: fecha, total y estado de cada uno.',
              'Si no se encuentran pedidos, veras un mensaje indicandolo.',
            ]}
          />

          <SubHeading id="bot-mandaditos" title="5.5 Solicitar mandaditos" />
          <P>
            Los &quot;mandaditos&quot; son solicitudes de entrega o mandados sin necesidad de comprar
            un producto del catalogo. Es ideal para pedidos especiales o entregas
            personalizadas.
          </P>
          <StepList
            steps={[
              'Selecciona &quot;Mandaditos&quot; en el menu principal.',
              'El bot te pedira tu nombre.',
              'Luego te pedira la direccion o ubicacion de entrega.',
              'El bot creara la solicitud y notificara al dueno de la tienda.',
              'El dueno te contactara para coordinar los detalles del mandadito.',
            ]}
          />

          <SubHeading id="bot-soporte" title="5.6 Contactar soporte" />
          <P>
            Si necesitas hablar con una persona real en lugar del bot:
          </P>
          <StepList
            steps={[
              'Selecciona &quot;Soporte&quot; en el menu principal.',
              'El bot te enviara un mensaje indicando que un operador te atendera.',
              'El bot se pone en modo silencioso y todos tus mensajes seran reenviados al operador.',
              'El operador (dueno de la tienda) te respondera directamente.',
              'Despues de 30 minutos de inactividad, la conversacion vuelve al modo automatico.',
            ]}
          />

          <SubHeading id="bot-flujos" title="5.7 Flujos personalizados" />
          <P>
            El dueno de la tienda puede crear botones adicionales en el menu del bot con
            menus, informacion o acciones personalizadas. Estos aparecen como botones
            extra en el menu principal. Al seleccionarlos, el bot puede mostrar:
          </P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Submenus con mas opciones</li>
            <li>Mensajes informativos (horarios, ubicacion, etc.)</li>
            <li>Imagenes (menu de restaurante, catalogo, etc.)</li>
            <li>Acceso directo a la lista de productos o promociones</li>
          </ul>

          {/* ============================================================ */}
          {/*  6. PAGOS E INTEGRACIONES                                     */}
          {/* ============================================================ */}
          <SectionHeading id="pagos" icon={<CreditCard />} title="6. Pagos e Integraciones" print />

          <SubHeading id="pago-whatsapp" title="6.1 Pago por WhatsApp" />
          <P>
            El pago por WhatsApp es la opcion mas sencilla y no requiere ninguna
            configuracion adicional. El flujo es:
          </P>
          <StepList
            steps={[
              'El cliente completa su pedido (desde la web o el bot).',
              'Se genera un mensaje con el resumen del pedido.',
              'El cliente envia el mensaje por WhatsApp al numero de la tienda.',
              'El vendedor coordina el metodo de pago directamente con el cliente (efectivo, transferencia, etc.).',
            ]}
          />
          <InfoBox title="Ventajas">
            <ul className="list-disc ml-5 space-y-1">
              <li>Sin comisiones por transaccion</li>
              <li>Contacto directo con el cliente</li>
              <li>Flexibilidad en metodos de pago (efectivo, transferencia, pago contra entrega)</li>
            </ul>
          </InfoBox>

          <SubHeading id="pago-mercadopago" title="6.2 Pago por MercadoPago" />
          <P>
            MercadoPago permite recibir pagos con tarjeta, OXXO y transferencia de forma
            automatica. Cada tienda usa su propia cuenta de MercadoPago.
          </P>
          <InfoBox title="Metodos de pago soportados">
            <ul className="list-disc ml-5 space-y-1">
              <li>Tarjetas de credito (Visa, Mastercard, American Express)</li>
              <li>Tarjetas de debito</li>
              <li>OXXO (pago en efectivo con referencia)</li>
              <li>Transferencia bancaria (CLABE)</li>
              <li>Saldo en MercadoPago</li>
            </ul>
          </InfoBox>
          <P>
            Cuando el pago es aprobado, el sistema automaticamente:
          </P>
          <ul className="list-disc ml-6 space-y-1 text-gray-600 mb-4">
            <li>Actualiza el estado del pedido a &quot;Confirmado&quot;</li>
            <li>Registra la informacion del pago</li>
            <li>Notifica al vendedor por WhatsApp</li>
            <li>Muestra una pagina de confirmacion al cliente</li>
          </ul>

          <SubHeading id="seguridad-pagos" title="6.3 Seguridad en los pagos" />
          <P>
            El sistema implementa multiples capas de seguridad para proteger las
            transacciones:
          </P>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Medida</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Descripcion</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-3 border border-gray-200 font-medium">Verificacion de precios</td><td className="p-3 border border-gray-200">Los precios se verifican en el servidor al momento del checkout. El carrito del cliente solo almacena IDs y cantidades.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Validacion de stock</td><td className="p-3 border border-gray-200">El stock se verifica en tiempo real antes de crear el pedido para evitar sobreventa.</td></tr>
                <tr><td className="p-3 border border-gray-200 font-medium">Webhook seguro</td><td className="p-3 border border-gray-200">Las notificaciones de pago de MercadoPago se verifican con firma digital.</td></tr>
                <tr className="bg-gray-50"><td className="p-3 border border-gray-200 font-medium">Aislamiento de datos</td><td className="p-3 border border-gray-200">Cada tienda solo puede ver y modificar sus propios datos gracias a la seguridad a nivel de base de datos (RLS).</td></tr>
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/*  7. PREGUNTAS FRECUENTES                                      */}
          {/* ============================================================ */}
          <SectionHeading id="faq" icon={<MessageSquare />} title="7. Preguntas Frecuentes" print />

          <FAQ
            q="No puedo ver los productos en la tienda"
            a="Verifica que los productos esten marcados como &quot;Activos&quot; en el panel de administracion y que tengan stock mayor a 0."
          />
          <FAQ
            q="El carrito se vacio solo"
            a="El carrito se guarda en el navegador (localStorage). Si limpiaste los datos del navegador, usaste modo incognito o cambiaste de dispositivo, el carrito se reinicia."
          />
          <FAQ
            q="No me llega el mensaje de WhatsApp al completar un pedido"
            a="Verifica que el numero de WhatsApp configurado en la tienda sea correcto (con codigo de pais, sin +). Tambien asegurate de tener WhatsApp instalado en el dispositivo donde haces la compra."
          />
          <FAQ
            q="MercadoPago no aparece como opcion de pago"
            a="Esta funcionalidad debe ser habilitada por el SuperAdmin para tu tienda. Ademas, debe configurarse el Access Token de MercadoPago en la cuenta del cliente."
          />
          <FAQ
            q="El bot de WhatsApp no responde"
            a="Verifica que: (1) el bot este activado en la configuracion de WhatsApp, (2) el webhook de Meta este correctamente configurado, (3) la aplicacion este desplegada y funcionando."
          />
          <FAQ
            q="Como cambio el numero de WhatsApp de mi tienda"
            a="El numero de WhatsApp se configura a nivel del tenant. Contacta al SuperAdmin para actualizar el numero de tu tienda."
          />
          <FAQ
            q="Perdi mi contrasena de administrador"
            a="Contacta al SuperAdmin de la plataforma. El puede restablecer tu contrasena desde el panel de Supabase."
          />
          <FAQ
            q="Los clientes ven precios diferentes en el checkout"
            a="Esto es por seguridad. El sistema verifica los precios en el servidor al momento del checkout. Si actualizaste un precio despues de que el cliente agrego el producto al carrito, vera el precio actualizado."
          />
          <FAQ
            q="Como agrego mas colores o tallas a un producto de ropa"
            a='Edita el producto y selecciona el tipo "Ropa". Aparecen campos adicionales para colores (separados por coma), tallas (checkboxes), genero, material y guia de medidas.'
          />
          <FAQ
            q="La transmision en vivo no se muestra en la tienda"
            a='Verifica que: (1) la funcionalidad "En Vivo" este habilitada por el SuperAdmin, (2) la URL de YouTube sea valida, (3) la transmision este activa en YouTube Studio.'
          />
          <FAQ
            q="Puedo tener multiples administradores en una tienda"
            a="Actualmente cada tienda tiene un administrador principal. Para agregar mas usuarios, se deben crear manualmente en Supabase y asignarlos al mismo tenant."
          />

          {/* ---- Footer ---- */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
            <p>Tienda WhatsApp &mdash; Manual de Usuario v1.0</p>
            <p>Junio 2026</p>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function SectionHeading({ id, icon, title, print: pb }: { id: string; icon: React.ReactNode; title: string; print?: boolean }) {
  return (
    <h2
      id={id}
      className={`flex items-center gap-3 text-2xl sm:text-3xl font-bold text-gray-900 mt-16 mb-6 scroll-mt-20 ${pb ? 'print-break' : ''}`}
    >
      <span className="text-green-600">{icon}</span>
      {title}
    </h2>
  )
}

function SubHeading({ id, title }: { id: string; title: string }) {
  return (
    <h3
      id={id}
      className="text-xl font-semibold text-gray-800 mt-10 mb-4 scroll-mt-20 border-l-4 border-green-500 pl-4"
    >
      {title}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 leading-relaxed mb-4">{children}</p>
}

function StepList({ steps, start = 1 }: { steps: string[]; start?: number }) {
  return (
    <ol className="space-y-3 mb-4" start={start}>
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-gray-600">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
            {start + i}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="info-box bg-blue-50 border border-blue-200 rounded-xl p-5 my-6">
      <p className="font-semibold text-blue-800 mb-2">{title}</p>
      <div className="text-blue-700 text-sm">{children}</div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="info-box bg-green-50 border border-green-200 rounded-xl p-5 my-6">
      <p className="font-semibold text-green-800 mb-1">Consejo</p>
      <p className="text-green-700 text-sm">{children}</p>
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="info-box bg-amber-50 border border-amber-200 rounded-xl p-5 my-6">
      <p className="font-semibold text-amber-800 mb-1">Importante</p>
      <p className="text-amber-700 text-sm">{children}</p>
    </div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="info-box border border-gray-200 rounded-xl p-5 my-4">
      <p className="font-semibold text-gray-800 mb-2">{q}</p>
      <p className="text-gray-600 text-sm">{a}</p>
    </div>
  )
}
