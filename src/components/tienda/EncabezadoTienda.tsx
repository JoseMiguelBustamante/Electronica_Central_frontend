import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { listarCatalogoPublico, type ProductoPublico } from '../../services/catalogoService'
import { leerToken } from '../../lib/session'
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

  return (
    <header className="border-b border-linea bg-superficie">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <Link to={ROUTES.catalogo} className={`shrink-0 text-lg font-semibold text-mascara ${FOCUS_RING}`}>
          {BRAND_NAME}
        </Link>
        <form
          role="search"
          className="relative min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            buscar(texto)
          }}
        >
          <label htmlFor={busquedaId} className="sr-only">
            Buscar producto
          </label>
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
            className={`h-11 w-full rounded-md border border-campo bg-superficie px-3 pr-28 text-sm text-tinta ${FOCUS_RING}`}
          />
          <button
            type="submit"
            className={`absolute top-1 right-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-cobre px-3 text-sm font-semibold text-white hover:bg-cobre-press ${FOCUS_RING}`}
          >
            <MagnifyingGlassIcon size={16} aria-hidden="true" />
            Buscar
          </button>
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
                        className={`flex items-baseline justify-between gap-4 px-3 py-2.5 text-sm hover:bg-suave ${FOCUS_RING}`}
                      >
                        <span>
                          <span className="font-semibold text-tinta">{producto.nombre}</span>
                          <span className="ml-2 font-mono text-xs text-secundario">{producto.codigo}</span>
                        </span>
                        <span className="font-mono text-cobre">{formatCurrency(producto.precio)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
        <p className="hidden max-w-48 text-right text-xs leading-5 text-secundario xl:block">{HORARIO}</p>
        {conSesion ? (
          <Link to={ROUTES.dashboard} className={`shrink-0 text-sm font-semibold text-mascara ${FOCUS_RING}`}>
            Panel
          </Link>
        ) : (
          <Link to={ROUTES.login} className={`shrink-0 text-sm font-semibold text-mascara ${FOCUS_RING}`}>
            Ingresar
          </Link>
        )}
      </div>
      <nav className="mx-auto flex max-w-7xl gap-6 px-6 pb-3 text-sm" aria-label="Tienda">
        <Link to={ROUTES.catalogo} className={`font-semibold text-mascara ${FOCUS_RING}`}>
          Catálogo
        </Link>
      </nav>
    </header>
  )
}
