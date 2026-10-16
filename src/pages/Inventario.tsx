import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PackageIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { claveIdempotencia } from '../lib/idempotency'
import {
  actualizarStockMinimo,
  crearAjuste,
  listarInventario,
} from '../services/inventarioService'
import type { ItemInventario } from '../types/domain'

export default function Inventario() {
  const toast = useToast()
  const [items, setItems] = useState<ItemInventario[]>([])
  const [total, setTotal] = useState(0)
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [buscar, setBuscar] = useState('')
  const [ajuste, setAjuste] = useState<ItemInventario | null>(null)
  const [minimo, setMinimo] = useState<ItemInventario | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarInventario({ buscar: buscar.trim() || undefined, limite: 50, pagina: 1 }).then(
      ({ items: lista, meta }) => {
        if (!vigente) return
        setItems(lista)
        setTotal(meta.total)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento, buscar])

  const columnas: Column<ItemInventario>[] = [
    { key: 'codigo', header: 'Código', cell: (row) => row.codigo },
    { key: 'nombre', header: 'Producto', primary: true, cell: (row) => row.nombre },
    { key: 'stock', header: 'Stock', cell: (row) => row.stockActual },
    { key: 'minimo', header: 'Mínimo', cell: (row) => row.stockMinimo },
    { key: 'caja', header: 'Caja', cell: (row) => row.ubicacionCodigo || '—' },
    {
      key: 'alerta',
      header: 'Alerta',
      cell: (row) => (
        <Badge variant={row.alerta === 'AGOTADO' || row.alerta === 'BAJO' ? 'warning' : 'neutral'}>
          {row.alerta || 'OK'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setAjuste(row)}>
            Ajuste
          </Button>
          <Button variant="secondary" onClick={() => setMinimo(row)}>
            Mínimo
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Inventario</h2>
          <p className="mt-1 text-sm text-secundario">
            Existencias, alertas y ajustes. {total} productos en inventario.
          </p>
        </div>
      </header>

      <SearchBar
        label="Buscar inventario"
        value={buscar}
        onChange={setBuscar}
        placeholder="Código o nombre"
      />

      {estado === 'cargando' ? (
        <LoadingState label="Cargando inventario…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar el inventario"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Se requiere permiso INVENTARIO_CONSULTAR.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={PackageIcon} title="Sin resultados" description="No hay productos para mostrar." />
      ) : (
        <Table caption="Inventario" columns={columnas} rows={items} getRowKey={(row) => row.idProducto} />
      )}

      {ajuste && (
        <FormularioAjuste
          item={ajuste}
          onClose={() => setAjuste(null)}
          onSubmit={async (datos) => {
            await crearAjuste(datos)
            toast.success('Ajuste registrado.')
            setAjuste(null)
            recargar()
          }}
        />
      )}

      {minimo && (
        <FormularioMinimo
          item={minimo}
          onClose={() => setMinimo(null)}
          onSubmit={async (valor) => {
            await actualizarStockMinimo(minimo.idProducto, valor)
            toast.success('Stock mínimo actualizado.')
            setMinimo(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioAjuste({
  item,
  onClose,
  onSubmit,
}: {
  item: ItemInventario
  onClose: () => void
  onSubmit: (datos: {
    idProducto: string
    tipo: 'ENTRADA' | 'SALIDA'
    cantidad: number
    motivo: string
    costoUnitario?: number
    claveIdempotencia: string
  }) => Promise<void>
}) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [cantidad, setCantidad] = useState('1')
  const [motivo, setMotivo] = useState('')
  const [costo, setCosto] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        idProducto: item.idProducto,
        tipo,
        cantidad: Number(cantidad),
        motivo,
        costoUnitario: tipo === 'ENTRADA' ? Number(costo) : undefined,
        claveIdempotencia: claveIdempotencia('ajuste'),
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar el ajuste.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={`Ajuste — ${item.codigo}`}
      onClose={onClose}
      busy={ocupado}
      footer={
        <Button type="submit" form="form-ajuste" loading={ocupado}>
          Guardar
        </Button>
      }
    >
      <form id="form-ajuste" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as 'ENTRADA' | 'SALIDA')} required>
          <option value="ENTRADA">Entrada</option>
          <option value="SALIDA">Salida</option>
        </Select>
        <Input label="Cantidad" type="number" min="0.0001" step="any" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        {tipo === 'ENTRADA' && (
          <Input label="Costo unitario" type="number" min="0" step="any" required value={costo} onChange={(e) => setCosto(e.target.value)} />
        )}
        <Input label="Motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </form>
    </Modal>
  )
}

function FormularioMinimo({
  item,
  onClose,
  onSubmit,
}: {
  item: ItemInventario
  onClose: () => void
  onSubmit: (valor: number) => Promise<void>
}) {
  const [valor, setValor] = useState(String(item.stockMinimo))
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(Number(valor))
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar el mínimo.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={`Stock mínimo — ${item.codigo}`}
      onClose={onClose}
      busy={ocupado}
      footer={
        <Button type="submit" form="form-minimo" loading={ocupado}>
          Guardar
        </Button>
      }
    >
      <form id="form-minimo" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Stock mínimo" type="number" min="0" step="any" required value={valor} onChange={(e) => setValor(e.target.value)} />
      </form>
    </Modal>
  )
}
