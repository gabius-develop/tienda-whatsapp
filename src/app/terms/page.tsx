export const metadata = {
  title: 'Términos de Servicio — Aldea Communications Logistic',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: abril 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Aceptación de los términos</h2>
        <p>Al usar nuestra tienda o interactuar con nuestro bot de WhatsApp, aceptas estos términos de servicio. Si no estás de acuerdo, por favor no uses nuestros servicios.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Descripción del servicio</h2>
        <p>Aldea Communications Logistic ofrece una plataforma de comercio electrónico con atención y checkout a través de WhatsApp. Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Pedidos y pagos</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Los precios están sujetos a cambios sin previo aviso</li>
          <li>Los pedidos se confirman una vez procesado el pago</li>
          <li>Nos reservamos el derecho de cancelar pedidos en caso de error en precios o disponibilidad</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Envíos y entregas</h2>
        <p>Los tiempos de entrega son estimados y pueden variar. No somos responsables por retrasos causados por terceros (transportistas, condiciones climáticas, etc.).</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Devoluciones</h2>
        <p>Para solicitar una devolución o cambio, contáctanos dentro de los 7 días posteriores a la recepción del producto a través de WhatsApp o por correo a <strong>gabrielmxtorres@gmail.com</strong>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Uso del bot de WhatsApp</h2>
        <p>Nuestro bot de WhatsApp es un servicio automatizado. Al interactuar con él, aceptas recibir mensajes relacionados con tus pedidos y consultas. Puedes darte de baja en cualquier momento respondiendo <strong>STOP</strong>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Limitación de responsabilidad</h2>
        <p>No somos responsables por daños indirectos, incidentales o consecuentes derivados del uso de nuestros servicios.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
        <p>Para cualquier consulta sobre estos términos: <strong>gabrielmxtorres@gmail.com</strong></p>
      </section>
    </main>
  )
}
