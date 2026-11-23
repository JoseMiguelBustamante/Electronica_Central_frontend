import { useCallback, useEffect, useRef, useState } from 'react'

type EstadoVoz = 'inactivo' | 'escuchando' | 'procesando'

interface ReconocimientoSpeech {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((evento: EventoResultado) => void) | null
  onerror: ((evento: EventoError) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface EventoResultado extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
  resultIndex: number
}
interface EventoError extends Event {
  error: string
}

type ConstructorReconocimiento = new () => ReconocimientoSpeech

const CONSTRUCTOR_VOZ: ConstructorReconocimiento | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as
        ConstructorReconocimiento | undefined
    : undefined

export const VOZ_SOPORTADA = CONSTRUCTOR_VOZ !== undefined

const MENSAJES_ERROR: Record<string, string> = {
  'not-allowed': 'Permiso de micrófono denegado. Habilitalo en el navegador.',
  'service-not-allowed': 'El servicio de reconocimiento no está disponible.',
  'audio-capture': 'No se detectó micrófono.',
  network: 'Error de red durante el reconocimiento.',
  aborted: '',
  'no-speech': 'No se escuchó nada. Probá de nuevo.',
}

interface OpcionesUseReconocimientoVoz {
  onFinal: (texto: string) => void
  onError: (mensaje: string) => void
}

export function useReconocimientoVoz({ onFinal, onError }: OpcionesUseReconocimientoVoz) {
  const [estado, setEstado] = useState<EstadoVoz>('inactivo')
  const [parcial, setParcial] = useState('')
  const reconocimientoRef = useRef<ReconocimientoSpeech | null>(null)
  const onFinalRef = useRef(onFinal)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onFinalRef.current = onFinal
    onErrorRef.current = onError
  }, [onFinal, onError])

  useEffect(() => () => {
    reconocimientoRef.current?.abort()
  }, [])

  const detener = useCallback(() => {
    setParcial('')
    try { reconocimientoRef.current?.stop() } catch { /* ya detenido */ }
  }, [])

  const iniciar = useCallback(() => {
    if (!CONSTRUCTOR_VOZ) {
      onErrorRef.current('Tu navegador no soporta dictado por voz.')
      return
    }
    if (estado === 'procesando') return
    setParcial('')
    // Fresh instance per utterance: reusing a stopped one throws.
    const reconocimiento = new CONSTRUCTOR_VOZ()
    reconocimiento.lang = 'es-419'
    reconocimiento.interimResults = true
    reconocimiento.maxAlternatives = 1
    reconocimiento.continuous = false

    reconocimiento.onstart = () => setEstado('escuchando')
    reconocimiento.onresult = (evento) => {
      let finalText = ''
      let interimText = ''
      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        const resultado = evento.results[i]
        const texto = resultado?.[0]?.transcript ?? ''
        if (resultado.isFinal) finalText += texto
        else interimText += texto
      }
      setParcial(interimText.trim())
      const texto = finalText.trim()
      if (!texto) return
      setEstado('procesando')
      setParcial('')
      detener()
      onFinalRef.current(texto)
    }
    reconocimiento.onerror = (evento) => {
      const mensaje = MENSAJES_ERROR[evento.error]
      if (mensaje) onErrorRef.current(mensaje)
      setParcial('')
      setEstado('inactivo')
    }
    reconocimiento.onend = () => {
      setParcial('')
      setEstado((actual) => (actual === 'procesando' ? 'procesando' : 'inactivo'))
    }
    reconocimiento.onstart = ((anterior) => () => {
      anterior?.()
      setEstado('escuchando')
    })(reconocimiento.onstart)

    reconocimientoRef.current = reconocimiento
    try {
      reconocimiento.start()
    } catch {
      onErrorRef.current('No se pudo iniciar el micrófono.')
      setEstado('inactivo')
    }
  }, [estado, detener])

  return { estado, parcial, soportado: VOZ_SOPORTADA, iniciar, detener }
}
