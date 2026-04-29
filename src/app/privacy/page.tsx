export const metadata = {
  title: 'Política de Privacidad — Aldea Communications Logistic',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: abril 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Información que recopilamos</h2>
        <p className="mb-2">Cuando interactúas con nuestra tienda o bot de WhatsApp, podemos recopilar:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nombre y número de teléfono (proporcionados voluntariamente al contactarnos por WhatsApp)</li>
          <li>Dirección de entrega y datos del pedido</li>
          <li>Historial de mensajes con nuestro bot de atención</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Cómo usamos tu información</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Procesar y entregar tus pedidos</li>
          <li>Enviarte confirmaciones y actualizaciones de estado</li>
          <li>Mejorar nuestro servicio de atención al cliente</li>
          <li>Responder a tus consultas y solicitudes</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Compartir información con terceros</h2>
        <p>No vendemos ni compartimos tu información personal con terceros, salvo cuando sea necesario para procesar tu pago (a través de los procesadores de pago habilitados) o cumplir con obligaciones legales.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. WhatsApp y Meta</h2>
        <p>Nuestro bot opera a través de la API de WhatsApp Business de Meta. Al contactarnos por WhatsApp, tu información también está sujeta a las <a href="https://www.whatsapp.com/legal/privacy-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Políticas de Privacidad de WhatsApp</a>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Retención de datos</h2>
        <p>Conservamos tus datos únicamente durante el tiempo necesario para cumplir con los fines descritos en esta política o según lo exija la ley.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Tus derechos</h2>
        <p className="mb-2">Tienes derecho a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Acceder a los datos personales que tenemos sobre ti</li>
          <li>Solicitar la corrección de datos incorrectos</li>
          <li>Solicitar la eliminación de tus datos</li>
        </ul>
        <p className="mt-2">Para ejercer estos derechos, visita nuestra <a href="/data-deletion" className="text-blue-600 underline">página de eliminación de datos</a> o escríbenos a <strong>gabrielmxtorres@gmail.com</strong>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Contacto</h2>
        <p>Si tienes preguntas sobre esta política, contáctanos en: <strong>gabrielmxtorres@gmail.com</strong></p>
      </section>
    </main>
  )
}
