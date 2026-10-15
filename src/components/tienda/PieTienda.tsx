import { Link } from 'react-router-dom'
import { BRAND_NAME, ROUTES } from '../../utils/navigation'
import { FOCUS_RING } from '../../utils/styles'

export default function PieTienda() {
  return (
    <footer className="mt-auto border-t border-linea bg-superficie">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-base font-semibold text-mascara">{BRAND_NAME}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-secundario">
            Componentes electrónicos en La Paz. El precio se ve en el catálogo y la compra se cierra en el mostrador.
          </p>
          <p className="mt-3 text-sm text-secundario">Lun–sáb 08:00–12:00 y 13:30–17:00 · La Paz</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Pie de página">
          <Link to={ROUTES.catalogo} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
            Catálogo
          </Link>
          <Link to={ROUTES.login} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
            Ingresar
          </Link>
        </nav>
      </div>
      <p className="border-t border-linea px-6 py-4 text-center text-xs text-secundario">
        © {new Date().getFullYear()} {BRAND_NAME}
      </p>
    </footer>
  )
}
