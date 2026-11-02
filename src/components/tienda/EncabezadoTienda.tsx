import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CaretDownIcon,
  ClockIcon,
  HeartIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  SquaresFourIcon,
  TagIcon,
  UserIcon,
} from '@phosphor-icons/react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useCart } from '../../hooks/useCart'
import { cantidadFavoritos } from '../../lib/favoritosStorage'
import { borrarToken, leerToken } from '../../lib/session'
import { obtenerSesion } from '../../services/authService'
import { listarCatalogoPublico, listarFiltrosPublicos, type OpcionFiltro, type ProductoPublico } from '../../services/catalogoService'
import type { SesionUsuario } from '../../types/domain'
import { BRAND_NAME, ROUTES } from '../../utils/navigation'
import { formatPrecioMostrador } from '../../utils/formatters'
import { FOCUS_RING, cn } from '../../utils/styles'

export default function EncabezadoTienda() {
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const [params] = useSearchParams()
  const busquedaId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const catsRef = useRef<HTMLDivElement>(null)
  const [texto, setTexto] = useState(params.get('buscar') ?? '')
  const [sugerencias, setSugerencias] = useState<ProductoPublico[]>([])
  const [abierto, setAbierto] = useState(false)
  const [menuCuenta, setMenuCuenta] = useState(false)
  const [menuCats, setMenuCats] = useState(false)
  const [categorias, setCategorias] = useState<OpcionFiltro[]>([])
  const [favoritosN, setFavoritosN] = useState(0)
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null)
  const conSesion = Boolean(leerToken())
  const cerrarMenu = useCallback(() => setMenuCuenta(false), [])
  const cerrarCats = useCallback(() => setMenuCats(false), [])
  useClickOutside(menuRef, menuCuenta, cerrarMenu)
  useClickOutside(catsRef, menuCats, cerrarCats)

  useEffect(() => {
    listarFiltrosPublicos()
      .then((f) => setCategorias(f.categorias))
      .catch(() => setCategorias([]))
  }, [])

  useEffect(() => {
    setFavoritosN(cantidadFavoritos())
    const sync = () => setFavoritosN(cantidadFavoritos())
    window.addEventListener('storage', sync)
    window.addEventListener('eca-favoritos', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('eca-favoritos', sync)
    }
  }, [ubicacion.pathname])

  useEffect(() => {
    if (!conSesion) {
      setUsuario(null)
      return
    }
    let vigente = true
    obtenerSesion().then(
      (sesion) => {
        if (vigente) setUsuario(sesion)
      },
      () => {
        if (vigente) setUsuario(null)
      },
    )
    return () => {
      vigente = false
    }
  }, [conSesion])

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
    const siguientes = new URLSearchParams()
    if (consulta) siguientes.set('buscar', consulta)
    setAbierto(false)
    navigate({ pathname: ROUTES.catalogo, search: siguientes.toString() })
  }

  return (
    <header className="border-b border-linea bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-5">
        <Link to={ROUTES.catalogo} className={`flex min-w-0 items-center gap-2.5 ${FOCUS_RING}`}>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-mascara text-white">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="1.5" />
              <path d="M9 7V4.5M12 7V4.5M15 7V4.5M9 19.5V17M12 19.5V17M15 19.5V17M7 9H4.5M7 12H4.5M7 15H4.5M19.5 9H17M19.5 12H17M19.5 15H17" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-mascara">{BRAND_NAME}</span>
            <span className="block truncate text-xs text-secundario">Componentes hoy, grandes proyectos mañana</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 lg:col-start-3">
          <p className="hidden items-start gap-2 text-xs leading-4 text-secundario xl:flex">
            <ClockIcon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Lun - Sáb
              <span className="block">08:00-12:00 y 13:30-17:00</span>
            </span>
          </p>
          <Link
            to={ROUTES.favoritos}
            className={`relative grid size-10 place-items-center text-tinta hover:text-mascara ${FOCUS_RING}`}
            aria-label={`Favoritos, ${favoritosN}`}
          >
            <HeartIcon size={22} aria-hidden="true" />
            {favoritosN > 0 && (
              <span className="absolute top-1 right-0 grid min-w-4 place-items-center rounded-full bg-mascara px-1 text-[10px] font-semibold text-white">
                {favoritosN > 99 ? '99+' : favoritosN}
              </span>
            )}
          </Link>
          <Cuenta
            menuRef={menuRef}
            abierto={menuCuenta}
            conSesion={conSesion}
            nombre={usuario?.nombreUsuario ?? null}
            onAlternar={() => setMenuCuenta((valor) => !valor)}
            onCerrar={() => setMenuCuenta(false)}
            onSalir={() => {
              borrarToken()
              setUsuario(null)
              setMenuCuenta(false)
              navigate(ROUTES.catalogo)
            }}
          />
          <Carrito />
        </div>

        <form
          role="search"
          className="relative col-span-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1"
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
              placeholder="Buscar por nombre, código o modelo..."
              autoComplete="off"
              className={`h-11 min-w-0 flex-1 rounded-lg border border-linea bg-white px-3 text-sm text-tinta ${FOCUS_RING}`}
            />
            <button
              type="submit"
              className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-cobre px-4 text-sm font-semibold text-white hover:bg-cobre-press ${FOCUS_RING}`}
            >
              <MagnifyingGlassIcon size={16} aria-hidden="true" />
              Buscar
            </button>
          </div>
          {abierto && texto.trim().length >= 2 && (
            <div className="absolute top-12 right-0 left-0 z-20 rounded-lg border border-linea bg-white shadow-sm">
              {sugerencias.length === 0 ? (
                <div className="space-y-2 px-3 py-3 text-sm">
                  <p className="text-secundario">Sin coincidencias en el catálogo.</p>
                  <button
                    type="button"
                    className={`font-semibold text-mascara ${FOCUS_RING}`}
                    onClick={() => {
                      setTexto('')
                      setAbierto(false)
                      navigate(ROUTES.catalogo)
                    }}
                  >
                    Ver todo el catálogo
                  </button>
                </div>
              ) : (
                <ul>
                  {sugerencias.map((producto) => (
                    <li key={producto.id}>
                      <Link
                        to={`/catalogo/${producto.id}`}
                        state={{ fromCatalog: `${ubicacion.pathname}${ubicacion.search}` }}
                        onClick={() => setAbierto(false)}
                        className={`flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm hover:bg-suave ${FOCUS_RING}`}
                      >
                        <span className="min-w-0">
                          <span className="font-semibold text-tinta">{producto.nombre}</span>
                          <span className="ml-2 font-mono text-xs text-secundario">{producto.codigo}</span>
                        </span>
                        <span className="shrink-0 text-cobre">{formatPrecioMostrador(producto.precio)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Tienda">
        <NavLinkItem
          to={ROUTES.catalogo}
          activo={ubicacion.pathname === ROUTES.catalogo && !ubicacion.hash && !params.get('categoria')}
          icono={SquaresFourIcon}
          etiqueta="Catálogo"
        />

        <div className="relative" ref={catsRef}>
          <button
            type="button"
            aria-expanded={menuCats}
            aria-haspopup="menu"
            onClick={() => setMenuCats((v) => !v)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold',
              menuCats || params.get('categoria')
                ? 'border-mascara text-mascara'
                : 'border-transparent text-secundario hover:text-tinta',
              FOCUS_RING,
            )}
          >
            <TagIcon size={16} aria-hidden="true" />
            Categorías
            <CaretDownIcon size={12} aria-hidden="true" />
          </button>
          {menuCats && (
            <div role="menu" className="absolute top-full left-0 z-30 mt-0 min-w-56 rounded-lg border border-linea bg-white py-1 shadow-sm">
              <Link
                role="menuitem"
                to={ROUTES.catalogo}
                onClick={() => setMenuCats(false)}
                className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}
              >
                Todas las categorías
              </Link>
              {categorias.length === 0 ? (
                <p className="px-3 py-2 text-xs text-secundario">Sin categorías cargadas.</p>
              ) : (
                categorias.map((cat) => (
                  <Link
                    key={cat.id}
                    role="menuitem"
                    to={`${ROUTES.catalogo}?categoria=${encodeURIComponent(cat.id)}`}
                    onClick={() => setMenuCats(false)}
                    className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}
                  >
                    {cat.nombre}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <NavLinkItem
          to={ROUTES.comoComprar}
          activo={ubicacion.pathname === ROUTES.comoComprar}
          icono={InfoIcon}
          etiqueta="Cómo comprar"
        />
        <NavLinkItem
          to={`${ROUTES.catalogo}#contacto`}
          activo={ubicacion.hash === '#contacto'}
          icono={ClockIcon}
          etiqueta="Contacto"
        />
      </nav>
    </header>
  )
}

