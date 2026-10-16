import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, TagIcon } from '@phosphor-icons/react'
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
import { crearMarca, listarMarcas } from '../services/catalogoService'
import type { Marca } from '../types/domain'

const columnas: Column<Marca>[] = [
  { key: 'nombre', header: 'Nombre', primary: true, cell: (row) => row.nombre },
]

export default function Marcas() {
  const toast = useToast()
  const [items, setItems] = useState<Marca[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarMarcas().then(
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
          <h2 className="text-xl font-semibold text-tinta">Marcas</h2>
          <p className="mt-1 text-sm text-secundario">Marcas del catálogo para productos y modelos.</p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva marca
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando marcas…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar marcas" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso de catálogo.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={TagIcon} title="Sin marcas" description="Cree la primera marca." />
      ) : (
        <Table caption="Marcas" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioMarca
          onClose={() => setCreando(false)}
          onSubmit={async (nombre) => {
            await crearMarca(nombre)
            toast.success('Marca creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioMarca({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (nombre: string) => Promise<void>
}) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(nombre)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la marca.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Nueva marca" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-marca" loading={ocupado}>Crear</Button>}>
      <form id="form-marca" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </form>
    </Modal>
  )
}
