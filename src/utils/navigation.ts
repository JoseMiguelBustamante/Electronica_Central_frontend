import {
  ClipboardTextIcon,
  PackageIcon,
  RulerIcon,
  SquaresFourIcon,
  TagIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

export const BRAND_NAME = 'Electrónica Central AZ'

export const ROUTES = {
  login: '/login',
  catalogo: '/',
  dashboard: '/dashboard',
  usuarios: '/usuarios',
  bitacora: '/bitacora',
  productos: '/productos',
  categorias: '/categorias',
  unidadesMedida: '/unidades-medida',
} as const

export interface NavItem {
  label: string
  to: string
  icon: Icon
  /** Descripcion breve de la seccion (accesos rapidos del Panel). */
  description: string
}

/** Opciones del Sidebar (Ciclo #1). Las rutas y los titulos del Header salen de aqui. */
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
    label: 'Unidades de Medida',
    to: ROUTES.unidadesMedida,
    icon: RulerIcon,
    description: 'Unidades con las que se miden los productos.',
  },
]
