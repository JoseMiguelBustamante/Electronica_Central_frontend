import { Link } from 'react-router-dom'
import { COMPRA } from '../../lib/compraMensajes'
import { BRAND_NAME, ROUTES } from '../../utils/navigation'
import { FOCUS_RING } from '../../utils/styles'

const LOCAL_LAT = -17.781384644606927
const LOCAL_LNG = -63.17736033988401
const MAPS_QUERY = `${LOCAL_LAT},${LOCAL_LNG}`
const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&z=17&output=embed`
const MAPS_LINK = `https://www.google.com/maps?q=${MAPS_QUERY}`

export default function PieTienda() {
  return (
    <footer id="contacto" className="mt-auto scroll-mt-28 border-t border-linea bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-base font-semibold text-mascara">{BRAND_NAME}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-secundario">{COMPRA.pieResumen}</p>
          <p className="mt-4 text-sm font-semibold text-tinta">Contacto y retiro</p>
          <p className="mt-1 text-sm text-tinta">{COMPRA.contactoCiudad}</p>
          <p className="mt-1 text-sm text-secundario">{COMPRA.contactoHorario}</p>
          <p className="mt-1 text-sm text-secundario">{COMPRA.contactoNota}</p>
          <a
            href={MAPS_LINK}
            target="_blank"
            rel="noreferrer"
            className={`mt-3 inline-block text-sm font-semibold text-mascara hover:underline ${FOCUS_RING}`}
          >
            Abrir ubicación en Google Maps
          </a>
          <nav className="mt-6 flex flex-col gap-2 text-sm" aria-label="Pie de página">
            <Link to={ROUTES.catalogo} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
              Catálogo
            </Link>
            <Link to={ROUTES.comoComprar} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
              Cómo comprar
            </Link>
            <Link to={ROUTES.favoritos} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
              Favoritos
            </Link>
            <Link to={ROUTES.misSolicitudes} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
              Mis solicitudes
            </Link>
            <Link to={ROUTES.login} className={`text-tinta hover:text-mascara ${FOCUS_RING}`}>
              Ingresar
            </Link>
          </nav>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-tinta">Ubicación del local</p>
          <div className="overflow-hidden rounded-xl border border-linea bg-suave shadow-sm">
            <iframe
              title={`Mapa del local ${BRAND_NAME}`}
              src={MAPS_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full border-0 sm:h-72"
              allowFullScreen
            />
          </div>
        </div>
      </div>
      <p className="border-t border-linea px-6 py-4 text-center text-xs text-secundario">
        © {new Date().getFullYear()} {BRAND_NAME}
      </p>
    </footer>
  )
}
