import { useState } from 'react'
import Alert from './Alert'
import Button from './Button'
import Modal from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  /** Texto del boton mientras se ejecuta la accion. */
  loadingLabel?: string
  variant?: 'primary' | 'danger'
  /** Debe lanzar un error si la operacion falla; el dialogo lo muestra y sigue abierto. */
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  loadingLabel = 'Procesando…',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.')
      setLoading(false)
    }
  }

  return (
    <Modal
      title={title}
      size="sm"
      role="alertdialog"
      busy={loading}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" data-autofocus onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={variant} loading={loading} onClick={handleConfirm}>
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-tinta">{message}</p>
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  )
}
