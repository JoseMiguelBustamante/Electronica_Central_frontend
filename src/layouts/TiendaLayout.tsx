import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import EncabezadoTienda from '../components/tienda/EncabezadoTienda'
import PieTienda from '../components/tienda/PieTienda'

export default function TiendaLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    const enfocar = () => {
      const destino = document.getElementById(id)
      if (!destino) return false
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const control =
        destino instanceof HTMLSelectElement
          ? destino
          : destino.querySelector('select, a, button')
      if (control instanceof HTMLElement) control.focus({ preventScroll: true })
      return true
    }
    if (enfocar()) return
    const intentos = window.setInterval(() => {
      if (enfocar()) window.clearInterval(intentos)
    }, 50)
    const limite = window.setTimeout(() => window.clearInterval(intentos), 1500)
    return () => {
      window.clearInterval(intentos)
      window.clearTimeout(limite)
    }
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <EncabezadoTienda />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <PieTienda />
    </div>
  )
}
