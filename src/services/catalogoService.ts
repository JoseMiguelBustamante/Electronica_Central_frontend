import { z } from 'zod'
import api from '../lib/api'
import type {
  Categoria,
  Compatibilidad,
  DatosCategoria,
  DatosProducto,
  DatosUnidad,
  Marca,
  Modelo,
  Producto,
  ProductoAdmin,
  Ubicacion,
  Unidad,
} from '../types/domain'

const productoSchema = z.object({
  id_producto: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  precio_venta: z.coerce.number(),
  categoria: z.string(),
  marca: z.string().nullable(),
  modelo: z.string().nullable(),
  disponibilidad: z.string(),
  creado_en: z.string().nullable().optional(),
})

const paginaSchema = z.object({
  data: z.array(productoSchema),
  meta: z.object({
    pagina: z.number(),
    limite: z.number(),
    total: z.number(),
  }),
})

const categoriaSchema = z.object({
  id_categoria: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
})

const unidadSchema = z.object({
  id_unidad_medida: z.string(),
  nombre: z.string(),
  simbolo: z.string(),
  permite_fraccion: z.boolean(),
})

const ubicacionSchema = z.object({
  id_ubicacion: z.string(),
  codigo: z.string(),
  pasillo: z.string(),
  estante: z.string(),
})

const marcaSchema = z.object({
  id_marca: z.string(),
  nombre: z.string(),
})

const modeloSchema = z.object({
  id_modelo: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  id_marca: z.string(),
})

const productoAdminSchema = z.object({
  id_producto: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  precio_venta: z.coerce.number(),
  precio_compra: z.coerce.number(),
  margen_ganancia: z.coerce.number(),
  activo: z.boolean(),
  creado_en: z.string().nullable().optional(),
  id_categoria: z.string(),
  categoria: z.string(),
  id_unidad_medida: z.string(),
  unidad: z.string(),
  id_ubicacion: z.string(),
  ubicacion: z.string(),
  id_marca: z.string().nullable(),
  marca: z.string().nullable(),
  id_modelo: z.string().nullable(),
  modelo: z.string().nullable(),
  stock_actual: z.coerce.number().nullable(),
  stock_minimo: z.coerce.number().nullable(),
})

const paginaAdminSchema = z.object({
  data: z.array(productoAdminSchema),
  meta: z.object({ pagina: z.number(), limite: z.number(), total: z.number() }),
})

const compatibilidadSchema = z.object({
  id_modelo: z.string(),
  modelo: z.string(),
  id_marca: z.string(),
  marca: z.string(),
  observaciones: z.string().nullable(),
})

function mapearCompatibilidad(row: z.infer<typeof compatibilidadSchema>): Compatibilidad {
  return {
    idModelo: row.id_modelo,
    modelo: row.modelo,
    idMarca: row.id_marca,
    marca: row.marca,
    observaciones: row.observaciones ?? '',
  }
}

function leer<T>(schema: z.ZodType<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw new Error('Respuesta invalida del servidor')
  return parsed.data
}

export interface ProductoPublico {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  marca: string
  modelo: string
  disponibilidad: string
  compatibilidades: Compatibilidad[]
}

export interface OpcionFiltro {
  id: string
  nombre: string
}

export interface FiltrosCatalogo {
  categorias: OpcionFiltro[]
  marcas: OpcionFiltro[]
  modelos: OpcionFiltro[]
}

export interface PaginaCatalogo {
  productos: ProductoPublico[]
  total: number
  pagina: number
  limite: number
}

interface ProductoPublicoApi {
  id_producto: string
  codigo: string
  nombre: string
  descripcion: string | null
  precio_venta: number | string
  categoria: string | null
  marca: string | null
  modelo: string | null
  disponibilidad: string
  compatibilidades?: Array<z.infer<typeof compatibilidadSchema>>
}

interface FiltrosApi {
  categorias?: OpcionFiltro[]
  marcas?: OpcionFiltro[]
  modelos?: OpcionFiltro[]
}

function mapearProductoPublico(row: ProductoPublicoApi): ProductoPublico {
  return {
    id: row.id_producto,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion?.trim() ?? '',
    precio: Number(row.precio_venta),
    categoria: row.categoria?.trim() || 'Sin categoría',
    marca: row.marca?.trim() || 'Sin marca',
    modelo: row.modelo?.trim() || '',
    disponibilidad: row.disponibilidad,
    compatibilidades: (row.compatibilidades ?? []).map(mapearCompatibilidad),
  }
}

