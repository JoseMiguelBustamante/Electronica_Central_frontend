/** Silueta del componente cuando el catálogo no trae fotografía. */
export default function FiguraProducto({ categoria }: { categoria: string }) {
  const texto = categoria.toLowerCase()
  const sensor = texto.includes('sensor') || texto.includes('modulo') || texto.includes('módulo')

  return (
    <div className="flex h-36 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 160 96" className="h-24 w-40 text-campo">
        {sensor ? (
          <>
            <rect x="28" y="22" width="104" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="80" cy="48" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M80 28v6M80 62v6M54 48h6M100 48h6" stroke="currentColor" strokeWidth="2" />
          </>
        ) : (
          <>
            <rect x="46" y="24" width="68" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M58 24v-10M74 24v-10M86 24v-10M102 24v-10M58 82v-10M74 82v-10M86 82v-10M102 82v-10M46 36H34M46 48H34M46 60H34M126 36h-12M126 48h-12M126 60h-12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    </div>
  )
}
