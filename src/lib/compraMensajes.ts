/** Textos unificados del flujo de compra (catálogo → carrito → pago → retiro). */

export const COMPRA = {
  catalogoResumen:
    'Precios en bolivianos (BOB). Podés pagar online con Stripe (modo test) o en el local.',
  fichaPago:
    'Pagá online con Stripe (modo test, BOB) desde el carrito, o pagá en tienda al retirar.',
  fichaAgregado:
    'Agregado al carrito. Completá el pago online (Stripe test) o pagá en el local al retirar.',
  carritoResumen:
    'Revisá tu pedido. El pago online usa Stripe Checkout en bolivianos (modo test). También podés pagar en tienda.',
  carritoVacio:
    'Agregá productos desde el catálogo. El pago online está disponible con Stripe (modo test, BOB).',
  pieResumen:
    'Componentes electrónicos en Santa Cruz. Consultá el catálogo, pagá online (Stripe test) o en mostrador, y retirás en el local.',
  comoComprarTitulo: 'Cómo comprar',
  pasos: [
    {
      titulo: '1. Elegí en el catálogo',
      texto: 'Buscá por código o nombre, filtrá por categoría y agregá al carrito. No hace falta cuenta para armar el carrito.',
    },
    {
      titulo: '2. Pagá',
      texto: 'Online con Stripe Checkout en bolivianos (modo test) desde el carrito, o en efectivo/tarjeta en el local al retirar.',
    },
    {
      titulo: '3. Retirá en tienda',
      texto: 'Con el pago confirmado, retirás en el mostrador en el horario de atención.',
    },
  ],
  contactoHorario: 'Lun–sáb 08:00–12:00 y 13:30–17:00',
  contactoCiudad: 'Santa Cruz de la Sierra, Bolivia',
  contactoNota: 'Consultas y retiros en el local (mostrador).',
} as const
