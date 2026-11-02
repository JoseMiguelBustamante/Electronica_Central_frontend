import { COMPRA } from '../../lib/compraMensajes'
import { urlWhatsapp, whatsappDisponible } from '../../lib/whatsapp'
import { FOCUS_RING } from '../../utils/styles'

/** Botón fijo de WhatsApp; solo se muestra si hay número configurado. */
export default function WhatsAppFlotante() {
  if (!whatsappDisponible()) return null
  const href = urlWhatsapp('Hola, quiero consultar un producto de Electrónica Central AZ.')
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={COMPRA.whatsappFlotante}
      className={`fixed right-4 bottom-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white shadow-lg hover:bg-[#1ebe57] sm:right-6 sm:bottom-6 ${FOCUS_RING}`}
    >
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="currentColor">
        <path d="M19.11 17.53c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.67 4.14.65.28 1.16.45 1.56.57.65.2 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
        <path d="M16.02 3C9.4 3 4.03 8.37 4.03 14.99c0 2.1.55 4.15 1.6 5.96L4 29l8.22-1.58A11.94 11.94 0 0 0 16.02 27c6.62 0 11.99-5.37 11.99-11.99C28.01 8.37 22.64 3 16.02 3zm0 21.82c-1.9 0-3.76-.51-5.38-1.47l-.39-.23-4.88.94.94-4.76-.25-.41a9.8 9.8 0 0 1-1.5-5.2c0-5.42 4.41-9.83 9.83-9.83s9.83 4.41 9.83 9.83-4.41 9.83-9.83 9.83z" />
      </svg>
      <span className="hidden sm:inline">{COMPRA.whatsappFlotante}</span>
    </a>
  )
}
