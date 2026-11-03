import {
  ChartBarIcon,
  ClipboardTextIcon,
  CubeIcon,
  LinkIcon,
  MapPinIcon,
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
  favoritos: '/favoritos',
  comoComprar: '/como-comprar',
  pagosExito: '/pagos/exito',
  pagosCancelado: '/pagos/cancelado',
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
  ubicaciones: '/ubicaciones',
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

export interface NavGroup {
  id: string
  /** Etiqueta corta en el menú. */
  label: string
  /** Nombre del paquete según el perfil (doc grupo 14). */
  paquete: string
  items: readonly NavItem[]
}

const STAFF_ROLES = new Set(['ADMINISTRADOR', 'VENDEDOR', 'DESARROLLADOR'])

/** True when the session can use the admin panel. */
export function esPersonal(roles: readonly string[]): boolean {
  return roles.some((rol) => STAFF_ROLES.has(rol))
}

/**
 * Menú = 4 paquetes del perfil (PerfilGrupo14 §3.1.1) + Panel.
 * P1 Seguridad · P2 Catálogo · P3 Inventario y abastecimiento · P4 Comercial
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'panel',
    label: 'Panel',
    paquete: 'Inicio',
    items: [
      {
        label: 'Panel',
        to: ROUTES.dashboard,
        icon: SquaresFourIcon,
        description: 'Resumen operativo de la tienda.',
      },
    ],
  },
  {
    id: 'seguridad',
    label: 'P1 · Seguridad y acceso',
    paquete: 'Gestión de seguridad y acceso',
    items: [
      {
        label: 'Usuarios',
        to: ROUTES.usuarios,
        icon: UsersIcon,
        description: 'Identidades, roles y acceso al sistema.',
      },
      {
        label: 'Bitácora',
        to: ROUTES.bitacora,
        icon: ClipboardTextIcon,
        description: 'Trazabilidad de acciones del sistema.',
      },
    ],
  },
  {
    id: 'catalogo',
    label: 'P2 · Catálogo',
    paquete: 'Gestión de catálogo',
    items: [
      {
        label: 'Productos',
        to: ROUTES.productos,
        icon: PackageIcon,
        description: 'Registro de productos del catálogo.',
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
        label: 'Unidades de medida',
        to: ROUTES.unidadesMedida,
        icon: RulerIcon,
        description: 'Unidades de medida del catálogo.',
      },
    ],
  },
  {
    id: 'inventario',
    label: 'P3 · Inventario y abastecimiento',
    paquete: 'Gestión de inventario y abastecimiento',
    items: [
      {
        label: 'Inventario',
        to: ROUTES.inventario,
        icon: WarehouseIcon,
        description: 'Stock, alertas y ajustes.',
      },
      {
        label: 'Ubicaciones',
        to: ROUTES.ubicaciones,
        icon: MapPinIcon,
        description: 'Pasillo y estante de almacén.',
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
    ],
  },
  {
    id: 'comercial',
    label: 'P4 · Gestión comercial',
    paquete: 'Gestión comercial',
    items: [
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
        description: 'Ventas, pagos y comprobantes.',
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
    ],
  },
]

/** Lista plana (compatibilidad con accesos rápidos / búsquedas). */
export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((grupo) => grupo.items)
