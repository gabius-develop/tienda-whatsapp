export const metadata = {
  title: 'Eliminación de Datos — Aldea Communications Logistic',
}

export default function DataDeletionPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Solicitud de Eliminación de Datos</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: abril 2025</p>

      <section className="mb-8">
        <p className="text-lg mb-4">
          Respetamos tu privacidad. Si deseas que eliminemos todos los datos personales que tenemos sobre ti, sigue las instrucciones a continuación.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">¿Qué datos podemos eliminar?</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nombre y número de teléfono</li>
          <li>Historial de pedidos</li>
          <li>Historial de conversaciones con el bot de WhatsApp</li>
          <li>Dirección de entrega u otros datos de contacto</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Cómo solicitar la eliminación</h2>
        <p className="mb-4">Envía un correo a <strong>gabrielmxtorres@gmail.com</strong> con el asunto <strong>"Solicitud de eliminación de datos"</strong> e incluye:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Tu nombre completo</li>
          <li>El número de teléfono con el que te registraste o realizaste pedidos</li>
          <li>Una breve descripción de los datos que deseas eliminar</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Tiempo de respuesta</h2>
        <p>Procesaremos tu solicitud en un plazo máximo de <strong>30 días</strong> y te confirmaremos por correo cuando se haya completado la eliminación.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Nota importante</h2>
        <p>Es posible que conservemos ciertos datos si es requerido por ley (por ejemplo, registros de transacciones financieras). En ese caso, te lo informaremos en nuestra respuesta.</p>
      </section>

      <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="font-medium">Contacto directo:</p>
        <p className="text-blue-700 font-semibold">gabrielmxtorres@gmail.com</p>
      </div>
    </main>
  )
}
