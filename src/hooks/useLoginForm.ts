import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { mensajeError } from '../lib/errors'
import { iniciarSesion } from '../services/authService'
import { ROUTES, esPersonal } from '../utils/navigation'

export const REQUIRED_FIELDS_MESSAGE = 'Complete los campos requeridos'

interface FieldErrors {
  identificador?: string
  contrasena?: string
}

export function useLoginForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [identificador, setIdentificador] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [recordar, setRecordar] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleIdentificadorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIdentificador(event.target.value)
    setFieldErrors((prev) => ({ ...prev, identificador: undefined }))
    setFormError(null)
  }

  const handleContrasenaChange = (event: ChangeEvent<HTMLInputElement>) => {
    setContrasena(event.target.value)
    setFieldErrors((prev) => ({ ...prev, contrasena: undefined }))
    setFormError(null)
  }

  const handleRecordarChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecordar(event.target.checked)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    const errors: FieldErrors = {}
    if (!identificador.trim()) errors.identificador = 'Ingrese su usuario o correo.'
    if (!contrasena) errors.contrasena = 'Ingrese su contraseña.'

    if (errors.identificador || errors.contrasena) {
      setFieldErrors(errors)
      setFormError(REQUIRED_FIELDS_MESSAGE)
      const primerCampoInvalido = event.currentTarget.elements.namedItem(
        errors.identificador ? 'identificador' : 'contrasena',
      )
      if (primerCampoInvalido instanceof HTMLElement) primerCampoInvalido.focus()
      return
    }

    setFieldErrors({})
    setFormError(null)
    setLoading(true)
    try {
      const usuario = await iniciarSesion(identificador.trim(), contrasena, recordar)
      const volver = searchParams.get('volver')
      const volverSeguro =
        volver
        && volver.startsWith('/')
        && !volver.startsWith('//')
        && !volver.startsWith('/login')
        && !volver.startsWith('/registro')
          ? volver
          : null
      const destinoStaff = volverSeguro?.startsWith('/catalogo/') ? volverSeguro : ROUTES.dashboard
      const destinoCliente = volverSeguro || ROUTES.misSolicitudes
      navigate(esPersonal(usuario.roles) ? destinoStaff : destinoCliente, { replace: true })
    } catch (error) {
      setFormError(mensajeError(error, 'No se pudo iniciar sesión. Intente nuevamente.'))
      setLoading(false)
    }
  }

  return {
    identificador,
    contrasena,
    recordar,
    fieldErrors,
    formError,
    loading,
    handleIdentificadorChange,
    handleContrasenaChange,
    handleRecordarChange,
    handleSubmit,
  }
}