export async function listarCatalogoPublico(filtros: {
  buscar?: string
  idCategoria?: string
  idMarca?: string
  idModelo?: string
  pagina?: number
  limite?: number
}): Promise<PaginaCatalogo> {
  const response = await api.get<{
    data: ProductoPublicoApi[]
    meta: { pagina: number; limite: number; total: number }
  }>('/api/catalogo/productos', {
    params: {
      buscar: filtros.buscar || undefined,
      idCategoria: filtros.idCategoria || undefined,
      idMarca: filtros.idMarca || undefined,
      idModelo: filtros.idModelo || undefined,
      pagina: filtros.pagina ?? 1,
      limite: filtros.limite ?? 20,
    },
  })
  return {
    productos: response.data.data.map(mapearProductoPublico),
    total: response.data.meta.total,
    pagina: response.data.meta.pagina,
    limite: response.data.meta.limite,
  }
}

export async function obtenerProductoPublico(id: string): Promise<ProductoPublico> {
  const response = await api.get<{ data: ProductoPublicoApi }>(`/api/catalogo/productos/${id}`)
  return mapearProductoPublico(response.data.data)
}

export async function listarFiltrosPublicos(): Promise<FiltrosCatalogo> {
  const response = await api.get<{ data: FiltrosApi }>('/api/catalogo/filtros')
  const data = response.data.data
  return {
    categorias: data.categorias ?? [],
    marcas: data.marcas ?? [],
    modelos: data.modelos ?? [],
  }
}

export async function crearSolicitudProducto(
  producto: ProductoPublico,
  cantidad: number,
  observaciones: string,
): Promise<void> {
  await api.post('/api/solicitudes', {
    descripcionProducto: producto.nombre,
    cantidad,
    observaciones: observaciones.trim() || null,
    idProducto: producto.id,
  })
}

export async function listarProductos(): Promise<Producto[]> {
  const limite = 100
  const productos: Producto[] = []
  let pagina = 1
  let total: number

  for (;;) {
    const { data } = await api.get('/api/catalogo/productos', { params: { pagina, limite } })
    const parsed = leer(paginaSchema, data)
    total = parsed.meta.total
    productos.push(...parsed.data.map((row) => ({
      id: row.id_producto,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? '',
      precio: row.precio_venta,
      categoria: row.categoria,
      marca: row.marca ?? '',
      modelo: row.modelo ?? '',
      disponibilidad: row.disponibilidad,
      creadoEn: row.creado_en ?? '',
    })))
    pagina += 1
    if (productos.length >= total || pagina > 20) break
  }

  return productos
}

export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get('/api/categorias')
  return leer(z.object({ data: z.array(categoriaSchema) }), data).data.map((row) => ({
    id: row.id_categoria,
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
  }))
}

export async function crearCategoria(datos: DatosCategoria): Promise<void> {
  await api.post('/api/categorias', {
    nombre: datos.nombre,
    descripcion: datos.descripcion || undefined,
  })
}

export async function editarCategoria(id: string, datos: DatosCategoria): Promise<void> {
  await api.patch(`/api/categorias/${id}`, { nombre: datos.nombre, descripcion: datos.descripcion })
}

/** Falla con 409 si la categoría tiene productos; mensajeError() muestra el motivo de la API. */
export async function eliminarCategoria(id: string): Promise<void> {
  await api.delete(`/api/categorias/${id}`)
}

export async function listarUnidades(): Promise<Unidad[]> {
  const { data } = await api.get('/api/unidades')
  return leer(z.object({ data: z.array(unidadSchema) }), data).data.map((row) => ({
    id: row.id_unidad_medida,
    nombre: row.nombre,
    simbolo: row.simbolo,
    permiteFraccion: row.permite_fraccion,
  }))
}

export async function crearUnidad(datos: DatosUnidad): Promise<void> {
  await api.post('/api/unidades', datos)
}

export async function editarUnidad(id: string, datos: DatosUnidad): Promise<void> {
  await api.patch(`/api/unidades/${id}`, datos)
}

export async function eliminarUnidad(id: string): Promise<void> {
  await api.delete(`/api/unidades/${id}`)
}

export async function listarUbicaciones(): Promise<Ubicacion[]> {
  const { data } = await api.get('/api/ubicaciones')
  return leer(z.object({ data: z.array(ubicacionSchema) }), data).data.map((row) => ({
    id: row.id_ubicacion,
    codigo: row.codigo,
    pasillo: row.pasillo,
    estante: row.estante,
  }))
}

export async function listarMarcas(): Promise<Marca[]> {
  const { data } = await api.get('/api/marcas')
  return leer(z.object({ data: z.array(marcaSchema) }), data).data.map((row) => ({
    id: row.id_marca,
    nombre: row.nombre,
  }))
}

export async function crearMarca(nombre: string): Promise<void> {
  await api.post('/api/marcas', { nombre })
}

export async function editarMarca(id: string, nombre: string): Promise<void> {
  await api.patch(`/api/marcas/${id}`, { nombre })
}

export async function eliminarMarca(id: string): Promise<void> {
  await api.delete(`/api/marcas/${id}`)
}

