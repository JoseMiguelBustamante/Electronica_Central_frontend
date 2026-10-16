import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircleIcon, PackageIcon, PencilSimpleIcon, PlusIcon, ProhibitIcon } from '@phosphor-icons/react'
import ActionMenu from '../components/ActionMenu'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { useToast } from '../hooks/useToast'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { mensajeError } from '../lib/errors'
import {
  cambiarEstadoProducto,
  crearProducto,
  editarProducto,
  listarCategorias,
  listarMarcas,
  listarModelos,
  listarProductosAdmin,
  listarUbicaciones,
  listarUnidades,
  precioConMargen,
} from '../services/catalogoService'
import type { EstadoProductoFiltro } from '../services/catalogoService'
import type { Categoria, DatosProducto, Marca, Modelo, ProductoAdmin, Ubicacion, Unidad } from '../types/domain'
import { formatCurrency } from '../utils/formatters'

const TAMANO_PAGINA = 20

interface Opciones {
  categorias: Categoria[]
  unidades: Unidad[]
  ubicaciones: Ubicacion[]
  marcas: Marca[]
  modelos: Modelo[]
}

const esEstadoFiltro = (valor: string): valor is EstadoProductoFiltro => (
  valor === 'activos' || valor === 'inactivos' || valor === 'todos'
)

