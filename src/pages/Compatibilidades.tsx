import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { LinkIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
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
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import {
  agregarCompatibilidad,
  listarCompatibilidades,
  listarMarcas,
  listarModelos,
  listarProductosAdmin,
  quitarCompatibilidad,
} from '../services/catalogoService'
import type { Compatibilidad, Marca, Modelo, ProductoAdmin } from '../types/domain'
import { FOCUS_RING, cn } from '../utils/styles'

export default function Compatibilidades() {
  const toast = useToast()
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [estadoModelos, setEstadoModelos] = useState<EstadoCarga>('cargando')
  const [intentoModelos, setIntentoModelos] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ProductoAdmin[]>([])
  const [buscando, setBuscando] = useState(false)
  const [producto, setProducto] = useState<ProductoAdmin | null>(null)
  const [compatibilidades, setCompatibilidades] = useState<Compatibilidad[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
  const [quitando, setQuitando] = useState<Compatibilidad | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([listarMarcas(), listarModelos()]).then(
      ([listaMarcas, listaModelos]) => {
        if (!vigente) return
        setMarcas(listaMarcas)
        setModelos(listaModelos)
        setEstadoModelos('listo')
      },
      () => {
        if (vigente) setEstadoModelos('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intentoModelos])

  useEffect(() => {
    const texto = busqueda.trim()
    if (!texto) return
    let vigente = true
    const temporizador = setTimeout(() => {
      setBuscando(true)
      listarProductosAdmin({ buscar: texto, estado: 'activos', limite: 20 })
        .then(
          (resultado) => {
            if (vigente) setResultados(resultado.productos)
          },
          () => {
            if (vigente) setResultados([])
          },
        )
        .finally(() => {
          if (vigente) setBuscando(false)
        })
    }, 300)
    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [busqueda])

  useEffect(() => {
    if (!producto) return
    let vigente = true
    listarCompatibilidades(producto.id).then(
      (lista) => {
        if (!vigente) return
        setCompatibilidades(lista)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [producto, intento])

  const seleccionar = (elegido: ProductoAdmin) => {
    setEstado('cargando')
    setProducto(elegido)
    setBusqueda('')
  }

  const columnas: Column<Compatibilidad>[] = [
    { key: 'marca', header: 'Marca', cell: (fila) => fila.marca },
    { key: 'modelo', header: 'Modelo', primary: true, cell: (fila) => fila.modelo },
    { key: 'observaciones', header: 'Observaciones', className: 'break-words', cell: (fila) => fila.observaciones || '—' },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (fila) => (
        <Button variant="danger" onClick={() => setQuitando(fila)}>
          <TrashIcon size={18} aria-hidden="true" />
          Quitar
        </Button>
      ),
    },
  ]

  const encontrados = busqueda.trim() ? resultados : []
  const sinModelos = estadoModelos === 'listo' && modelos.length === 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Compatibilidades</h2>
          <p className="mt-1 text-sm text-secundario">
            Elija un producto para ver, agregar o quitar los modelos con los que es compatible (CU-9).
          </p>
        </div>
        <Button onClick={() => setCreando(true)} disabled={!producto || modelos.length === 0}>
          <PlusIcon size={18} aria-hidden="true" />
          Agregar compatibilidad
        </Button>
      </header>

      {sinModelos && (
        <Alert variant="info" title="Faltan datos base">
          No hay modelos registrados. Cree primero marcas y modelos para poder asociarlos a un producto.
        </Alert>
      )}
      {estadoModelos === 'error' && (
        <Alert variant="error" title="No se pudo cargar los modelos" action={<Button variant="secondary" onClick={() => setIntentoModelos((n) => n + 1)}>Reintentar</Button>}>
          Se requiere permiso de catálogo.
        </Alert>
      )}

      <div className="space-y-2">
        <SearchBar label="Buscar producto" value={busqueda} onChange={setBusqueda} placeholder="Código o nombre del producto" />
        {buscando && <p className="text-sm text-secundario">Buscando…</p>}
        {!buscando && busqueda.trim() && encontrados.length === 0 && (
          <p className="text-sm text-secundario">No se encontraron productos activos.</p>
        )}
        {encontrados.length > 0 && (
          <ul className="divide-y divide-linea rounded-md border border-linea bg-superficie" aria-label="Productos encontrados">
            {encontrados.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => seleccionar(item)}
                  className={cn('flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-fondo', FOCUS_RING)}
                >
                  <span className="font-mono text-secundario">{item.codigo}</span>
                  <span className="text-tinta">{item.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!producto ? (
        <EmptyState
          icon={LinkIcon}
          title="Seleccione un producto"
          description="Busque un producto por código o nombre para gestionar sus compatibilidades."
        />
      ) : (
        <section className="space-y-4" aria-labelledby="titulo-producto">
          <h3 id="titulo-producto" className="text-base font-semibold text-tinta">
            <span className="font-mono text-secundario">{producto.codigo}</span> — {producto.nombre}
          </h3>
          {estado === 'cargando' ? (
            <LoadingState label="Cargando compatibilidades…">
              <Skeleton className="h-32" />
            </LoadingState>
          ) : estado === 'error' ? (
            <Alert variant="error" title="No se pudo cargar" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
              Se requiere permiso de catálogo.
            </Alert>
          ) : compatibilidades.length === 0 ? (
            <EmptyState
              icon={LinkIcon}
              title="Sin compatibilidades"
              description="Este producto todavía no está asociado a ningún modelo."
            />
          ) : (
            <Table
              caption={`Modelos compatibles con ${producto.nombre}`}
              columns={columnas}
              rows={compatibilidades}
              getRowKey={(fila) => fila.idModelo}
            />
          )}
        </section>
      )}

      {creando && producto && (
        <FormularioCompatibilidad
          marcas={marcas}
          modelos={modelos}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await agregarCompatibilidad(producto.id, datos.idModelo, datos.observaciones)
            toast.success('Compatibilidad registrada.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {quitando && producto && (
        <ConfirmDialog
          title="Quitar compatibilidad"
          message={`El producto dejará de figurar como compatible con ${quitando.marca} ${quitando.modelo}.`}
          confirmLabel="Quitar"
          variant="danger"
          onCancel={() => setQuitando(null)}
          onConfirm={async () => {
            await quitarCompatibilidad(producto.id, quitando.idModelo)
            toast.success('Compatibilidad quitada.')
            setQuitando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioCompatibilidad({
  marcas,
  modelos,
  onClose,
  onSubmit,
}: {
  marcas: Marca[]
  modelos: Modelo[]
  onClose: () => void
  onSubmit: (datos: { idModelo: string; observaciones?: string }) => Promise<void>
}) {
  const grupos = useMemo(
    () => marcas
      .map((marca) => ({ marca, modelos: modelos.filter((modelo) => modelo.idMarca === marca.id) }))
      .filter((grupo) => grupo.modelos.length > 0),
    [marcas, modelos],
  )
  const [idModelo, setIdModelo] = useState(grupos[0]?.modelos[0]?.id ?? '')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({ idModelo, observaciones: observaciones || undefined })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo asociar.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Agregar compatibilidad" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-compat" loading={ocupado} disabled={!idModelo}>Guardar</Button>}>
      <form id="form-compat" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select label="Modelo" required value={idModelo} onChange={(e) => setIdModelo(e.target.value)}>
          {grupos.map((grupo) => (
            <optgroup key={grupo.marca.id} label={grupo.marca.nombre}>
              {grupo.modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {grupo.marca.nombre} {m.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Input label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </form>
    </Modal>
  )
}