export async function listarModelos(): Promise<Modelo[]> {
  const { data } = await api.get('/api/modelos')
  return leer(z.object({ data: z.array(modeloSchema) }), data).data.map((row) => ({
    id: row.id_modelo,
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    idMarca: row.id_marca,
  }))
}

export async function crearModelo(datos: {
  nombre: string
  descripcion?: string
  idMarca: string
}): Promise<void> {
  await api.post('/api/modelos', {
    nombre: datos.nombre,
    descripcion: datos.descripcion || undefined,
    idMarca: datos.idMarca,
  })
}

export async function editarModelo(id: string, datos: {
  nombre: string
  descripcion: string
  idMarca: string
}): Promise<void> {
  await api.patch(`/api/modelos/${id}`, datos)
}

export async function eliminarModelo(id: string): Promise<void> {
  await api.delete(`/api/modelos/${id}`)
}

export async function listarCompatibilidades(idProducto: string): Promise<Compatibilidad[]> {
  const { data } = await api.get(`/api/productos/${idProducto}/compatibilidades`)
  return leer(z.object({ data: z.array(compatibilidadSchema) }), data).data.map(mapearCompatibilidad)
}

export async function agregarCompatibilidad(
  idProducto: string,
  idModelo: string,
  observaciones?: string,
): Promise<void> {
  await api.post(`/api/productos/${idProducto}/compatibilidades`, {
    idModelo,
    observaciones: observaciones || undefined,
  })
}

export async function quitarCompatibilidad(idProducto: string, idModelo: string): Promise<void> {
  await api.delete(`/api/productos/${idProducto}/compatibilidades/${idModelo}`)
}

export async function crearProducto(datos: DatosProducto): Promise<void> {
  await api.post('/api/productos', {
    codigo: datos.codigo,
    nombre: datos.nombre,
    descripcion: datos.descripcion || undefined,
    precioVenta: datos.precioVenta,
    idCategoria: datos.idCategoria,
    idUnidadMedida: datos.idUnidadMedida,
    idUbicacion: datos.idUbicacion,
    idMarca: datos.idMarca || undefined,
    idModelo: datos.idModelo || undefined,
    stockMinimo: datos.stockMinimo,
    precioCompra: datos.precioCompra,
    margenGanancia: datos.margenGanancia,
  })
}

/** Edición completa (CU-4). Marca/modelo vacíos se envían como null para quitarlos. */
export async function editarProducto(id: string, datos: DatosProducto): Promise<void> {
  await api.patch(`/api/productos/${id}`, {
    codigo: datos.codigo,
    nombre: datos.nombre,
    descripcion: datos.descripcion || null,
    precioVenta: datos.precioVenta,
    precioCompra: datos.precioCompra,
    margenGanancia: datos.margenGanancia,
    idCategoria: datos.idCategoria,
    idUnidadMedida: datos.idUnidadMedida,
    idUbicacion: datos.idUbicacion,
    idMarca: datos.idMarca || null,
    idModelo: datos.idModelo || null,
    stockMinimo: datos.stockMinimo,
  })
}

export async function cambiarEstadoProducto(id: string, activo: boolean): Promise<void> {
  await api.patch(`/api/productos/${id}`, { activo })
}

export type EstadoProductoFiltro = 'activos' | 'inactivos' | 'todos'

export async function listarProductosAdmin(filtros: {
  buscar?: string
  estado?: EstadoProductoFiltro
  pagina?: number
  limite?: number
}): Promise<{ productos: ProductoAdmin[]; total: number }> {
  const { data } = await api.get('/api/productos', {
    params: {
      buscar: filtros.buscar || undefined,
      estado: filtros.estado ?? 'todos',
      pagina: filtros.pagina ?? 1,
      limite: filtros.limite ?? 20,
    },
  })
  const parsed = leer(paginaAdminSchema, data)
  return {
    total: parsed.meta.total,
    productos: parsed.data.map((row) => ({
      id: row.id_producto,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? '',
      precioVenta: row.precio_venta,
      precioCompra: row.precio_compra,
      margenGanancia: row.margen_ganancia,
      activo: row.activo,
      creadoEn: row.creado_en ?? '',
      idCategoria: row.id_categoria,
      categoria: row.categoria,
      idUnidadMedida: row.id_unidad_medida,
      unidad: row.unidad,
      idUbicacion: row.id_ubicacion,
      ubicacion: row.ubicacion,
      idMarca: row.id_marca ?? '',
      marca: row.marca ?? '',
      idModelo: row.id_modelo ?? '',
      modelo: row.modelo ?? '',
      stockActual: row.stock_actual ?? 0,
      stockMinimo: row.stock_minimo ?? 0,
    })),
  }
}

/** Precio de venta sugerido: compra × (1 + margen %), redondeado a centavos. */
export function precioConMargen(precioCompra: number, margenGanancia: number): number {
  return Math.round(precioCompra * (1 + margenGanancia / 100) * 100) / 100
}
