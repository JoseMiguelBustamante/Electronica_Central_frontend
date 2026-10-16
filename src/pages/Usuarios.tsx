import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyIcon, PencilSimpleIcon, PlusIcon, PowerIcon, UsersIcon } from '@phosphor-icons/react'
import ActionMenu from '../components/ActionMenu'
import type { ActionMenuItem } from '../components/ActionMenu'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { useToast } from '../hooks/useToast'
import { useUsuarios } from '../hooks/useUsuarios'
import { mensajeError } from '../lib/errors'
import { obtenerSesion } from '../services/authService'
import { editarUsuario } from '../services/usuarioService'
import type { CambiosUsuario, RolEmpleado, SesionUsuario, Usuario } from '../types/domain'
import { PASSWORD_POLICY_HINT, validarPoliticaContrasena } from '../utils/passwordPolicy'

export default function Usuarios() {
  const toast = useToast()
  const { usuarios, estado, recargar, crear, restablecer } = useUsuarios()
  const [creando, setCreando] = useState(false)
  const [restablecerId, setRestablecerId] = useState<string | null>(null)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState<Usuario | null>(null)
  const [sesion, setSesion] = useState<SesionUsuario | null>(null)

  useEffect(() => {
    let vigente = true
    obtenerSesion().then(
      (datos) => {
        if (vigente) setSesion(datos)
      },
      () => {},
    )
    return () => {
      vigente = false
    }
  }, [])

  const esDesarrollador = sesion?.roles.includes('DESARROLLADOR') ?? false
  const puedeGestionar = (usuario: Usuario) => {
    if (!sesion || usuario.roles.includes('DESARROLLADOR')) return false
    if (usuario.id === sesion.id) return true
    return esDesarrollador || !usuario.roles.includes('ADMINISTRADOR')
  }

  const acciones = (usuario: Usuario): ActionMenuItem[] => {
    const gestionable = puedeGestionar(usuario)
    const propio = usuario.id === sesion?.id
    return [
      { label: 'Editar', icon: PencilSimpleIcon, onSelect: () => setEditando(usuario), disabled: !gestionable },
      {
        label: usuario.activo ? 'Desactivar' : 'Activar',
        icon: PowerIcon,
        onSelect: () => setCambiandoEstado(usuario),
        disabled: !gestionable || propio,
      },
      {
        label: 'Restablecer contraseña',
        icon: KeyIcon,
        onSelect: () => setRestablecerId(usuario.id),
        disabled: !gestionable || propio || (!esDesarrollador && usuario.roles.includes('ADMINISTRADOR')),
      },
    ]
  }

  const columnas: Column<Usuario>[] = [
    { key: 'usuario', header: 'Usuario', primary: true, cell: (usuario) => usuario.nombreUsuario },
    { key: 'correo', header: 'Correo', className: 'break-words', cell: (usuario) => usuario.correo },
    {
      key: 'roles',
      header: 'Roles',
      cell: (usuario) => usuario.roles.join(', ') || 'Sin rol',
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (usuario) => (
        <Badge variant={usuario.activo ? 'success' : 'error'}>{usuario.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (usuario) => <ActionMenu label={`Acciones de ${usuario.nombreUsuario}`} items={acciones(usuario)} />,
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Usuarios</h2>
          <p className="mt-1 text-sm text-secundario">
            Alta, edición y activación de empleados (administrador o vendedor). Los clientes se registran solos desde la tienda.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nuevo empleado
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando usuarios…">
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar los usuarios"
          action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}
        >
          Verifique que la sesión tenga permiso para gestionar usuarios.
        </Alert>
      ) : usuarios.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No hay usuarios" description="Cree la primera cuenta de empleado." />
      ) : (
        <Table caption="Usuarios del sistema" columns={columnas} rows={usuarios} getRowKey={(usuario) => usuario.id} />
      )}

      {creando && (
        <FormularioUsuario
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            try {
              await crear(datos)
              toast.success('Empleado creado.')
              setCreando(false)
            } catch (error) {
              toast.error(mensajeError(error, 'No se pudo crear el usuario.'))
              throw error
            }
          }}
        />
      )}

      {editando && (
        <FormularioEdicion
          usuario={editando}
          propio={editando.id === sesion?.id}
          onClose={() => setEditando(null)}
          onSubmit={async (cambios) => {
            await editarUsuario(editando.id, cambios)
            toast.success('Usuario actualizado.')
            setEditando(null)
            recargar()
          }}
        />
      )}

      {cambiandoEstado && (
        <ConfirmDialog
          title={cambiandoEstado.activo ? 'Desactivar usuario' : 'Activar usuario'}
          message={
            cambiandoEstado.activo
              ? `${cambiandoEstado.nombreUsuario} no podrá iniciar sesión y se cerrarán sus sesiones abiertas.`
              : `${cambiandoEstado.nombreUsuario} podrá volver a iniciar sesión.`
          }
          confirmLabel={cambiandoEstado.activo ? 'Desactivar' : 'Activar'}
          variant={cambiandoEstado.activo ? 'danger' : 'primary'}
          onCancel={() => setCambiandoEstado(null)}
          onConfirm={async () => {
            await editarUsuario(cambiandoEstado.id, { activo: !cambiandoEstado.activo })
            toast.success(cambiandoEstado.activo ? 'Usuario desactivado.' : 'Usuario activado.')
            setCambiandoEstado(null)
            recargar()
          }}
        />
      )}

      {restablecerId && (
        <FormularioRestablecer
          onClose={() => setRestablecerId(null)}
          onSubmit={async (contrasenaTemporal) => {
            try {
              await restablecer(restablecerId, contrasenaTemporal)
              toast.success('Contraseña restablecida.')
              setRestablecerId(null)
            } catch (error) {
              toast.error(mensajeError(error, 'No se pudo restablecer la contraseña.'))
              throw error
            }
          }}
        />
      )}
    </div>
  )
}

