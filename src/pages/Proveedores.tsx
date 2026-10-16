import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, TruckIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { actualizarProveedor, crearProveedor, listarProveedores } from '../services/proveedorService'
import type { Proveedor } from '../types/domain'

export default function Proveedores() {
  const toast = useToast()
  const [items, setItems] = useState<Proveedor[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [buscar, setBuscar] = useState('')
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarProveedores({ buscar: buscar.trim() || undefined, limite: 50 }).then(
      ({ items: lista }) => {
        if (!vigente) return
        setItems(lista)
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

  const columnas: Column<Proveedor>[] = [
    { key: 'razon', header: 'Razón social', primary: true, cell: (row) => row.razonSocial },
    { key: 'doc', header: 'Documento', cell: (row) => row.documento || '—' },
    { key: 'tel', header: 'Teléfono', cell: (row) => row.telefono || '—' },
    { key: 'correo', header: 'Correo', className: 'break-words', cell: (row) => row.correo || '—' },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => <Badge variant={row.activo ? 'success' : 'neutral'}>{row.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (row) => (
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await actualizarProveedor(row.id, { activo: !row.activo })
              toast.success(row.activo ? 'Proveedor desactivado.' : 'Proveedor activado.')
              recargar()
            } catch (err) {
              toast.error(mensajeError(err, 'No se pudo actualizar.'))
            }
          }}
        >
          {row.activo ? 'Desactivar' : 'Activar'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Proveedores</h2>
          <p className="mt-1 text-sm text-secundario">Contactos para compras y reposición.</p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nuevo proveedor
        </Button>
      </header>

      <SearchBar label="Buscar proveedores" value={buscar} onChange={setBuscar} placeholder="Razón social o documento" />

      {estado === 'cargando' ? (
        <LoadingState label="Cargando proveedores…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar proveedores"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Se requiere permiso COMPRAS_GESTIONAR.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={TruckIcon} title="Sin proveedores" description="Registre el primer proveedor." />
      ) : (
        <Table caption="Proveedores" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioProveedor
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearProveedor(datos)
            toast.success('Proveedor creado.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioProveedor({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (datos: {
    razonSocial: string
    documento?: string
    telefono?: string
    correo?: string
    direccion?: string
  }) => Promise<void>
}) {
  const [razonSocial, setRazonSocial] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [direccion, setDireccion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        razonSocial,
        documento: documento || undefined,
        telefono: telefono || undefined,
        correo: correo || undefined,
        direccion: direccion || undefined,
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el proveedor.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Nuevo proveedor"
      onClose={onClose}
      busy={ocupado}
      footer={
        <Button type="submit" form="form-proveedor" loading={ocupado}>
          Crear
        </Button>
      }
    >
      <form id="form-proveedor" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Razón social" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
        <Input label="Documento" value={documento} onChange={(e) => setDocumento(e.target.value)} />
        <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <Input label="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <Input label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </form>
    </Modal>
  )
}
