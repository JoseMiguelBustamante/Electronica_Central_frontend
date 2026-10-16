import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { mensajeError } from '../lib/errors'
import { restablecerConToken } from '../services/authService'
import { BRAND_NAME, ROUTES } from '../utils/navigation'
import { PASSWORD_POLICY_HINT, validarPoliticaContrasena } from '../utils/passwordPolicy'
import { FOCUS_RING } from '../utils/styles'

export default function RestablecerContrasena() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    if (!token) {
      setError('Falta el token del enlace. Solicitá de nuevo la recuperación.')
      return
    }
    const politica = validarPoliticaContrasena(contrasena)
    if (politica) {
      setError(politica)
      return
    }
    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await restablecerConToken(token, contrasena)
      navigate(`${ROUTES.login}?restablecido=1`, { replace: true })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo restablecer la contraseña.'))
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center bg-fondo px-6 py-16 sm:px-10 lg:px-20">
      <section className="mx-auto w-full max-w-md rounded-xl border border-linea bg-superficie p-7">
        <p translate="no" className="text-xl font-bold text-mascara">
          {BRAND_NAME}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-tinta">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-secundario">{PASSWORD_POLICY_HINT}</p>

        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          {error && <p className="text-sm text-peligro">{error}</p>}
          <Input
            label="Contraseña nueva"
            name="contrasena"
            type="password"
            required
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Confirmar contraseña"
            name="confirmacion"
            type="password"
            required
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" loading={loading} className="w-full">
            Guardar contraseña
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-secundario">
          <Link to={ROUTES.recuperar} className={`font-semibold text-mascara ${FOCUS_RING}`}>
            Pedir un enlace nuevo
          </Link>
        </p>
      </section>
    </main>
  )
}
