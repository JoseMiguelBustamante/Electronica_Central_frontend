import { useEffect, useState } from 'react'
import { listarRegistrosBitacora } from '../services/bitacoraService'
import { listarCategorias, listarProductos, listarUnidades } from '../services/catalogoService'
import { listarUsuarios } from '../services/usuarioService'
import type { IndicadorResumen } from '../types/indicadores'

interface Actividad {
  id: string
  accion: string
  objeto: string
  usuario: string
  fechaHora: string
  resultado: 'exitoso' | 'error'
}

export function useDashboardData() {
  const [cargando, setCargando] = useState(true)
  const [indicadores, setIndicadores] = useState<IndicadorResumen[]>([])
  const [actividad, setActividad] = useState<Actividad[]>([])

  useEffect(() => {
    let vigente = true
    Promise.allSettled([
      listarUsuarios(),
      listarProductos(),
      listarCategorias(),
      listarUnidades(),
      listarRegistrosBitacora(),
    ]).then((results) => {
      if (!vigente) return
      const [usuarios, productos, categorias, unidades, registros] = results
      const items: IndicadorResumen[] = []

      if (usuarios.status === 'fulfilled') {
        const activos = usuarios.value.filter((usuario) => usuario.activo).length
        const roles = new Set(usuarios.value.flatMap((usuario) => usuario.roles)).size
        items.push({
          id: 'usuarios',
          titulo: 'Usuarios',
          valor: usuarios.value.length,
          contexto: `${activos} activos y ${usuarios.value.length - activos} inactivos`,
        })
        items.push({
          id: 'roles',
          titulo: 'Roles',
          valor: roles,
          contexto: 'Roles asignados a los usuarios',
        })
      }
      if (productos.status === 'fulfilled') {
        items.push({
          id: 'productos',
          titulo: 'Productos',
          valor: productos.value.length,
          contexto: 'Productos activos en el catálogo',
        })
      }
      if (categorias.status === 'fulfilled') {
        items.push({
          id: 'categorias',
          titulo: 'Categorías',
          valor: categorias.value.length,
          contexto: 'Categorías registradas',
        })
      }
      if (unidades.status === 'fulfilled') {
        items.push({
          id: 'unidadesMedida',
          titulo: 'Unidades de medida',
          valor: unidades.value.length,
          contexto: 'Unidades registradas',
        })
      }
      if (registros.status === 'fulfilled') {
        setActividad(registros.value.slice(0, 6).map((registro) => ({
          id: registro.id,
          accion: registro.accion,
          objeto: registro.objeto,
          usuario: registro.usuario,
          fechaHora: registro.fechaHora,
          resultado: registro.resultado === 'exito' ? 'exitoso' : 'error',
        })))
      }
      setIndicadores(items)
      setCargando(false)
    })
    return () => {
      vigente = false
    }
  }, [])

  return { cargando, indicadores, actividad }
}
