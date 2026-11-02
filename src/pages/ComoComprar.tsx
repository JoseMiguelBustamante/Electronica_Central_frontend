import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { COMPRA } from '../lib/compraMensajes'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

export default function ComoComprar() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-tinta">{COMPRA.comoComprarTitulo}</h1>
        <p className="mt-2 text-sm leading-6 text-secundario">{COMPRA.pieResumen}</p>
      </header>

      <ol className="space-y-4">
        {COMPRA.pasos.map((paso) => (
          <li key={paso.titulo} className="rounded-xl border border-linea bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-mascara">{paso.titulo}</h2>
            <p className="mt-2 text-sm leading-6 text-tinta">{paso.texto}</p>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-linea bg-suave p-5">
        <h2 className="text-base font-semibold text-tinta">Contacto y retiro</h2>
        <p className="mt-2 text-sm text-tinta">{COMPRA.contactoCiudad}</p>
        <p className="mt-1 text-sm text-secundario">{COMPRA.contactoHorario}</p>
        <p className="mt-1 text-sm text-secundario">{COMPRA.contactoNota}</p>
        <Link to={`${ROUTES.catalogo}#contacto`} className={`mt-3 inline-flex text-sm font-semibold text-mascara hover:underline ${FOCUS_RING}`}>
          Ver mapa en el pie de página
        </Link>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
          <Button>Ir al catálogo</Button>
        </Link>
        <Link to={ROUTES.carrito} className={`inline-flex ${FOCUS_RING}`}>
          <Button variant="secondary">Ver carrito</Button>
        </Link>
      </div>
    </div>
  )
}
