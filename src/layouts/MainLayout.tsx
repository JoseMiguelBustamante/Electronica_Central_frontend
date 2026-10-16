import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'
import Input from '../components/Input'
import Sidebar from '../components/Sidebar'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import { cambiarContrasena, cerrarSesion, obtenerSesion } from '../services/authService'
import type { SesionUsuario } from '../types/domain'
import { NAV_ITEMS, ROUTES, esPersonal } from '../utils/navigation'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [errorClave, setErrorClave] = useState<string | null>(null)
  const [guardandoClave, setGuardandoClave] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const token = leerToken()

  useEffect(() => {
    if (!token) return
    let vigente = true
    obtenerSesion().then(
      (sesion) => {
        if (!vigente) return
        setUsuario(sesion)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [token])

  const salir = async () => {
    await cerrarSesion()
    navigate(ROUTES.login, { replace: true })
  }

  const cambiarClave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGuardandoClave(true)
    setErrorClave(null)
    try {
      await cambiarContrasena(contrasenaActual, contrasenaNueva)
      const sesion = await obtenerSesion()
      setUsuario(sesion)
      setContrasenaActual('')
      setContrasenaNueva('')
    } catch (error) {
      setErrorClave(mensajeError(error, 'No se pudo cambiar la contraseña.'))
    } finally {
      setGuardandoClave(false)
    }
  }

  if (!token) return <Navigate to={ROUTES.login} replace />

  if (estado === 'listo' && usuario && !esPersonal(usuario.roles)) {
    return <Navigate to={ROUTES.misSolicitudes} replace />
  }

  const title = NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label ?? ''
  const user = {
    name: usuario?.nombreUsuario ?? 'Cargando…',
    role: usuario?.roles.join(', ') || 'Sin rol',
  }

  return (
    <div className="min-h-dvh bg-fondo text-tinta">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-superficie focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-mascara focus:shadow-md"
      >
        Saltar al contenido
      </a>

      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Header
          title={title}
          user={user}
          menuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={() => {
            void salir()
          }}
        />
        <main id="contenido" className="flex-1 p-4 sm:p-6 lg:p-8">
          {estado === 'error' ? (
            <p className="text-sm text-peligro">No se pudo cargar la sesión.</p>
          ) : usuario?.cambioContrasenaObligatorio ? (
            <form onSubmit={cambiarClave} className="mx-auto max-w-md space-y-4 rounded-xl border border-linea bg-superficie p-6">
              <h2 className="text-lg font-semibold text-tinta">Cambie su contraseña</h2>
              <p className="text-sm text-secundario">
                La cuenta debe usar una contraseña nueva de al menos 12 caracteres antes de continuar.
              </p>
              {errorClave && <p className="text-sm text-peligro">{errorClave}</p>}
              <Input
                label="Contraseña actual"
                name="contrasenaActual"
                type="password"
                required
                value={contrasenaActual}
                onChange={(event) => setContrasenaActual(event.target.value)}
              />
              <Input
                label="Contraseña nueva"
                name="contrasenaNueva"
                type="password"
                required
                minLength={12}
                value={contrasenaNueva}
                onChange={(event) => setContrasenaNueva(event.target.value)}
              />
              <Button type="submit" loading={guardandoClave}>
                Guardar contraseña
              </Button>
            </form>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
