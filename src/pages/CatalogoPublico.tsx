import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowsDownUpIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CubeIcon,
  ListIcon,
  PackageIcon,
  SquaresFourIcon,
  TagIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import LoadingState, { Skeleton } from '../components/LoadingState'
import TarjetaProducto from '../components/tienda/TarjetaProducto'
import { mensajeError } from '../lib/errors'
import {
  listarCatalogoPublico,
  listarFiltrosPublicos,
  type FiltrosCatalogo,
  type ProductoPublico,
} from '../services/catalogoService'
import { FOCUS_RING, cn } from '../utils/styles'

const LIMITE = 20

const FILTROS_VACIOS: FiltrosCatalogo = { categorias: [], marcas: [], modelos: [] }

type Vista = 'grilla' | 'lista'
type Orden = 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre'

function paginaDesde(params: URLSearchParams): number {
  const valor = Number(params.get('pagina') ?? '1')
  return Number.isInteger(valor) && valor > 0 ? valor : 1
}

function paginasVisibles(actual: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1)
  if (actual <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (actual >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', actual - 1, actual, actual + 1, '…', total]
}

export default function CatalogoPublico() {
  const [params, setParams] = useSearchParams()
  const buscar = params.get('buscar') ?? ''
  const idCategoria = params.get('categoria') ?? ''
  const idMarca = params.get('marca') ?? ''
  const idModelo = params.get('modelo') ?? ''
  const pagina = paginaDesde(params)
  const vista: Vista = params.get('vista') === 'lista' ? 'lista' : 'grilla'
  const orden = (params.get('orden') ?? 'recientes') as Orden

  const [productos, setProductos] = useState<ProductoPublico[]>([])
  const [total, setTotal] = useState(0)
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(FILTROS_VACIOS)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [guardados, setGuardados] = useState<Set<string>>(new Set())

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    Promise.all([
      listarCatalogoPublico({ buscar, idCategoria, idMarca, idModelo, pagina, limite: LIMITE }),
      listarFiltrosPublicos(),
    ])
      .then(([paginaCatalogo, opciones]) => {
        if (!vigente) return
        setProductos(paginaCatalogo.productos)
        setTotal(paginaCatalogo.total)
        setFiltros(opciones)
      })
      .catch((causa) => {
        if (!vigente) return
        setProductos([])
        setTotal(0)
        setError(mensajeError(causa, 'No se pudo cargar el catálogo.'))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [buscar, idCategoria, idMarca, idModelo, pagina, intento])

  const visibles = useMemo(() => {
    const lista = [...productos]
    if (orden === 'precio-asc') lista.sort((a, b) => a.precio - b.precio || a.nombre.localeCompare(b.nombre, 'es'))
    if (orden === 'precio-desc') lista.sort((a, b) => b.precio - a.precio || a.nombre.localeCompare(b.nombre, 'es'))
    if (orden === 'nombre') lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return lista
  }, [orden, productos])

  const fijarParametro = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(params)
    if (valor) siguientes.set(clave, valor)
    else siguientes.delete(clave)
    if (clave !== 'pagina' && clave !== 'vista') siguientes.delete('pagina')
    setParams(siguientes)
  }

  const alternarGuardado = (id: string) => {
    setGuardados((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE))

  return (
    <div>
      <h1 className="text-3xl font-semibold text-tinta">Catálogo</h1>
      <p className="mt-1 text-sm text-secundario">
        Precios de mostrador en bolivianos. La solicitud no aparta unidades.
      </p>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-linea bg-white p-3 shadow-sm xl:flex-row xl:items-center">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectorFiltro
            id="categoria"
            etiqueta="Categoría"
            icono={SquaresFourIcon}
            value={idCategoria}
            onChange={(valor) => fijarParametro('categoria', valor)}
            vacio="Todas las categorías"
            opciones={filtros.categorias}
          />
          <SelectorFiltro
            id="marca"
            etiqueta="Marca"
            icono={TagIcon}
            value={idMarca}
            onChange={(valor) => fijarParametro('marca', valor)}
            vacio="Todas las marcas"
            opciones={filtros.marcas}
          />
          <SelectorFiltro
            id="modelo"
            etiqueta="Modelo"
            icono={CubeIcon}
            value={idModelo}
            onChange={(valor) => fijarParametro('modelo', valor)}
            vacio="Todos los modelos"
            opciones={filtros.modelos}
          />
          <SelectorFiltro
            id="orden"
            etiqueta="Ordenar por"
            icono={ArrowsDownUpIcon}
            value={orden === 'recientes' ? '' : orden}
            onChange={(valor) => fijarParametro('orden', valor)}
            vacio="Más recientes"
            opciones={[
              { id: 'precio-asc', nombre: 'Menor precio' },
              { id: 'precio-desc', nombre: 'Mayor precio' },
              { id: 'nombre', nombre: 'Nombre' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-3 xl:pl-2">
          <span className="text-xs text-secundario">Vista</span>
          <div className="flex rounded-lg bg-fondo p-1">
            <button
              type="button"
              aria-pressed={vista === 'grilla'}
              aria-label="Vista en grilla"
              onClick={() => fijarParametro('vista', '')}
              className={cn(
                'grid size-9 place-items-center rounded-md',
                vista === 'grilla' ? 'bg-mascara text-white' : 'text-secundario hover:text-tinta',
                FOCUS_RING,
              )}
            >
              <SquaresFourIcon size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={vista === 'lista'}
              aria-label="Vista en lista"
              onClick={() => fijarParametro('vista', 'lista')}
              className={cn(
                'grid size-9 place-items-center rounded-md',
                vista === 'lista' ? 'bg-mascara text-white' : 'text-secundario hover:text-tinta',
                FOCUS_RING,
              )}
            >
              <ListIcon size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <Alert
            variant="error"
            title="No se pudo leer el catálogo"
            action={
              <Button variant="secondary" onClick={() => setIntento((valor) => valor + 1)}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        </div>
      )}

      {cargando ? (
        <LoadingState label="Cargando catálogo">
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, indice) => (
              <Skeleton key={indice} className="h-64 rounded-xl" />
            ))}
          </div>
        </LoadingState>
      ) : (
        !error &&
        (visibles.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={PackageIcon}
              title="Sin productos"
              description={
                buscar || idCategoria || idMarca || idModelo
                  ? 'Ningún producto activo coincide con esa búsqueda.'
                  : 'Todavía no hay productos activos en el catálogo.'
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secundario">
                {visibles.length} de {total} productos
              </p>
              <Paginador
                pagina={pagina}
                totalPaginas={totalPaginas}
                onCambiar={(numero) => fijarParametro('pagina', numero <= 1 ? '' : String(numero))}
              />
            </div>
            <ul
              className={cn(
                'mt-4',
                vista === 'grilla' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3',
              )}
            >
              {visibles.map((producto) => (
                <li key={producto.id}>
                  <TarjetaProducto
                    producto={producto}
                    vista={vista}
                    guardado={guardados.has(producto.id)}
                    onGuardar={alternarGuardado}
                  />
                </li>
              ))}
            </ul>
          </>
        ))
      )}
    </div>
  )
}

function SelectorFiltro({
  id,
  etiqueta,
  icono: Icono,
  value,
  onChange,
  vacio,
  opciones,
}: {
  id: string
  etiqueta: string
  icono: Icon
  value: string
  onChange: (valor: string) => void
  vacio: string
  opciones: Array<{ id: string; nombre: string }>
}) {
  return (
    <label id={id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1">
      <Icono size={18} className="shrink-0 text-secundario" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-secundario">{etiqueta}</span>
        <span className="relative block">
          <select
            aria-label={etiqueta}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`w-full appearance-none bg-transparent pr-5 text-sm font-medium text-tinta ${FOCUS_RING}`}
          >
            <option value="">{vacio}</option>
            {opciones.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
          <CaretDownIcon
            size={12}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-secundario"
          />
        </span>
      </span>
    </label>
  )
}

function Paginador({
  pagina,
  totalPaginas,
  onCambiar,
}: {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
}) {
  if (totalPaginas <= 1) return null

  return (
    <nav aria-label="Páginas del catálogo" className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={pagina <= 1}
        onClick={() => onCambiar(pagina - 1)}
        className={`grid size-8 place-items-center rounded-md text-secundario disabled:opacity-40 ${FOCUS_RING}`}
      >
        <CaretLeftIcon size={16} aria-hidden="true" />
      </button>
      {paginasVisibles(pagina, totalPaginas).map((elemento, indice) =>
        elemento === '…' ? (
          <span key={`espacio-${indice}`} className="px-1 text-sm text-secundario" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={elemento}
            type="button"
            aria-label={`Ir a la página ${elemento}`}
            aria-current={elemento === pagina ? 'page' : undefined}
            onClick={() => onCambiar(elemento)}
            className={cn(
              'grid size-8 place-items-center rounded-md text-sm',
              elemento === pagina ? 'bg-mascara font-semibold text-white' : 'text-tinta hover:bg-suave',
              FOCUS_RING,
            )}
          >
            {elemento}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Página siguiente"
        disabled={pagina >= totalPaginas}
        onClick={() => onCambiar(pagina + 1)}
        className={`grid size-8 place-items-center rounded-md text-secundario disabled:opacity-40 ${FOCUS_RING}`}
      >
        <CaretRightIcon size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}
