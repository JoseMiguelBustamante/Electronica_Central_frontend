import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, UserCircleIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { crearCliente, listarClientes } from '../services/clienteService'
import type { Cliente } from '../types/domain'

const columnas: Column<Cliente>[] = [
  { key: 'nombre', header: 'Nombre', primary: true, cell: (row) => row.nombre },
  { key: 'doc', header: 'Documento', cell: (row) => row.documento || '—' },
  { key: 'tel', header: 'Teléfono', cell: (row) => row.telefono || '—' },
  { key: 'correo', header: 'Correo', className: 'break-words', cell: (row) => row.correo || '—' },
]

export default function Clientes() {
  const toast = useToast()
  const [items, setItems] = useState<Cliente[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarClientes().then(
      (lista) => {
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
  }, [intento])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Clientes</h2>
          <p className="mt-1 text-sm text-secundario">Clientes para ventas y solicitudes.</p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nuevo cliente
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando clientes…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar clientes" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso CLIENTES_GESTIONAR.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={UserCircleIcon} title="Sin clientes" description="Registre el primer cliente." />
      ) : (
        <Table caption="Clientes" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioCliente
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearCliente(datos)
            toast.success('Cliente creado.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioCliente({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (datos: { nombre: string; documento?: string; telefono?: string; correo?: string }) => Promise<void>
}) {
  const [nombre, setNombre] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        nombre,
        documento: documento || undefined,
        telefono: telefono || undefined,
        correo: correo || undefined,
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el cliente.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-cliente" loading={ocupado}>Crear</Button>}>
      <form id="form-cliente" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input label="Documento" value={documento} onChange={(e) => setDocumento(e.target.value)} />
        <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <Input label="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
      </form>
    </Modal>
  )
}
