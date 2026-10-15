import { Outlet } from 'react-router-dom'
import EncabezadoTienda from '../components/tienda/EncabezadoTienda'
import PieTienda from '../components/tienda/PieTienda'

export default function TiendaLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <EncabezadoTienda />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>
      <PieTienda />
    </div>
  )
}
