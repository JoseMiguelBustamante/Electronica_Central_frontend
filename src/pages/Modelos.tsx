import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CubeIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import ActionMenu from '../components/ActionMenu'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { crearModelo, editarModelo, eliminarModelo, listarMarcas, listarModelos } from '../services/catalogoService'
import type { Marca, Modelo } from '../types/domain'

export default function Modelos() {
  const toast = useToast()
  const [items, setItems] = useState<Modelo[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Modelo | null>(null)
  const [eliminando, setEliminando] = useState<Modelo | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([listarModelos(), listarMarcas()]).then(
      ([modelos, listaMarcas]) => {
        if (!vigente) return
        setItems(modelos)
        setMarcas(listaMarcas)
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

  const nombreMarca = (id: string) => marcas.find((m) => m.id === id)?.nombre ?? id

  const columnas: Column<Modelo>[] = [
    { key: 'nombre', header: 'Modelo', primary: true, cell: (row) => row.nombre },
    { key: 'marca', header: 'Marca', cell: (row) => nombreMarca(row.idMarca) },
    { key: 'descripcion', header: 'Descripción', className: 'break-words', cell: (row) => row.descripcion || '—' },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (row) => (
        <ActionMenu
          label={`Acciones de ${row.nombre}`}
          items={[
            { label: 'Editar', icon: PencilSimpleIcon, onSelect: () => setEditando(row) },
            { label: 'Eliminar', icon: TrashIcon, onSelect: () => setEliminando(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Modelos</h2>
          <p className="mt-1 text-sm text-secundario">
            Alta, edición y eliminación de modelos por marca. No se puede eliminar un modelo usado en productos o compatibilidades.
          </p>
        </div>
        <Button onClick={() => setCreando(true)} disabled={marcas.length === 0}>
          <PlusIcon size={18} aria-hidden="true" />
          Nuevo modelo
        </Button>
      </header>

      {marcas.length === 0 && estado === 'listo' && (
        <Alert variant="info" title="Primero cree marcas">
          Necesita al menos una marca antes de registrar modelos.
        </Alert>
      )}

      {estado === 'cargando' ? (
        <LoadingState label="Cargando modelos…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar modelos" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso de catálogo.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={CubeIcon} title="Sin modelos" description="Cree el primer modelo." />
      ) : (
        <Table caption="Modelos" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioModelo
          marcas={marcas}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearModelo(datos)
            toast.success('Modelo creado.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {editando && (
        <FormularioModelo
          marcas={marcas}
          inicial={editando}
          onClose={() => setEditando(null)}
          onSubmit={async (datos) => {
            await editarModelo(editando.id, { ...datos, descripcion: datos.descripcion ?? '' })
            toast.success('Modelo actualizado.')
            setEditando(null)
            recargar()
          }}
        />
      )}

      {eliminando && (
        <ConfirmDialog
          title="Eliminar modelo"
          message={`Se eliminará el modelo «${eliminando.nombre}».`}
          confirmLabel="Eliminar"
          variant="danger"
          onCancel={() => setEliminando(null)}
          onConfirm={async () => {
            await eliminarModelo(eliminando.id)
            toast.success('Modelo eliminado.')
            setEliminando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioModelo({
  marcas,
  inicial,
  onClose,
  onSubmit,
}: {
  marcas: Marca[]
  inicial?: Modelo
  onClose: () => void
  onSubmit: (datos: { nombre: string; descripcion?: string; idMarca: string }) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [idMarca, setIdMarca] = useState(inicial?.idMarca ?? marcas[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({ nombre, descripcion: descripcion || undefined, idMarca })
    } catch (err) {
      setError(mensajeError(err, inicial ? 'No se pudo guardar el modelo.' : 'No se pudo crear el modelo.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={inicial ? 'Editar modelo' : 'Nuevo modelo'}
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-modelo" loading={ocupado}>{inicial ? 'Guardar' : 'Crear'}</Button>}
    >
      <form id="form-modelo" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select label="Marca" required value={idMarca} onChange={(e) => setIdMarca(e.target.value)}>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </Select>
        <Input label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </form>
    </Modal>
  )
}