function NavLinkItem({
  to,
  activo,
  icono: Icono,
  etiqueta,
}: {
  to: string
  activo: boolean
  icono: typeof SquaresFourIcon
  etiqueta: string
}) {
  return (
    <Link
      to={to}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold',
        activo ? 'border-mascara text-mascara' : 'border-transparent text-secundario hover:text-tinta',
        FOCUS_RING,
      )}
    >
      <Icono size={16} aria-hidden="true" />
      {etiqueta}
    </Link>
  )
}

function Carrito() {
  const { lineCount } = useCart()
  const etiqueta = lineCount === 1 ? '1 producto' : `${lineCount} productos`

  return (
    <Link
      to={ROUTES.carrito}
      className={`relative grid size-10 place-items-center text-tinta hover:text-mascara ${FOCUS_RING}`}
      aria-label={`Carrito, ${etiqueta}`}
    >
      <ShoppingCartIcon size={22} aria-hidden="true" />
      <span className="absolute top-1 right-0 grid min-w-4 place-items-center rounded-full bg-mascara px-1 text-[10px] font-semibold text-white">
        {lineCount > 99 ? '99+' : lineCount}
      </span>
    </Link>
  )
}

function Cuenta({
  menuRef,
  abierto,
  conSesion,
  nombre,
  onAlternar,
  onCerrar,
  onSalir,
}: {
  menuRef: RefObject<HTMLDivElement | null>
  abierto: boolean
  conSesion: boolean
  nombre: string | null
  onAlternar: () => void
  onCerrar: () => void
  onSalir: () => void
}) {
  const etiqueta = conSesion ? (nombre ?? 'Cuenta') : 'Ingresar'

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={abierto}
        aria-haspopup="menu"
        onClick={onAlternar}
        className={`inline-flex max-w-40 items-center gap-1.5 text-sm font-semibold text-tinta ${FOCUS_RING}`}
      >
        <UserIcon size={18} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{etiqueta}</span>
        <CaretDownIcon size={12} className="shrink-0" aria-hidden="true" />
      </button>
      {abierto && (
        <div role="menu" className="absolute top-9 right-0 z-30 w-52 rounded-lg border border-linea bg-white py-1 shadow-sm">
          {conSesion ? (
            <>
              {nombre && (
                <p className="border-b border-linea px-3 py-2 text-xs text-secundario">
                  Sesión: <span className="font-semibold text-tinta">{nombre}</span>
                </p>
              )}
              <Link role="menuitem" to={ROUTES.misSolicitudes} onClick={onCerrar} className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}>
                Mis solicitudes
              </Link>
              <Link role="menuitem" to={ROUTES.favoritos} onClick={onCerrar} className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}>
                Favoritos
              </Link>
              <Link role="menuitem" to={ROUTES.dashboard} onClick={onCerrar} className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}>
                Panel
              </Link>
              <button role="menuitem" type="button" onClick={onSalir} className={`block w-full px-3 py-2 text-left text-sm hover:bg-suave ${FOCUS_RING}`}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link role="menuitem" to={ROUTES.login} onClick={onCerrar} className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}>
                Ingresar
              </Link>
              <Link role="menuitem" to={ROUTES.registro} onClick={onCerrar} className={`block px-3 py-2 text-sm hover:bg-suave ${FOCUS_RING}`}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
