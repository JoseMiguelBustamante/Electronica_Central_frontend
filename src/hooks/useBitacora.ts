import { useCallback, useEffect, useState } from 'react'
import { listarRegistrosBitacora } from '../services/bitacoraService'
import type { RegistroBitacora } from '../types/domain'
import type { EstadoCarga } from './estadoCarga'

/** Registros de la bitacora (solo lectura). Hoy usa un servicio simulado en memoria. */
export function useBitacora() {
  const [registros, setRegistros] = useState<RegistroBitacora[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    listarRegistrosBitacora().then(
      (datos) => {
        if (!vigente) return
        setRegistros(datos)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento])

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  return { registros, estado, recargar }
}
