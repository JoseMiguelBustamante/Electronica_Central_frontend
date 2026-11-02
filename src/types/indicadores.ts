export type IndicadorId =
  | 'vendidoHoy'
  | 'cobradoHoy'
  | 'porCobrar'
  | 'alertasStock'
  | 'solicitudes'
  | 'comprasPendientes'
  | 'ventasBorrador'
  | 'productos'
  | 'usuarios'

export interface IndicadorResumen {
  id: IndicadorId
  titulo: string
  valor: number
  contexto: string
  /** Si true, valor se muestra como moneda BOB. */
  moneda?: boolean
  to?: string
}

export interface AlertaPanel {
  id: string
  titulo: string
  detalle: string
  to: string
  tono: 'aviso' | 'peligro' | 'info'
}

export interface ColaItem {
  id: string
  titulo: string
  detalle: string
  to: string
}

export interface ActividadPanel {
  id: string
  accion: string
  objeto: string
  usuario: string
  fechaHora: string
  resultado: 'exitoso' | 'error'
}
