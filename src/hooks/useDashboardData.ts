import { useEffect, useState } from 'react'
import { obtenerSesion } from '../services/authService'
import { listarRegistrosBitacora } from '../services/bitacoraService'
import { listarProductosAdmin } from '../services/catalogoService'
import { listarCompras } from '../services/compraService'
import { listarAlertasInventario } from '../services/inventarioService'
import { reporteVentas } from '../services/reporteService'
import { listarSolicitudes } from '../services/solicitudService'
import { listarUsuarios } from '../services/usuarioService'
import { listarVentas } from '../services/ventaService'
import type {
  ActividadPanel,
  AlertaPanel,
  ColaItem,
  IndicadorResumen,
} from '../types/indicadores'
import type { SesionUsuario } from '../types/domain'
import { ROUTES } from '../utils/navigation'
import { toDateKey } from '../utils/formatters'

function hoyIsoLocal(): string {
  return toDateKey(new Date().toISOString())
}

export function useDashboardData() {
  const [cargando, setCargando] = useState(true)
  const [sesion, setSesion] = useState<SesionUsuario | null>(null)
  const [indicadores, setIndicadores] = useState<IndicadorResumen[]>([])
  const [sistema, setSistema] = useState<IndicadorResumen[]>([])
  const [alertas, setAlertas] = useState<AlertaPanel[]>([])
  const [cola, setCola] = useState<ColaItem[]>([])
  const [actividad, setActividad] = useState<ActividadPanel[]>([])

  useEffect(() => {
    let vigente = true
    const hoy = hoyIsoLocal()

    Promise.allSettled([
      obtenerSesion(),
      reporteVentas({ desde: hoy, hasta: hoy }),
      listarVentas({ estado: 'BORRADOR', limite: 50, pagina: 1 }),
      listarVentas({ limite: 50, pagina: 1 }),
      listarAlertasInventario({ limite: 8, pagina: 1 }),
      listarSolicitudes({ estado: 'PENDIENTE', limite: 50, pagina: 1 }),
      listarCompras({ estado: 'PENDIENTE', limite: 50, pagina: 1 }),
      listarProductosAdmin({ limite: 1, pagina: 1 }),
      listarUsuarios(),
      listarRegistrosBitacora(),
    ]).then((results) => {
      if (!vigente) return

      const [
        sesionR,
        ventasHoyR,
        borradoresR,
        ventasRecientesR,
        alertasInvR,
        solicitudesR,
        comprasR,
        productosR,
        usuariosR,
        bitacoraR,
      ] = results

      if (sesionR.status === 'fulfilled') setSesion(sesionR.value)

      const ops: IndicadorResumen[] = []
      const alertasUi: AlertaPanel[] = []
      const colaUi: ColaItem[] = []

      if (ventasHoyR.status === 'fulfilled') {
        const { vendido, cobrado } = ventasHoyR.value.resumen
        ops.push({
          id: 'vendidoHoy',
          titulo: 'Vendido hoy',
          valor: vendido,
          contexto: 'Ventas confirmadas del día',
          moneda: true,
          to: ROUTES.reportes,
        })
        ops.push({
          id: 'cobradoHoy',
          titulo: 'Cobrado hoy',
          valor: cobrado,
          contexto: 'Pagos registrados hoy',
          moneda: true,
          to: ROUTES.ventas,
        })
      }

      let porCobrar = 0
      if (ventasRecientesR.status === 'fulfilled') {
        for (const venta of ventasRecientesR.value.items) {
          const saldo = Number(venta.saldo ?? 0)
          if (venta.estado !== 'ANULADA' && saldo > 0) porCobrar += saldo
        }
      }
      ops.push({
        id: 'porCobrar',
        titulo: 'Por cobrar',
        valor: porCobrar,
        contexto: 'Saldo pendiente (últimas ventas)',
        moneda: true,
        to: ROUTES.ventas,
      })

      // Usar stock REAL (existencia), no el snapshot de Reportes (reconstruye por movimientos).
      const alertasItems = alertasInvR.status === 'fulfilled' ? alertasInvR.value.items : []
      const alertasTotal = alertasInvR.status === 'fulfilled' ? alertasInvR.value.meta.total : 0
      const hayAgotado = alertasItems.some((i) => i.alerta === 'AGOTADO' || i.stockActual <= 0)

      ops.push({
        id: 'alertasStock',
        titulo: 'Alertas de stock',
        valor: alertasTotal,
        contexto:
          alertasTotal > 0
            ? 'Según stock actual en inventario'
            : 'Sin productos agotados ni bajo mínimo',
        to: ROUTES.inventario,
      })

      if (alertasTotal > 0) {
        alertasUi.push({
          id: 'stock',
          titulo: 'Inventario requiere atención',
          detalle: `${alertasTotal} producto(s) con alerta de stock.`,
          to: ROUTES.inventario,
          tono: hayAgotado ? 'peligro' : 'aviso',
        })
        for (const item of alertasItems.slice(0, 5)) {
          alertasUi.push({
            id: `inv-${item.idProducto}`,
            titulo: `${item.codigo} · ${item.alerta || 'Alerta'}`,
            detalle: `${item.nombre} · stock ${item.stockActual} (mín. ${item.stockMinimo})`,
            to: ROUTES.inventario,
            tono: item.stockActual <= 0 ? 'peligro' : 'aviso',
          })
        }
      }

      const solicitudesN =
        solicitudesR.status === 'fulfilled' ? solicitudesR.value.meta.total : 0
      ops.push({
        id: 'solicitudes',
        titulo: 'Solicitudes pendientes',
        valor: solicitudesN,
        contexto: 'Pedidos de productos no disponibles',
        to: ROUTES.solicitudes,
      })
      if (solicitudesR.status === 'fulfilled') {
        for (const s of solicitudesR.value.items.slice(0, 4)) {
          colaUi.push({
            id: `sol-${s.id}`,
            titulo: `Solicitud · ${s.clienteNombre || 'Cliente'}`,
            detalle: `${s.descripcionProducto} × ${s.cantidad}`,
            to: ROUTES.solicitudes,
          })
        }
      }

      const comprasN = comprasR.status === 'fulfilled' ? comprasR.value.meta.total : 0
      ops.push({
        id: 'comprasPendientes',
        titulo: 'Compras por recibir',
        valor: comprasN,
        contexto: 'Órdenes pendientes de recepción',
        to: ROUTES.compras,
      })
      if (comprasR.status === 'fulfilled') {
        for (const c of comprasR.value.items.slice(0, 3)) {
          colaUi.push({
            id: `com-${c.id}`,
            titulo: `Compra ${c.numeroComprobante || c.id.slice(0, 8)}`,
            detalle: `${c.proveedorNombre || 'Proveedor'} · ${c.fecha}`,
            to: ROUTES.compras,
          })
        }
      }

      const borradoresN = borradoresR.status === 'fulfilled' ? borradoresR.value.meta.total : 0
      ops.push({
        id: 'ventasBorrador',
        titulo: 'Ventas en borrador',
        valor: borradoresN,
        contexto: 'Pendientes de cobro o confirmación',
        to: ROUTES.ventas,
      })
      if (borradoresR.status === 'fulfilled' && borradoresN > 0) {
        alertasUi.unshift({
          id: 'borradores',
          titulo: `${borradoresN} venta(s) en borrador`,
          detalle: 'Revisá cobros pendientes en Ventas.',
          to: ROUTES.ventas,
          tono: 'info',
        })
        for (const v of borradoresR.value.items.slice(0, 3)) {
          colaUi.push({
            id: `ven-${v.id}`,
            titulo: `Venta borrador · ${v.clienteNombre || 'Cliente'}`,
            detalle: v.resumenProductos || v.fechaHora,
            to: ROUTES.ventas,
          })
        }
      }

      const sistemaItems: IndicadorResumen[] = []
      if (productosR.status === 'fulfilled') {
        sistemaItems.push({
          id: 'productos',
          titulo: 'Productos',
          valor: productosR.value.total,
          contexto: 'En catálogo (admin)',
          to: ROUTES.productos,
        })
      }
      if (usuariosR.status === 'fulfilled') {
        const activos = usuariosR.value.filter((u) => u.activo).length
        sistemaItems.push({
          id: 'usuarios',
          titulo: 'Usuarios',
          valor: usuariosR.value.length,
          contexto: `${activos} activos`,
          to: ROUTES.usuarios,
        })
      }

      if (bitacoraR.status === 'fulfilled') {
        setActividad(
          bitacoraR.value.slice(0, 6).map((registro) => ({
            id: registro.id,
            accion: registro.accion,
            objeto: registro.objeto,
            usuario: registro.usuario,
            fechaHora: registro.fechaHora,
            resultado: registro.resultado === 'exito' ? 'exitoso' : 'error',
          })),
        )
      }

      setIndicadores(ops)
      setSistema(sistemaItems)
      setAlertas(alertasUi.slice(0, 8))
      setCola(colaUi.slice(0, 8))
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [])

  return { cargando, sesion, indicadores, sistema, alertas, cola, actividad }
}
