import { useState } from 'react'
import FiguraProducto from './FiguraProducto'
import { urlImagenProducto } from '../../utils/productImage'
import { cn } from '../../utils/styles'

interface ImagenProductoProps {
  codigo: string
  categoria: string
  nombre: string
  className?: string
  /** Height/width shell for the image area. */
  marcoClassName?: string
}

/** Shows `<codigo>.jpg` from the API media folder, or the category silhouette. */
export default function ImagenProducto({
  codigo,
  categoria,
  nombre,
  className,
  marcoClassName,
}: ImagenProductoProps) {
  const [fallo, setFallo] = useState(false)
  const src = urlImagenProducto(codigo)

  if (fallo || !codigo.trim()) {
    return (
      <div className={cn(marcoClassName)}>
        <FiguraProducto categoria={categoria} />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center overflow-hidden', marcoClassName)}>
      <img
        src={src}
        alt={nombre}
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
        className={cn('max-h-full max-w-full object-contain', className)}
      />
    </div>
  )
}
