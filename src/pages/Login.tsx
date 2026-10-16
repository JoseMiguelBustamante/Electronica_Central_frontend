import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import Button from '../components/Button'
import Input from '../components/Input'
import { useLoginForm } from '../hooks/useLoginForm'
import { BRAND_NAME, ROUTES } from '../utils/navigation'
import { FOCUS_RING, cn } from '../utils/styles'

export default function Login() {
  const form = useLoginForm()
  const [searchParams] = useSearchParams()
  const registrado = searchParams.get('registrado') === '1'
  const restablecido = searchParams.get('restablecido') === '1'
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="flex min-h-dvh items-center bg-fondo px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <header>
          <p translate="no" className="text-xl font-bold text-mascara">
            {BRAND_NAME}
          </p>
          <h1 id="login-title" className="mt-4 text-4xl font-bold text-tinta">
            Ingresar
          </h1>
          <p className="mt-3 max-w-md text-base text-secundario">
            Usuario o correo y contraseña. Ves el catálogo sin cuenta. La compra se cierra en tienda.
          </p>
          <p className="mt-4 text-[13px] font-medium text-secundario">
            Atención en tienda: lun–sáb 08:00–12:00 · 13:30–17:00
          </p>
        </header>

        <section
          aria-labelledby="login-title"
          className="rounded-xl border border-linea bg-superficie p-7"
        >

          <form onSubmit={form.handleSubmit} noValidate aria-busy={form.loading} className="space-y-5">
            {registrado && !form.formError && (
              <p role="status" className="rounded-md border border-disponible-borde bg-disponible-fondo p-3 text-sm text-tinta">
                Cuenta creada. Ya podés ingresar.
              </p>
            )}
            {restablecido && !form.formError && (
              <p role="status" className="rounded-md border border-disponible-borde bg-disponible-fondo p-3 text-sm text-tinta">
                Contraseña actualizada. Ingresá con la nueva.
              </p>
            )}
            {form.formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-agotado-borde bg-agotado-fondo p-3 text-sm text-peligro"
              >
                <WarningCircleIcon size={20} weight="fill" aria-hidden="true" className="shrink-0" />
                <p>{form.formError}</p>
              </div>
            )}

            <Input
              label="Usuario o correo"
              name="identificador"
              type="text"
              autoComplete="username"
              spellCheck={false}
              required
              value={form.identificador}
              onChange={form.handleIdentificadorChange}
              error={form.fieldErrors.identificador}
              disabled={form.loading}
            />

            <Input
              label="Contraseña"
              name="contrasena"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.contrasena}
              onChange={form.handleContrasenaChange}
              error={form.fieldErrors.contrasena}
              disabled={form.loading}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={form.loading}
                  className={cn(
                    'grid size-10 place-items-center rounded-md text-secundario hover:bg-suave hover:text-tinta',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    FOCUS_RING,
                  )}
                >
                  {showPassword ? (
                    <EyeSlashIcon size={20} aria-hidden="true" />
                  ) : (
                    <EyeIcon size={20} aria-hidden="true" />
                  )}
                </button>
              }
            />

            <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm text-tinta">
              <input
                type="checkbox"
                name="recordar"
                checked={form.recordar}
                onChange={form.handleRecordarChange}
                disabled={form.loading}
                className={cn('size-4 rounded border-campo accent-mascara', FOCUS_RING)}
              />
              Recordar sesión
            </label>

            <div className="flex justify-end">
              <Link to={ROUTES.recuperar} className={`text-sm font-semibold text-mascara ${FOCUS_RING}`}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" loading={form.loading} className="w-full">
              {form.loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-secundario">
            ¿No tenés cuenta?{' '}
            <Link to={ROUTES.registro} className={`font-semibold text-mascara ${FOCUS_RING}`}>
              Crear cuenta
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
