export interface SesionUsuario {
  id: string
  nombreUsuario: string
  correo: string
  roles: string[]
  permisos: string[]
  cambioContrasenaObligatorio: boolean
}

export interface Usuario {
  id: string
  nombreUsuario: string
  correo: string
  activo: boolean
  roles: string[]
}

export interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  marca: string
  modelo: string
  disponibilidad: string
  creadoEn: string
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string
}

export interface Unidad {
  id: string
  nombre: string
  simbolo: string
  permiteFraccion: boolean
}

export interface Ubicacion {
  id: string
  codigo: string
  pasillo: string
  estante: string
}

export interface Marca {
  id: string
  nombre: string
}

export interface Modelo {
  id: string
  nombre: string
  idMarca: string
}

export type ResultadoBitacora = 'exito' | 'advertencia' | 'error'

export interface RegistroBitacora {
  id: string
  fechaHora: string
  accion: string
  objeto: string
  resultado: ResultadoBitacora
  usuario: string
}

export interface DatosProducto {
  codigo: string
  nombre: string
  descripcion: string
  precioVenta: number
  idCategoria: string
  idUnidadMedida: string
  idUbicacion: string
  idMarca: string
  idModelo: string
  stockMinimo: number
}

export interface DatosUsuario {
  nombreUsuario: string
  correo: string
  contrasena: string
  roles: Array<'VENDEDOR'>
}

export interface DatosCategoria {
  nombre: string
  descripcion: string
}

export interface DatosUnidad {
  nombre: string
  simbolo: string
  permiteFraccion: boolean
}

export interface ItemInventario {
  idProducto: string
  codigo: string
  nombre: string
  stockActual: number
  stockMinimo: number
  ubicacionCodigo: string
  alerta: string
  costoPromedio: number
}

export interface MovimientoInventario {
  id: string
  fechaHora: string
  tipo: string
  cantidad: number
  motivo: string
}

export interface Proveedor {
  id: string
  razonSocial: string
  documento: string
  telefono: string
  correo: string
  direccion: string
  activo: boolean
}

export interface Compra {
  id: string
  fecha: string
  estado: string
  idProveedor: string
  proveedorNombre: string
}

export interface Cliente {
  id: string
  nombre: string
  documento: string
  telefono: string
  correo: string
}

export interface Venta {
  id: string
  fechaHora: string
  estado: string
  idCliente: string
  clienteNombre: string
}

export interface SolicitudProducto {
  id: string
  fechaHora: string
  descripcionProducto: string
  cantidad: number
  estado: string
  clienteNombre: string
}

export interface PagoVenta {
  id: string
  fechaHora: string
  monto: number
  metodo: string
  estado: string
}
