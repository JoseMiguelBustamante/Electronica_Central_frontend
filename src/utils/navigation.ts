import {
  ChartBarIcon,
  ClipboardTextIcon,
  CubeIcon,
  LinkIcon,
  NotePencilIcon,
  PackageIcon,
  ReceiptIcon,
  RulerIcon,
  ShoppingCartIcon,
  SquaresFourIcon,
  TagIcon,
  TrayIcon,
  TruckIcon,
  UserCircleIcon,
  UsersIcon,
  WarehouseIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

export const BRAND_NAME = 'Electrónica Central AZ'

export const ROUTES = {
  login: '/login',
  registro: '/registro',
  recuperar: '/recuperar',
  restablecer: '/restablecer',
  catalogo: '/',
  carrito: '/carrito',
  misSolicitudes: '/mis-solicitudes',
  dashboard: '/dashboard',
  usuarios: '/usuarios',
  bitacora: '/bitacora',
  productos: '/productos',
  categorias: '/categorias',
  unidadesMedida: '/unidades-medida',
  marcas: '/marcas',
  modelos: '/modelos',
  compatibilidades: '/compatibilidades',
  inventario: '/inventario',
  proveedores: '/proveedores',
  compras: '/compras',
  clientes: '/clientes',
  ventas: '/ventas',
  solicitudes: '/solicitudes',
  reportes: '/reportes',
} as const

export interface NavItem {
  label: string
  to: string
  icon: Icon
  /** Descripcion breve de la seccion (accesos rapidos del Panel). */
  description: string
}

const STAFF_ROLES = new Set(['ADMINISTRADOR', 'VENDEDOR', 'DESARROLLADOR'])

/** True when the session can use the admin panel. */
export function esPersonal(roles: readonly string[]): boolean {
  return roles.some((rol) => STAFF_ROLES.has(rol))
}

/** Sidebar modules for Ciclo 1–4 admin UI. */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Panel',
    to: ROUTES.dashboard,
    icon: SquaresFourIcon,
    description: 'Resumen general del sistema.',
  },
  {
    label: 'Usuarios',
    to: ROUTES.usuarios,
    icon: UsersIcon,
    description: 'Cuentas de acceso del sistema.',
  },
  {
    label: 'Bitácora',
    to: ROUTES.bitacora,
    icon: ClipboardTextIcon,
    description: 'Registro de las acciones realizadas en el sistema.',
  },
  {
    label: 'Productos',
    to: ROUTES.productos,
    icon: PackageIcon,
    description: 'Catálogo de productos electrónicos.',
  },
  {
    label: 'Categorías',
    to: ROUTES.categorias,
    icon: TagIcon,
    description: 'Clasificación de los productos.',
  },
  {
    label: 'Marcas',
    to: ROUTES.marcas,
    icon: TrayIcon,
    description: 'Marcas del catálogo.',
  },
  {
    label: 'Modelos',
    to: ROUTES.modelos,
    icon: CubeIcon,
    description: 'Modelos por marca.',
  },
  {
    label: 'Compatibilidades',
    to: ROUTES.compatibilidades,
    icon: LinkIcon,
    description: 'Producto ↔ modelo compatible.',
  },
  {
    label: 'Unidades de Medida',
    to: ROUTES.unidadesMedida,
    icon: RulerIcon,
    description: 'Unidades con las que se miden los productos.',
  },
  {
    label: 'Inventario',
    to: ROUTES.inventario,
    icon: WarehouseIcon,
    description: 'Stock, alertas y ajustes.',
  },
  {
    label: 'Proveedores',
    to: ROUTES.proveedores,
    icon: TruckIcon,
    description: 'Proveedores de mercadería.',
  },
  {
    label: 'Compras',
    to: ROUTES.compras,
    icon: ShoppingCartIcon,
    description: 'Órdenes de compra y recepción.',
  },
  {
    label: 'Clientes',
    to: ROUTES.clientes,
    icon: UserCircleIcon,
    description: 'Clientes de mostrador y ventas.',
  },
  {
    label: 'Ventas',
    to: ROUTES.ventas,
    icon: ReceiptIcon,
    description: 'Ventas y pagos.',
  },
  {
    label: 'Solicitudes',
    to: ROUTES.solicitudes,
    icon: NotePencilIcon,
    description: 'Pedidos de productos no disponibles.',
  },
  {
    label: 'Reportes',
    to: ROUTES.reportes,
    icon: ChartBarIcon,
    description: 'Ventas, ganancias, inventario y rotación.',
  },
]