function FormularioUsuario({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (datos: { nombreUsuario: string; correo: string; contrasena: string; roles: RolEmpleado[] }) => Promise<void>
}) {
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [rol, setRol] = useState<RolEmpleado>('VENDEDOR')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const politica = validarPoliticaContrasena(contrasena)
    if (politica) {
      setError(politica)
      return
    }
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({ nombreUsuario, correo, contrasena, roles: [rol] })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el usuario.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Nuevo empleado"
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-usuario" loading={ocupado}>Crear</Button>}
    >
      <form id="form-usuario" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre de usuario" name="nombreUsuario" required minLength={3} value={nombreUsuario} onChange={(event) => setNombreUsuario(event.target.value)} />
        <Input label="Correo" name="correo" type="email" required value={correo} onChange={(event) => setCorreo(event.target.value)} />
        <Select label="Rol" name="rol" required value={rol} onChange={(event) => setRol(event.target.value as RolEmpleado)}>
          <option value="VENDEDOR">Vendedor</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </Select>
        <Input label="Contraseña temporal" name="contrasena" type="password" required minLength={12} value={contrasena} onChange={(event) => setContrasena(event.target.value)} />
        <p className="text-xs text-secundario">{PASSWORD_POLICY_HINT}</p>
      </form>
    </Modal>
  )
}

function FormularioEdicion({
  usuario,
  propio,
  onClose,
  onSubmit,
}: {
  usuario: Usuario
  propio: boolean
  onClose: () => void
  onSubmit: (cambios: CambiosUsuario) => Promise<void>
}) {
  const rolActual: RolEmpleado = usuario.roles.includes('ADMINISTRADOR') ? 'ADMINISTRADOR' : 'VENDEDOR'
  const [nombreUsuario, setNombreUsuario] = useState(usuario.nombreUsuario)
  const [correo, setCorreo] = useState(usuario.correo)
  const [rol, setRol] = useState<RolEmpleado>(rolActual)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const cambios: CambiosUsuario = {}
    if (nombreUsuario.trim() !== usuario.nombreUsuario) cambios.nombreUsuario = nombreUsuario.trim()
    if (correo.trim() !== usuario.correo) cambios.correo = correo.trim()
    if (!propio && rol !== rolActual) cambios.roles = [rol]
    if (Object.keys(cambios).length === 0) {
      onClose()
      return
    }
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(cambios)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar el usuario.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Editar usuario"
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-editar-usuario" loading={ocupado}>Guardar</Button>}
    >
      <form id="form-editar-usuario" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre de usuario" name="nombreUsuario" required minLength={3} value={nombreUsuario} onChange={(event) => setNombreUsuario(event.target.value)} />
        <Input label="Correo" name="correo" type="email" required value={correo} onChange={(event) => setCorreo(event.target.value)} />
        <Select label="Rol" name="rol" required disabled={propio} value={rol} onChange={(event) => setRol(event.target.value as RolEmpleado)}>
          <option value="VENDEDOR">Vendedor</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </Select>
        {propio && <p className="text-xs text-secundario">No puedes cambiar tu propio rol.</p>}
      </form>
    </Modal>
  )
}

function FormularioRestablecer({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (contrasenaTemporal: string) => Promise<void>
}) {
  const [contrasenaTemporal, setContrasenaTemporal] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const politica = validarPoliticaContrasena(contrasenaTemporal)
    if (politica) {
      setError(politica)
      return
    }
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(contrasenaTemporal)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo restablecer la contraseña.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Restablecer contraseña"
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-restablecer" loading={ocupado}>Restablecer</Button>}
    >
      <form id="form-restablecer" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Contraseña temporal" name="contrasenaTemporal" type="password" required minLength={12} value={contrasenaTemporal} onChange={(event) => setContrasenaTemporal(event.target.value)} />
        <p className="text-xs text-secundario">{PASSWORD_POLICY_HINT}</p>
      </form>
    </Modal>
  )
}
