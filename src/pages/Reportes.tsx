import { useState } from 'react'
import type { FormEvent } from 'react'
import { ChartBarIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import Select from '../components/Select'
import { mensajeError } from '../lib/errors'
import {
  reporteGanancias,
  reporteInventario,
  reporteRotacion,
  reporteVentas,
} from '../services/reporteService'

type TipoReporte = 'ventas' | 'ganancias' | 'inventario' | 'rotacion'

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function hace30Dias(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export default function Reportes() {
  const [tipo, setTipo] = useState<TipoReporte>('ventas')
  const [desde, setDesde] = useState(hace30Dias())
  const [hasta, setHasta] = useState(hoyIso())
  const [fechaCorte, setFechaCorte] = useState(hoyIso())
  const [resultado, setResultado] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const generar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    setResultado(null)
    try {
      if (tipo === 'ventas') setResultado(await reporteVentas({ desde, hasta }))
      else if (tipo === 'ganancias') setResultado(await reporteGanancias({ desde, hasta }))
      else if (tipo === 'inventario') setResultado(await reporteInventario({ fechaCorte }))
      else setResultado(await reporteRotacion({ desde, hasta }))
    } catch (err) {
      setError(mensajeError(err, 'No se pudo generar el reporte.'))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-tinta">Reportes</h2>
        <p className="mt-1 text-sm text-secundario">
          Ventas, ganancias, inventario y rotación/demanda (Ciclo 4).
        </p>
      </header>

      <form onSubmit={generar} className="grid max-w-3xl gap-4 rounded-lg border border-linea bg-superficie p-4 sm:grid-cols-2">
        <Select
          label="Tipo de reporte"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoReporte)}
        >
          <option value="ventas">Ventas</option>
          <option value="ganancias">Ganancias</option>
          <option value="inventario">Inventario</option>
          <option value="rotacion">Rotación / más vendidos</option>
        </Select>

        {tipo === 'inventario' ? (
          <Input label="Fecha de corte" type="date" required value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} />
        ) : (
          <>
            <Input label="Desde" type="date" required value={desde} onChange={(e) => setDesde(e.target.value)} />
            <Input label="Hasta" type="date" required value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" loading={ocupado}>
            Generar
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="error" title="Error al generar">
          {error}
        </Alert>
      )}

      {!resultado && !error && !ocupado && (
        <EmptyState
          icon={ChartBarIcon}
          title="Sin reporte"
          description="Elija el tipo y el rango, luego pulse Generar."
        />
      )}

      {resultado != null && (
        <section className="overflow-auto rounded-lg border border-linea bg-superficie p-4">
          <h3 className="text-base font-semibold text-tinta">Resultado (JSON)</h3>
          <pre className="mt-3 max-h-[32rem] overflow-auto text-xs text-tinta">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}
