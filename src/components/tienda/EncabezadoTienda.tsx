import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { listarCatalogoPublico, type ProductoPublico } from '../../services/catalogoService'
import { borrarToken, leerToken } from '../../lib/session'
import { BRAND_NAME, ROUTES } from '../../utils/navigation'
import { FOCUS_RING } from '../../utils/styles'
import { formatCurrency } from '../../utils/formatters'

const HORARIO = 'Lun–sáb 08:00–12:00 y 13:30–17:00'

export default function EncabezadoTienda() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const busquedaId = useId()
  const [texto, setTexto] = useState(params.get('buscar') ?? '')
  const [sugerencias, setSugerencias] = useState<ProductoPublico[]>([])
  const [abierto, setAbierto] = useState(false)
  const conSesion = Boolean(leerToken())

  useEffect(() => {
    setTexto(params.get('buscar') ?? '')
  }, [params])

  useEffect(() => {
    const consulta = texto.trim()
    if (consulta.length < 2) {
      setSugerencias([])
      return
    }
    const temporizador = window.setTimeout(() => {
      listarCatalogoPublico({ buscar: consulta, limite: 6, pagina: 1 })
        .then((pagina) => setSugerencias(pagina.productos))
        .catch(() => setSugerencias([]))
    }, 300)
    return () => window.clearTimeout(temporizador)
  }, [texto])

  const buscar = (valor: string) => {
    const consulta = valor.trim()
    const siguientes = new URLSearchParams(params)
    if (consulta) siguientes.set('buscar', consulta)
    else siguientes.delete('buscar')
    setAbierto(false)
    navigate({ pathname: ROUTES.catalogo, search: siguientes.toString() })
  }

  const enlaceSesion = conSesion ? (
    <div className="flex shrink-0 items-center gap-3">
      <Link to={ROUTES.misSolicitudes} className={`text-sm font-semibold text-mascara ${FOCUS_RING}`}>
        Mis solicitudes
      </Link>
      <Link to={ROUTES.dashboard} className={`text-sm font-semibold text-mascara ${FOCUS_RING}`}>
        Panel
      </Link>
      <button
        type="button"
        className={`text-sm font-semibold text-mascara ${FOCUS_RING}`}
        onClick={() => {
          borrarToken()
          navigate(ROUTES.catalogo)
        }}
      >
        Salir
      </button>
    </div>
  ) : (
    <div className="flex shrink-0 items-center gap-3">
      <Link to={ROUTES.registro} className={`text-sm font-semibold text-mascara ${FOCUS_RING}`}>
        Crear cuenta
      </Link>
      <Link to={ROUTES.login} className={`text-sm font-semibold text-mascara ${FOCUS_RING}`}>
        Ingresar
      </Link>
    </div>
  )

  return (
    <header className="border-b border-linea bg-superficie">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 items-center justify-between gap-3 md:contents">
          <Link
            to={ROUTES.catalogo}
            className={`min-w-0 truncate text-base font-semibold text-mascara sm:text-lg ${FOCUS_RING} md:shrink-0`}
          >
            {BRAND_NAME}
          </Link>
          <div className="md:hidden">{enlaceSesion}</div>
        </div>

        <form
          role="search"
          className="relative min-w-0 w-full md:flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            buscar(texto)
          }}
        >
          <label htmlFor={busquedaId} className="sr-only">
            Buscar producto
          </label>
          <div className="flex gap-2">
            <input
              id={busquedaId}
              value={texto}
              onChange={(event) => {
                setTexto(event.target.value)
                setAbierto(true)
              }}
              onFocus={() => setAbierto(true)}
              placeholder="Buscar por nombre o código"
              autoComplete="off"
              className={`h-11 min-w-0 flex-1 rounded-md border border-campo bg-superficie px-3 text-sm text-tinta ${FOCUS_RING}`}
            />
            <button
              type="submit"
              aria-label="Buscar"
              className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-cobre px-3 text-sm font-semibold text-white hover:bg-cobre-press sm:px-4 ${FOCUS_RING}`}
            >
              <MagnifyingGlassIcon size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
          {abierto && texto.trim().length >= 2 && (
            <div className="absolute top-12 right-0 left-0 z-20 rounded-md border border-linea bg-superficie shadow-sm">
              {sugerencias.length === 0 ? (
                <p className="px-3 py-3 text-sm text-secundario">Sin coincidencias en el catálogo.</p>
              ) : (
                <ul>
                  {sugerencias.map((producto) => (
                    <li key={producto.id}>
                      <Link
                        to={`/catalogo/${producto.id}`}
                        onClick={() => setAbierto(false)}
                        className={`flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm hover:bg-suave ${FOCUS_RING}`}
                      >
                        <span className="min-w-0">
                          <span className="font-semibold text-tinta">{producto.nombre}</span>
                          <span className="ml-2 font-mono text-xs text-secundario">{producto.codigo}</span>
                        </span>
                        <span className="shrink-0 font-mono text-cobre">{formatCurrency(producto.precio)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        <p className="hidden max-w-48 text-right text-xs leading-5 text-secundario xl:block">{HORARIO}</p>
        <div className="hidden md:block">{enlaceSesion}</div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-6 px-4 pb-3 text-sm sm:px-6" aria-label="Tienda">
        <Link to={ROUTES.catalogo} className={`font-semibold text-mascara ${FOCUS_RING}`}>
          Catálogo
        </Link>
        <Link to={ROUTES.misSolicitudes} className={`font-semibold text-mascara ${FOCUS_RING}`}>
          Mis solicitudes
        </Link>
      </nav>
    </header>
  )
}
