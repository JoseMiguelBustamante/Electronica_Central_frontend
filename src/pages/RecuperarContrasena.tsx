import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { mensajeError } from '../lib/errors'
import { solicitarRecuperacion } from '../services/authService'
import { BRAND_NAME, ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

export default function RecuperarContrasena() {
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    setOk(null)
    try {
      const resultado = await solicitarRecuperacion(correo.trim())
      setOk(resultado.mensaje)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo solicitar el restablecimiento.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center bg-fondo px-6 py-16 sm:px-10 lg:px-20">
      <section className="mx-auto w-full max-w-md rounded-xl border border-linea bg-superficie p-7">
        <p translate="no" className="text-xl font-bold text-mascara">
          {BRAND_NAME}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-tinta">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-secundario">
          Ingresá el correo de la cuenta. Si existe, te mandamos el enlace para crear una nueva
          contraseña.
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          {ok && (
            <p role="status" className="rounded-md border border-disponible-borde bg-disponible-fondo p-3 text-sm text-tinta">
              {ok}
            </p>
          )}
          {error && <p className="text-sm text-peligro">{error}</p>}
          <Input
            label="Correo"
            name="correo"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" loading={loading} className="w-full">
            Enviar instrucciones
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-secundario">
          <Link to={ROUTES.login} className={`font-semibold text-mascara ${FOCUS_RING}`}>
            Volver al ingreso
          </Link>
        </p>
      </section>
    </main>
  )
}
