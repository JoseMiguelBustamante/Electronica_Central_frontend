import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, UsersIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { useToast } from '../hooks/useToast'
import { useUsuarios } from '../hooks/useUsuarios'
import { mensajeError } from '../lib/errors'
import type { Usuario } from '../types/domain'
import { PASSWORD_POLICY_HINT, validarPoliticaContrasena } from '../utils/passwordPolicy'

export default function Usuarios() {
  const toast = useToast()
  const { usuarios, estado, recargar, crear, restablecer } = useUsuarios()
  const [creando, setCreando] = useState(false)
  const [restablecerId, setRestablecerId] = useState<string | null>(null)

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
      cell: (usuario) => (
        <Button variant="secondary" onClick={() => setRestablecerId(usuario.id)}>
          Restablecer
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Usuarios</h2>
          <p className="mt-1 text-sm text-secundario">
            Alta de empleados (vendedor). Los clientes se registran solos desde la tienda.
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
        <EmptyState icon={UsersIcon} title="No hay usuarios" description="Cree la primera cuenta de empleado (vendedor)." />
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
  onSubmit: (datos: { nombreUsuario: string; correo: string; contrasena: string; roles: Array<'VENDEDOR'> }) => Promise<void>
}) {
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
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
      await onSubmit({ nombreUsuario, correo, contrasena, roles: ['VENDEDOR'] })
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
        <Input label="Contraseña temporal" name="contrasena" type="password" required minLength={12} value={contrasena} onChange={(event) => setContrasena(event.target.value)} />
        <p className="text-xs text-secundario">{PASSWORD_POLICY_HINT} Rol: Vendedor.</p>
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
