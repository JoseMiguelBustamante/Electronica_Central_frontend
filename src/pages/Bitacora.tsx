import { useMemo, useRef, useState } from 'react'
import { ClipboardTextIcon, FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import type { BadgeVariant } from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { useBitacora } from '../hooks/useBitacora'
import { formatDateTime, toDateKey } from '../utils/formatters'
import type { RegistroBitacora, ResultadoBitacora } from '../types/domain'
import { normalizeText } from '../utils/text'

const TAMANO_PAGINA = 10

type FiltroResultado = 'todos' | ResultadoBitacora

const esFiltroResultado = (valor: string): valor is FiltroResultado =>
  valor === 'todos' || valor === 'exito' || valor === 'advertencia' || valor === 'error'

// Cada resultado combina color, icono y texto: nunca depende solo del color.
const RESULTADOS: Record<ResultadoBitacora, { etiqueta: string; variante: BadgeVariant }> = {
  exito: { etiqueta: 'Éxito', variante: 'success' },
  advertencia: { etiqueta: 'Advertencia', variante: 'warning' },
  error: { etiqueta: 'Error', variante: 'error' },
}

const columnas: Column<RegistroBitacora>[] = [
  {
    key: 'fecha',
    header: 'Fecha',
    className: 'whitespace-nowrap',
    cell: (registro) => <time dateTime={registro.fechaHora}>{formatDateTime(registro.fechaHora)}</time>,
  },
  { key: 'accion', header: 'Acción', primary: true, cell: (registro) => registro.accion },
  {
    key: 'objeto',
    header: 'Objeto afectado',
    className: 'break-words',
    cell: (registro) => registro.objeto,
  },
  {
    key: 'resultado',
    header: 'Resultado',
    cell: (registro) => {
      const { etiqueta, variante } = RESULTADOS[registro.resultado]
      return <Badge variant={variante}>{etiqueta}</Badge>
    },
  },
  { key: 'usuario', header: 'Usuario', className: 'break-words', cell: (registro) => registro.usuario },
]

export default function Bitacora() {
  const { registros, estado, recargar } = useBitacora()
  const [busqueda, setBusqueda] = useState('')
  const [accion, setAccion] = useState('')
  const [usuario, setUsuario] = useState('')
  const [resultado, setResultado] = useState<FiltroResultado>('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const resultadosRef = useRef<HTMLDivElement>(null)

  const acciones = useMemo(
    () => [...new Set(registros.map((r) => r.accion))].sort((a, b) => a.localeCompare(b, 'es')),
    [registros],
  )
  const usuarios = useMemo(
    () => [...new Set(registros.map((r) => r.usuario))].sort((a, b) => a.localeCompare(b, 'es')),
    [registros],
  )

  // Todo cambio de filtro vuelve a la primera pagina.
  const filtrar = (aplicar: () => void) => {
    aplicar()
    setPagina(1)
  }

  const rangoInvalido = desde !== '' && hasta !== '' && desde > hasta
  const texto = normalizeText(busqueda.trim())
  const filtrosActivos = texto !== '' || accion !== '' || usuario !== '' || resultado !== 'todos' || desde !== '' || hasta !== ''

  const filtrados = registros.filter((registro) => {
    if (accion && registro.accion !== accion) return false
    if (usuario && registro.usuario !== usuario) return false
    if (resultado !== 'todos' && registro.resultado !== resultado) return false
    const dia = toDateKey(registro.fechaHora)
    if (desde && dia < desde) return false
    if (hasta && dia > hasta) return false
    if (texto) {
      const coincide = [registro.accion, registro.objeto, registro.usuario].some((campo) =>
        normalizeText(campo).includes(texto),
      )
      if (!coincide) return false
    }
    return true
  })

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA)

  const limpiarFiltros = () => {
    setBusqueda('')
    setAccion('')
    setUsuario('')
    setResultado('todos')
    setDesde('')
    setHasta('')
    setPagina(1)
  }

  const cambiarPagina = (nueva: number) => {
    setPagina(nueva)
    resultadosRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-tinta">Bitácora</h2>
        <p className="mt-1 text-sm text-secundario">
          Consulte el registro de auditoría de las acciones realizadas en el sistema. La información es de solo
          lectura.
        </p>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando bitácora…">
          <div className="space-y-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full sm:w-2/3" />
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar la bitácora"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Ocurrió un problema al obtener los registros. Intente nuevamente.
        </Alert>
      ) : registros.length === 0 ? (
        <EmptyState
          icon={ClipboardTextIcon}
          title="Aún no hay registros en la bitácora"
          description="Las acciones realizadas en el sistema aparecerán aquí."
        />
      ) : (
        <div className="space-y-4">
          <div role="search" aria-label="Buscar y filtrar la bitácora" className="space-y-3">
            <SearchBar
              label="Buscar en la bitácora por acción, objeto o usuario"
              value={busqueda}
              onChange={(valor) => filtrar(() => setBusqueda(valor))}
              placeholder="Buscar por acción, objeto o usuario…"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Select
                label="Acción"
                name="accion"
                value={accion}
                onChange={(event) => filtrar(() => setAccion(event.target.value))}
              >
                <option value="">Todas</option>
                {acciones.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </Select>
              <Select
                label="Usuario"
                name="usuario"
                value={usuario}
                onChange={(event) => filtrar(() => setUsuario(event.target.value))}
              >
                <option value="">Todos</option>
                {usuarios.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </Select>
              <Select
                label="Resultado"
                name="resultado"
                value={resultado}
                onChange={(event) => {
                  const valor = event.target.value
                  if (esFiltroResultado(valor)) filtrar(() => setResultado(valor))
                }}
              >
                <option value="todos">Todos</option>
                <option value="exito">Éxito</option>
                <option value="advertencia">Advertencia</option>
                <option value="error">Error</option>
              </Select>
              <Input
                label="Fecha desde"
                name="desde"
                type="date"
                value={desde}
                onChange={(event) => filtrar(() => setDesde(event.target.value))}
              />
              <Input
                label="Fecha hasta"
                name="hasta"
                type="date"
                value={hasta}
                error={rangoInvalido ? 'La fecha final no puede ser anterior a la inicial.' : undefined}
                onChange={(event) => filtrar(() => setHasta(event.target.value))}
              />
            </div>
          </div>

          <div ref={resultadosRef} className="flex scroll-mt-4 items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-secundario">
              {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
            </p>
            <Button variant="secondary" disabled={!filtrosActivos} onClick={limpiarFiltros}>
              <FunnelXIcon size={18} aria-hidden="true" />
              Limpiar filtros
            </Button>
          </div>

          {filtrados.length > 0 ? (
            <>
              <Table
                caption="Registros de la bitácora de auditoría"
                columns={columnas}
                rows={visibles}
                getRowKey={(registro) => registro.id}
              />
              <Pagination
                page={paginaActual}
                pageSize={TAMANO_PAGINA}
                totalItems={filtrados.length}
                onPageChange={cambiarPagina}
                label="Paginación de la bitácora"
              />
            </>
          ) : (
            <EmptyState
              icon={MagnifyingGlassIcon}
              title="No se encontraron registros"
              description={
                rangoInvalido
                  ? 'Revise el rango de fechas: la fecha final es anterior a la inicial.'
                  : 'Pruebe con otro término de búsqueda o cambie los filtros.'
              }
              action={
                <Button variant="secondary" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
