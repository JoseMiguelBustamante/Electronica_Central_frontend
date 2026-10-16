import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import Button from '../components/Button'
import Input from '../components/Input'
import { mensajeError } from '../lib/errors'
import { registrarCuentaCliente } from '../services/authService'
import { BRAND_NAME, ROUTES } from '../utils/navigation'
import { FOCUS_RING, cn } from '../utils/styles'

export default function Registro() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return

    if (contrasena.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.')
      return
    }
    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await registrarCuentaCliente({
        nombre: nombre.trim(),
        nombreUsuario: nombreUsuario.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || undefined,
        contrasena,
      })
      navigate(`${ROUTES.login}?registrado=1`, { replace: true })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la cuenta. Intente nuevamente.'))
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center bg-fondo px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <header>
          <p translate="no" className="text-xl font-bold text-mascara">
            {BRAND_NAME}
          </p>
          <h1 id="registro-title" className="mt-4 text-4xl font-bold text-tinta">
            Crear cuenta
          </h1>
          <p className="mt-3 max-w-md text-base text-secundario">
            Registrate para solicitar productos y seguir tus pedidos. El catálogo se puede ver sin cuenta.
          </p>
        </header>

        <section
          aria-labelledby="registro-title"
          className="rounded-xl border border-linea bg-superficie p-7"
        >
          <form onSubmit={enviar} noValidate aria-busy={loading} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-agotado-borde bg-agotado-fondo p-3 text-sm text-peligro"
              >
                <WarningCircleIcon size={20} weight="fill" aria-hidden="true" className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Input
              label="Nombre completo"
              name="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Usuario"
              name="nombreUsuario"
              required
              autoComplete="username"
              spellCheck={false}
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              disabled={loading}
            />
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
            <Input
              label="Teléfono (opcional)"
              name="telefono"
              type="tel"
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={loading}
            />
            <Input
              label="Contraseña"
              name="contrasena"
              type={mostrarContrasena ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={loading}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={loading}
                  className={cn(
                    'grid size-10 place-items-center rounded-md text-secundario hover:bg-suave hover:text-tinta',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    FOCUS_RING,
                  )}
                >
                  {mostrarContrasena ? (
                    <EyeSlashIcon size={20} aria-hidden="true" />
                  ) : (
                    <EyeIcon size={20} aria-hidden="true" />
                  )}
                </button>
              }
            />
            <p className="text-xs text-secundario">Mínimo 12 caracteres.</p>
            <Input
              label="Confirmar contraseña"
              name="confirmacion"
              type={mostrarConfirmacion ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              disabled={loading}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion((v) => !v)}
                  aria-label={
                    mostrarConfirmacion ? 'Ocultar confirmación' : 'Mostrar confirmación'
                  }
                  disabled={loading}
                  className={cn(
                    'grid size-10 place-items-center rounded-md text-secundario hover:bg-suave hover:text-tinta',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    FOCUS_RING,
                  )}
                >
                  {mostrarConfirmacion ? (
                    <EyeSlashIcon size={20} aria-hidden="true" />
                  ) : (
                    <EyeIcon size={20} aria-hidden="true" />
                  )}
                </button>
              }
            />

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-secundario">
            ¿Ya tenés cuenta?{' '}
            <Link to={ROUTES.login} className={`font-semibold text-mascara ${FOCUS_RING}`}>
              Ingresar
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
