import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { PackageIcon, PlusIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { useToast } from '../hooks/useToast'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { mensajeError } from '../lib/errors'
import {
  crearProducto,
  desactivarProducto,
  listarCategorias,
  listarMarcas,
  listarModelos,
  listarProductos,
  listarUbicaciones,
  listarUnidades,
} from '../services/catalogoService'
import type { Categoria, Marca, Modelo, Producto, Ubicacion, Unidad } from '../types/domain'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { normalizeText } from '../utils/text'

interface Opciones {
  categorias: Categoria[]
  unidades: Unidad[]
  ubicaciones: Ubicacion[]
  marcas: Marca[]
  modelos: Modelo[]
}

export default function Productos() {
  const toast = useToast()
  const [productos, setProductos] = useState<Producto[]>([])
  const [opciones, setOpciones] = useState<Opciones>({ categorias: [], unidades: [], ubicaciones: [], marcas: [], modelos: [] })
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [creando, setCreando] = useState(false)
  const [desactivarId, setDesactivarId] = useState<string | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([
      listarProductos(),
      listarCategorias(),
      listarUnidades(),
      listarUbicaciones(),
      listarMarcas(),
      listarModelos(),
    ]).then(
      ([lista, categorias, unidades, ubicaciones, marcas, modelos]) => {
        if (!vigente) return
        setProductos(lista)
        setOpciones({ categorias, unidades, ubicaciones, marcas, modelos })
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento])

  const texto = normalizeText(busqueda.trim())
  const visibles = useMemo(
    () => productos.filter((producto) => {
      if (!texto) return true
      return [producto.codigo, producto.nombre, producto.categoria, producto.marca, producto.modelo]
        .some((campo) => normalizeText(campo).includes(texto))
    }),
    [productos, texto],
  )

  const columnas: Column<Producto>[] = [
    { key: 'codigo', header: 'Código', cell: (producto) => producto.codigo },
    { key: 'nombre', header: 'Nombre', primary: true, cell: (producto) => producto.nombre },
    { key: 'categoria', header: 'Categoría', cell: (producto) => producto.categoria },
    { key: 'precio', header: 'Precio', cell: (producto) => formatCurrency(producto.precio) },
    {
      key: 'creadoEn',
      header: 'Creado',
      cell: (producto) => (
        producto.creadoEn
          ? <time dateTime={producto.creadoEn}>{formatDateTime(producto.creadoEn)}</time>
          : '—'
      ),
    },
    {
      key: 'disponibilidad',
      header: 'Disponibilidad',
      cell: (producto) => (
        <Badge variant={producto.disponibilidad === 'DISPONIBLE' ? 'success' : 'neutral'}>
          {producto.disponibilidad === 'DISPONIBLE' ? 'Disponible' : 'No disponible'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (producto) => (
        <Button variant="danger" onClick={() => setDesactivarId(producto.id)}>Desactivar</Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Productos</h2>
          <p className="mt-1 text-sm text-secundario">
            Catálogo activo. Se puede crear un producto y desactivarlo. La API no permite editarlo ni volver a activarlo.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nuevo producto
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando productos…">
          <Skeleton className="h-64" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar el catálogo" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Verifique la sesión y el permiso de catálogo.
        </Alert>
      ) : productos.length === 0 ? (
        <EmptyState icon={PackageIcon} title="No hay productos activos" description="Cree un producto cuando existan categoría, unidad y ubicación." />
      ) : (
        <div className="space-y-4">
          <SearchBar label="Buscar productos" value={busqueda} onChange={setBusqueda} placeholder="Código, nombre, categoría o marca" />
          <Table caption="Productos activos" columns={columnas} rows={visibles} getRowKey={(producto) => producto.id} />
        </div>
      )}

      {creando && (
        <FormularioProducto
          opciones={opciones}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearProducto(datos)
            toast.success('Producto creado.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {desactivarId && (
        <ConfirmDialog
          title="Desactivar producto"
          message="El producto dejará de mostrarse en el catálogo público."
          confirmLabel="Desactivar"
          variant="danger"
          onCancel={() => setDesactivarId(null)}
          onConfirm={async () => {
            await desactivarProducto(desactivarId)
            toast.success('Producto desactivado.')
            setDesactivarId(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioProducto({
  opciones,
  onClose,
  onSubmit,
}: {
  opciones: Opciones
  onClose: () => void
  onSubmit: (datos: {
    codigo: string
    nombre: string
    descripcion: string
    precioVenta: number
    idCategoria: string
    idUnidadMedida: string
    idUbicacion: string
    idMarca: string
    idModelo: string
    stockMinimo: number
  }) => Promise<void>
}) {
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [idCategoria, setIdCategoria] = useState(opciones.categorias[0]?.id ?? '')
  const [idUnidadMedida, setIdUnidadMedida] = useState(opciones.unidades[0]?.id ?? '')
  const [idUbicacion, setIdUbicacion] = useState(opciones.ubicaciones[0]?.id ?? '')
  const [idMarca, setIdMarca] = useState('')
  const [idModelo, setIdModelo] = useState('')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const modelos = opciones.modelos.filter((modelo) => !idMarca || modelo.idMarca === idMarca)
  const listo = idCategoria && idUnidadMedida && idUbicacion

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        codigo,
        nombre,
        descripcion,
        precioVenta: Number(precioVenta),
        idCategoria,
        idUnidadMedida,
        idUbicacion,
        idMarca,
        idModelo,
        stockMinimo: Number(stockMinimo),
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el producto.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Nuevo producto"
      onClose={onClose}
      busy={ocupado}
      size="lg"
      footer={<Button type="submit" form="form-producto" loading={ocupado} disabled={!listo}>Crear</Button>}
    >
      <form id="form-producto" onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        {error && <p className="text-sm text-peligro sm:col-span-2">{error}</p>}
        {!listo && (
          <p className="text-sm text-secundario sm:col-span-2">
            Antes de crear un producto deben existir al menos una categoría, una unidad y una ubicación.
          </p>
        )}
        <Input label="Código" name="codigo" required value={codigo} onChange={(event) => setCodigo(event.target.value)} />
        <Input label="Nombre" name="nombre" required value={nombre} onChange={(event) => setNombre(event.target.value)} />
        <Input label="Precio de venta" name="precioVenta" type="number" min="0" step="0.01" required value={precioVenta} onChange={(event) => setPrecioVenta(event.target.value)} />
        <Input label="Stock mínimo" name="stockMinimo" type="number" min="0" step="0.01" required value={stockMinimo} onChange={(event) => setStockMinimo(event.target.value)} />
        <Select label="Categoría" name="idCategoria" required value={idCategoria} onChange={(event) => setIdCategoria(event.target.value)}>
          {opciones.categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
        </Select>
        <Select label="Unidad" name="idUnidadMedida" required value={idUnidadMedida} onChange={(event) => setIdUnidadMedida(event.target.value)}>
          {opciones.unidades.map((unidad) => <option key={unidad.id} value={unidad.id}>{unidad.nombre} ({unidad.simbolo})</option>)}
        </Select>
        <Select label="Ubicación" name="idUbicacion" required value={idUbicacion} onChange={(event) => setIdUbicacion(event.target.value)}>
          {opciones.ubicaciones.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.codigo} · {ubicacion.pasillo} / {ubicacion.estante}</option>
          ))}
        </Select>
        <Select label="Marca" name="idMarca" value={idMarca} onChange={(event) => { setIdMarca(event.target.value); setIdModelo('') }}>
          <option value="">Sin marca</option>
          {opciones.marcas.map((marca) => <option key={marca.id} value={marca.id}>{marca.nombre}</option>)}
        </Select>
        <Select label="Modelo" name="idModelo" value={idModelo} onChange={(event) => setIdModelo(event.target.value)}>
          <option value="">Sin modelo</option>
          {modelos.map((modelo) => <option key={modelo.id} value={modelo.id}>{modelo.nombre}</option>)}
        </Select>
        <div className="sm:col-span-2">
          <Input label="Descripción" name="descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        </div>
      </form>
    </Modal>
  )
}
