import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import LoadingState, { Skeleton } from '../components/LoadingState'
import TarjetaProducto from '../components/tienda/TarjetaProducto'
import { mensajeError } from '../lib/errors'
import { alternarFavorito, listarFavoritosIds } from '../lib/favoritosStorage'
import { obtenerProductoPublico, type ProductoPublico } from '../services/catalogoService'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

export default function Favoritos() {
  const [productos, setProductos] = useState<ProductoPublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardados, setGuardados] = useState<Set<string>>(new Set())
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    const ids = listarFavoritosIds()
    setGuardados(new Set(ids))
    if (ids.length === 0) {
      setProductos([])
      setCargando(false)
      setError(null)
      return
    }
    setCargando(true)
    setError(null)
    Promise.all(ids.map((id) => obtenerProductoPublico(id).catch(() => null)))
      .then((lista) => {
        if (!vigente) return
        setProductos(lista.filter((item): item is ProductoPublico => item != null))
      })
      .catch((causa) => {
        if (!vigente) return
        setError(mensajeError(causa, 'No se pudieron cargar los favoritos.'))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [intento])

  const quitarFavorito = (id: string) => {
    alternarFavorito(id)
    const ids = listarFavoritosIds()
    setGuardados(new Set(ids))
    setProductos((lista) => lista.filter((p) => p.id !== id))
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-tinta">Favoritos</h1>
      <p className="mt-1 text-sm text-secundario">
        Guardados en este dispositivo. Usá el corazón en las tarjetas del catálogo.
      </p>

      {error && (
        <div className="mt-6">
          <Alert
            variant="error"
            title="Error al cargar favoritos"
            action={(
              <Button variant="secondary" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Button>
            )}
          >
            {error}
          </Alert>
        </div>
      )}

      {cargando ? (
        <LoadingState label="Cargando favoritos">
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </LoadingState>
      ) : productos.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={HeartIcon}
            title="Sin favoritos"
            description="Marcá productos con el corazón en el catálogo para verlos aquí."
            action={(
              <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
                <Button>Ir al catálogo</Button>
              </Link>
            )}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <li key={producto.id}>
              <TarjetaProducto
                producto={producto}
                vista="grilla"
                guardado={guardados.has(producto.id)}
                onGuardar={quitarFavorito}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