export default function Productos() {
  const toast = useToast()
  const [productos, setProductos] = useState<ProductoAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [opciones, setOpciones] = useState<Opciones>({ categorias: [], unidades: [], ubicaciones: [], marcas: [], modelos: [] })
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoProductoFiltro>('todos')
  const [pagina, setPagina] = useState(1)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<ProductoAdmin | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState<ProductoAdmin | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBuscar(busqueda.trim())
      setPagina(1)
    }, 300)
    return () => clearTimeout(temporizador)
  }, [busqueda])

  useEffect(() => {
    let vigente = true
    Promise.all([
      listarCategorias(),
      listarUnidades(),
      listarUbicaciones(),
      listarMarcas(),
      listarModelos(),
    ]).then(
      ([categorias, unidades, ubicaciones, marcas, modelos]) => {
        if (vigente) setOpciones({ categorias, unidades, ubicaciones, marcas, modelos })
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento])

  useEffect(() => {
    let vigente = true
    listarProductosAdmin({ buscar, estado: filtroEstado, pagina, limite: TAMANO_PAGINA }).then(
      (resultado) => {
        if (!vigente) return
        setProductos(resultado.productos)
        setTotal(resultado.total)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [buscar, filtroEstado, pagina, intento])

  const columnas: Column<ProductoAdmin>[] = [
    { key: 'codigo', header: 'Código', cell: (producto) => producto.codigo },
    { key: 'nombre', header: 'Nombre', primary: true, cell: (producto) => producto.nombre },
    { key: 'categoria', header: 'Categoría', cell: (producto) => producto.categoria },
    { key: 'ubicacion', header: 'Ubicación', cell: (producto) => producto.ubicacion },
    {
      key: 'stock',
      header: 'Stock (actual / mínimo)',
      cell: (producto) => `${producto.stockActual} / ${producto.stockMinimo}`,
    },
    { key: 'precioCompra', header: 'Precio compra', cell: (producto) => formatCurrency(producto.precioCompra) },
    { key: 'precioVenta', header: 'Precio venta', cell: (producto) => formatCurrency(producto.precioVenta) },
    {
      key: 'estado',
      header: 'Estado',
      cell: (producto) => (
        <Badge variant={producto.activo ? 'success' : 'neutral'}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (producto) => (
        <ActionMenu
          label={`Acciones de ${producto.nombre}`}
          items={[
            { label: 'Editar', icon: PencilSimpleIcon, onSelect: () => setEditando(producto) },
            producto.activo
              ? { label: 'Desactivar', icon: ProhibitIcon, onSelect: () => setCambiandoEstado(producto) }
              : { label: 'Activar', icon: CheckCircleIcon, onSelect: () => setCambiandoEstado(producto) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Productos</h2>
          <p className="mt-1 text-sm text-secundario">
            Registre, edite, desactive o vuelva a activar productos, con precio de compra, margen y stock mínimo.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nuevo producto
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <SearchBar label="Buscar productos" value={busqueda} onChange={setBusqueda} placeholder="Código o nombre" />
        <Select
          label="Estado"
          name="estado"
          value={filtroEstado}
          onChange={(event) => {
            if (esEstadoFiltro(event.target.value)) {
              setFiltroEstado(event.target.value)
              setPagina(1)
            }
          }}
        >
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </Select>
      </div>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando productos…">
          <Skeleton className="h-64" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar el catálogo" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Verifique la sesión y el permiso de catálogo.
        </Alert>
      ) : productos.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="No hay productos"
          description={buscar || filtroEstado !== 'todos'
            ? 'Pruebe con otro término de búsqueda o cambie el estado.'
            : 'Cree un producto cuando existan categoría, unidad y ubicación.'}
        />
      ) : (
        <div className="space-y-4">
          <Table caption="Productos" columns={columnas} rows={productos} getRowKey={(producto) => producto.id} />
          <Pagination
            page={pagina}
            pageSize={TAMANO_PAGINA}
            totalItems={total}
            onPageChange={setPagina}
            label="Paginación de productos"
          />
        </div>
      )}

      {(creando || editando) && (
        <FormularioProducto
          opciones={opciones}
          inicial={editando}
          onClose={() => {
            setCreando(false)
            setEditando(null)
          }}
          onSubmit={async (datos) => {
            if (editando) {
              await editarProducto(editando.id, datos)
              toast.success('Producto actualizado.')
            } else {
              await crearProducto(datos)
              toast.success('Producto creado.')
            }
            setCreando(false)
            setEditando(null)
            recargar()
          }}
        />
      )}

      {cambiandoEstado && (
        <ConfirmDialog
          title={cambiandoEstado.activo ? 'Desactivar producto' : 'Activar producto'}
          message={cambiandoEstado.activo
            ? 'El producto dejará de mostrarse en el catálogo público.'
            : 'El producto volverá a mostrarse en el catálogo público.'}
          confirmLabel={cambiandoEstado.activo ? 'Desactivar' : 'Activar'}
          variant={cambiandoEstado.activo ? 'danger' : 'primary'}
          onCancel={() => setCambiandoEstado(null)}
          onConfirm={async () => {
            await cambiarEstadoProducto(cambiandoEstado.id, !cambiandoEstado.activo)
            toast.success(cambiandoEstado.activo ? 'Producto desactivado.' : 'Producto activado.')
            setCambiandoEstado(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioProducto({
  opciones,
  inicial,
  onClose,
  onSubmit,
}: {
  opciones: Opciones
  inicial: ProductoAdmin | null
  onClose: () => void
  onSubmit: (datos: DatosProducto) => Promise<void>
}) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [precioCompra, setPrecioCompra] = useState(inicial ? String(inicial.precioCompra) : '0')
  const [margenGanancia, setMargenGanancia] = useState(inicial ? String(inicial.margenGanancia) : '0')
  const [precioVenta, setPrecioVenta] = useState(inicial ? String(inicial.precioVenta) : '')
  const [idCategoria, setIdCategoria] = useState(inicial?.idCategoria ?? opciones.categorias[0]?.id ?? '')
  const [idUnidadMedida, setIdUnidadMedida] = useState(inicial?.idUnidadMedida ?? opciones.unidades[0]?.id ?? '')
  const [idUbicacion, setIdUbicacion] = useState(inicial?.idUbicacion ?? opciones.ubicaciones[0]?.id ?? '')
  const [idMarca, setIdMarca] = useState(inicial?.idMarca ?? '')
  const [idModelo, setIdModelo] = useState(inicial?.idModelo ?? '')
  const [stockMinimo, setStockMinimo] = useState(inicial ? String(inicial.stockMinimo) : '0')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const modelos = opciones.modelos.filter((modelo) => !idMarca || modelo.idMarca === idMarca)
  const listo = idCategoria && idUnidadMedida && idUbicacion

  const recalcularVenta = (compra: string, margen: string) => {
    const valorCompra = Number(compra)
    const valorMargen = Number(margen)
    if (compra !== '' && margen !== '' && Number.isFinite(valorCompra) && Number.isFinite(valorMargen)) {
      setPrecioVenta(String(precioConMargen(valorCompra, valorMargen)))
    }
  }

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
        precioCompra: Number(precioCompra),
        margenGanancia: Number(margenGanancia),
        idCategoria,
        idUnidadMedida,
        idUbicacion,
        idMarca,
        idModelo,
        stockMinimo: Number(stockMinimo),
      })
    } catch (err) {
      setError(mensajeError(err, inicial ? 'No se pudo actualizar el producto.' : 'No se pudo crear el producto.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={inicial ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      busy={ocupado}
      size="lg"
      footer={<Button type="submit" form="form-producto" loading={ocupado} disabled={!listo}>{inicial ? 'Guardar' : 'Crear'}</Button>}
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
        <Input
          label="Precio de compra"
          name="precioCompra"
          type="number"
          min="0"
          step="0.01"
          required
          value={precioCompra}
          onChange={(event) => {
            setPrecioCompra(event.target.value)
            recalcularVenta(event.target.value, margenGanancia)
          }}
        />
        <Input
          label="Margen de ganancia (%)"
          name="margenGanancia"
          type="number"
          min="0"
          step="0.01"
          required
          value={margenGanancia}
          onChange={(event) => {
            setMargenGanancia(event.target.value)
            recalcularVenta(precioCompra, event.target.value)
          }}
        />
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
