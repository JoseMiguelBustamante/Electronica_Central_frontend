import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import TiendaLayout from './layouts/TiendaLayout'
import Login from './pages/Login'
import Registro from './pages/Registro'
import RecuperarContrasena from './pages/RecuperarContrasena'
import RestablecerContrasena from './pages/RestablecerContrasena'
import CatalogoPublico from './pages/CatalogoPublico'
import DetallePublico from './pages/DetallePublico'
import MisSolicitudes from './pages/MisSolicitudes'
import Carrito from './pages/Carrito'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Bitacora from './pages/Bitacora'
import Productos from './pages/Productos'
import Categorias from './pages/Categorias'
import UnidadesMedida from './pages/UnidadesMedida'
import Marcas from './pages/Marcas'
import Modelos from './pages/Modelos'
import Compatibilidades from './pages/Compatibilidades'
import Inventario from './pages/Inventario'
import Proveedores from './pages/Proveedores'
import Compras from './pages/Compras'
import Clientes from './pages/Clientes'
import Ventas from './pages/Ventas'
import Solicitudes from './pages/Solicitudes'
import Reportes from './pages/Reportes'
import { ROUTES } from './utils/navigation'

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route path={ROUTES.registro} element={<Registro />} />
      <Route path={ROUTES.recuperar} element={<RecuperarContrasena />} />
      <Route path={ROUTES.restablecer} element={<RestablecerContrasena />} />
      <Route element={<TiendaLayout />}>
        <Route path={ROUTES.catalogo} element={<CatalogoPublico />} />
        <Route path="/catalogo/:id" element={<DetallePublico />} />
        <Route path={ROUTES.carrito} element={<Carrito />} />
        <Route path={ROUTES.misSolicitudes} element={<MisSolicitudes />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.dashboard} element={<Dashboard />} />
        <Route path={ROUTES.usuarios} element={<Usuarios />} />
        <Route path={ROUTES.bitacora} element={<Bitacora />} />
        <Route path={ROUTES.productos} element={<Productos />} />
        <Route path={ROUTES.categorias} element={<Categorias />} />
        <Route path={ROUTES.marcas} element={<Marcas />} />
        <Route path={ROUTES.modelos} element={<Modelos />} />
        <Route path={ROUTES.compatibilidades} element={<Compatibilidades />} />
        <Route path={ROUTES.unidadesMedida} element={<UnidadesMedida />} />
        <Route path={ROUTES.inventario} element={<Inventario />} />
        <Route path={ROUTES.proveedores} element={<Proveedores />} />
        <Route path={ROUTES.compras} element={<Compras />} />
        <Route path={ROUTES.clientes} element={<Clientes />} />
        <Route path={ROUTES.ventas} element={<Ventas />} />
        <Route path={ROUTES.solicitudes} element={<Solicitudes />} />
        <Route path={ROUTES.reportes} element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.catalogo} replace />} />
    </Routes>
  )
}
