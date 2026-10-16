import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { LinkIcon, PlusIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Select from '../components/Select'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import {
  agregarCompatibilidad,
  listarModelos,
  listarProductos,
} from '../services/catalogoService'
import type { Modelo, Producto } from '../types/domain'

export default function Compatibilidades() {
  const toast = useToast()
  const [productos, setProductos] = useState<Producto[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([listarProductos(), listarModelos()]).then(
      ([listaProductos, listaModelos]) => {
        if (!vigente) return
        setProductos(listaProductos)
        setModelos(listaModelos)
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
          <h2 className="text-xl font-semibold text-tinta">Compatibilidades</h2>
          <p className="mt-1 text-sm text-secundario">
            Asocia un producto del catálogo con un modelo compatible (CU-9).
          </p>
        </div>
        <Button onClick={() => setCreando(true)} disabled={productos.length === 0 || modelos.length === 0}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva asociación
        </Button>
      </header>

      {estado === 'listo' && (productos.length === 0 || modelos.length === 0) && (
        <Alert variant="info" title="Faltan datos base">
          Necesita productos y al menos un modelo (cree marcas y modelos primero).
        </Alert>
      )}

      {estado === 'cargando' ? (
        <LoadingState label="Cargando…">
          <Skeleton className="h-32" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso de catálogo.
        </Alert>
      ) : (
        <EmptyState
          icon={LinkIcon}
          title="Gestión por asociación"
          description="Use «Nueva asociación» para vincular producto ↔ modelo. La API no lista compatibilidades globales; consulte por producto en operaciones posteriores."
        />
      )}

      {creando && (
        <FormularioCompatibilidad
          productos={productos}
          modelos={modelos}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await agregarCompatibilidad(datos.idProducto, datos.idModelo, datos.observaciones)
            toast.success('Compatibilidad registrada.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioCompatibilidad({
  productos,
  modelos,
  onClose,
  onSubmit,
}: {
  productos: Producto[]
  modelos: Modelo[]
  onClose: () => void
  onSubmit: (datos: { idProducto: string; idModelo: string; observaciones?: string }) => Promise<void>
}) {
  const [idProducto, setIdProducto] = useState(productos[0]?.id ?? '')
  const [idModelo, setIdModelo] = useState(modelos[0]?.id ?? '')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({ idProducto, idModelo, observaciones: observaciones || undefined })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo asociar.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Nueva compatibilidad" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-compat" loading={ocupado}>Guardar</Button>}>
      <form id="form-compat" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select label="Producto" required value={idProducto} onChange={(e) => setIdProducto(e.target.value)}>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} — {p.nombre}
            </option>
          ))}
        </Select>
        <Select label="Modelo" required value={idModelo} onChange={(e) => setIdModelo(e.target.value)}>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </Select>
        <Input label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </form>
    </Modal>
  )
}
