import { useCallback, useEffect, useState } from 'react'
import { crearUsuario, listarUsuarios, restablecerUsuario } from '../services/usuarioService'
import type { DatosUsuario, Usuario } from '../types/domain'
import type { EstadoCarga } from './estadoCarga'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    listarUsuarios().then(
      (datos) => {
        if (!vigente) return
        setUsuarios(datos)
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

  const crear = async (datos: DatosUsuario) => {
    await crearUsuario(datos)
    recargar()
  }

  const restablecer = async (id: string, contrasenaTemporal: string) => {
    await restablecerUsuario(id, contrasenaTemporal)
  }

  return { usuarios, estado, recargar, crear, restablecer }
}
