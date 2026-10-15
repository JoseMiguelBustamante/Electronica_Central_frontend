import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import TiendaLayout from './layouts/TiendaLayout'
import Login from './pages/Login'
import CatalogoPublico from './pages/CatalogoPublico'
import DetallePublico from './pages/DetallePublico'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/Usuarios'
import Bitacora from './pages/Bitacora'
import Productos from './pages/Productos'
import Categorias from './pages/Categorias'
import UnidadesMedida from './pages/UnidadesMedida'
import { ROUTES } from './utils/navigation'

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route element={<TiendaLayout />}>
        <Route path={ROUTES.catalogo} element={<CatalogoPublico />} />
        <Route path="/catalogo/:id" element={<DetallePublico />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.dashboard} element={<Dashboard />} />
        <Route path={ROUTES.usuarios} element={<Usuarios />} />
        <Route path={ROUTES.bitacora} element={<Bitacora />} />
        <Route path={ROUTES.productos} element={<Productos />} />
        <Route path={ROUTES.categorias} element={<Categorias />} />
        <Route path={ROUTES.unidadesMedida} element={<UnidadesMedida />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.catalogo} replace />} />
    </Routes>
  )
}
