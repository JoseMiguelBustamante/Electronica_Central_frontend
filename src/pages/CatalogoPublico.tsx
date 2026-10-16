import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackageIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Disponibilidad from '../components/tienda/Disponibilidad'
import { mensajeError } from '../lib/errors'
import {
  listarCatalogoPublico,
  listarFiltrosPublicos,
  type FiltrosCatalogo,
  type ProductoPublico,
} from '../services/catalogoService'
import { formatCurrency } from '../utils/formatters'
import { FOCUS_RING } from '../utils/styles'

const LIMITE = 20

const FILTROS_VACIOS: FiltrosCatalogo = { categorias: [], marcas: [], modelos: [] }

export default function CatalogoPublico() {
  const [params, setParams] = useSearchParams()
  const buscar = params.get('buscar') ?? ''
  const idCategoria = params.get('categoria') ?? ''
  const idMarca = params.get('marca') ?? ''
  const idModelo = params.get('modelo') ?? ''

  const [productos, setProductos] = useState<ProductoPublico[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(FILTROS_VACIOS)
  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    Promise.all([
      listarCatalogoPublico({ buscar, idCategoria, idMarca, idModelo, pagina: 1, limite: LIMITE }),
      listarFiltrosPublicos(),
    ])
      .then(([paginaCatalogo, opciones]) => {
        if (!vigente) return
        setProductos(paginaCatalogo.productos)
        setTotal(paginaCatalogo.total)
        setPagina(1)
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
  }, [buscar, idCategoria, idMarca, idModelo, intento])

  const fijarParametro = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(params)
    if (valor) siguientes.set(clave, valor)
    else siguientes.delete(clave)
    setParams(siguientes)
  }

  const verMas = async () => {
    const siguiente = pagina + 1
    setCargandoMas(true)
    setError(null)
    try {
      const paginaCatalogo = await listarCatalogoPublico({
        buscar,
        idCategoria,
        idMarca,
        idModelo,
        pagina: siguiente,
        limite: LIMITE,
      })
      setProductos((actuales) => [...actuales, ...paginaCatalogo.productos])
      setTotal(paginaCatalogo.total)
      setPagina(siguiente)
    } catch (causa) {
      setError(mensajeError(causa, 'No se pudo cargar más productos.'))
    } finally {
      setCargandoMas(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-tinta">Catálogo</h1>
      <p className="mt-1 text-sm text-secundario">
        Precios de mostrador en bolivianos. La solicitud no aparta unidades.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm text-secundario">
          Categoría
          <select
            value={idCategoria}
            onChange={(event) => fijarParametro('categoria', event.target.value)}
            className={`mt-1 block h-11 w-full rounded-md border border-campo bg-superficie px-3 text-sm text-tinta ${FOCUS_RING}`}
          >
            <option value="">Todas</option>
            {filtros.categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-secundario">
          Marca
          <select
            value={idMarca}
            onChange={(event) => fijarParametro('marca', event.target.value)}
            className={`mt-1 block h-11 w-full rounded-md border border-campo bg-superficie px-3 text-sm text-tinta ${FOCUS_RING}`}
          >
            <option value="">Todas</option>
            {filtros.marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-secundario sm:col-span-2 lg:col-span-1">
          Modelo
          <select
            value={idModelo}
            onChange={(event) => fijarParametro('modelo', event.target.value)}
            className={`mt-1 block h-11 w-full rounded-md border border-campo bg-superficie px-3 text-sm text-tinta ${FOCUS_RING}`}
          >
            <option value="">Todos</option>
            {filtros.modelos.map((modelo) => (
              <option key={modelo.id} value={modelo.id}>
                {modelo.nombre}
              </option>
            ))}
          </select>
        </label>
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
              <Skeleton key={indice} className="h-44" />
            ))}
          </div>
        </LoadingState>
      ) : (
        !error &&
        (productos.length === 0 ? (
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
            <p className="mt-6 font-mono text-sm text-secundario">
              {productos.length} de {total} productos
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((producto) => (
                <li key={producto.id}>
                  <Link
                    to={`/catalogo/${producto.id}`}
                    className={`flex h-full flex-col rounded-lg border border-linea bg-superficie p-4 hover:border-mascara ${FOCUS_RING}`}
                  >
                    <p className="text-xs font-semibold tracking-wide text-secundario uppercase">
                      {producto.categoria}
                    </p>
                    <p className="mt-2 text-base font-semibold text-tinta">{producto.nombre}</p>
                    <p className="mt-1 font-mono text-xs text-secundario">{producto.codigo}</p>
                    <p className="mt-3 font-mono text-lg text-cobre">{formatCurrency(producto.precio)}</p>
                    <div className="mt-auto pt-3">
                      <Disponibilidad valor={producto.disponibilidad} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {productos.length < total && (
              <div className="mt-6">
                <Button variant="secondary" loading={cargandoMas} onClick={verMas}>
                  Ver más
                </Button>
              </div>
            )}
          </>
        ))
      )}
    </div>
  )
}
