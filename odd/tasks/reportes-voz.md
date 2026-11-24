# Feature: Reportes por voz con IA (lado frontend)

Compañero del backend `odd/tasks/reportes-voz.md` (repo Electronica_Central_Backend).
El usuario habla, el navegador transcribe (Web Speech API), el texto va a
POST /api/reportes/interpretar (ya implementado en el backend), y el frontend
nunca parsea nada por sí mismo.

## Specs

S1: "voz decir generame reportes de ventas de esta semana / ano / mes y cualquier
reporte que tengamos y este consuma el endpoint de los reportes" — botón de
micrófono en la página Reportes: webkitSpeechRecognition (lang es-419/es-ES de
fallback), resultado final transcrito → service interpretarReporteVoz(texto).

S2 (integración): POST /api/reportes/interpretar body {texto} → 200
{tipo:'ventas'|'ganancias'|'inventario'|'rotacion', desde, hasta, fechaCorte?,
titulo?}. Errores: 400 VALIDATION_ERROR, 401/403 auth, 503 AI_NOT_CONFIGURED /
AI_UNAVAILABLE, 502 AI_INVALID_RESPONSE (mensajes ya normalizados por el
backend; el front solo los muestra).

S3 (usuario: "Ambos (completo)"): al recibir el JSON → completar los controles
de la página (tipo + desde/hasta o fechaCorte) y disparar la generación del
dashboard existente (reusar la lógica de generar()); tras generar, hablar el
resumen con speechSynthesis (voz es, rate ~1) leyendo los KPIs del reporte
resuelto; los botones PDF/Excel/CSV quedan intactos para descargar.

S5 (degradación): si !('webkitSpeechRecognition' in window || 'SpeechRecognition'
in window) el botón de micrófono no se muestra (o aparece deshabilitado con
tooltip) y el formulario queda 100% manual. Estado del mic: idle/escuchando/
procesando; abort/onclick corto detiene; error de reconocimiento → toast.

S6: no validar frases en el front: el front solo captura la transcripción
completa y la envía tal cual.

T11 — [DONE] S12 fase 2: caja "Preguntá sobre este informe" bajo el dashboard
con input + botón "Dictar pregunta" (mismo hook de reconocimiento);
informeParaIa() serializa periodo/resumen/items (máx 60) según el tipo
(rotación aplana rotacion+demanda en resumen); la respuesta se muestra y se
lee con decir() (helper extraído de pronunciarResumen); historial de hasta 5
preguntas colapsable; las preguntas nunca buscan en la BD, solo razonan sobre
el informe en pantalla.
Evidencia: build 0 TS errors; eslint limpio.

## Tasks

T9 — [DONE] S10 historial multi-turno: interpretarReporteVoz(texto, contexto?,
historial?) envía las últimas 5 interpretaciones (historialRef) al intérprete
para resolver referencias a turnos previos.
T10 — [DONE] S11 multi-reporte: si la respuesta trae reportes[], se generan en
secuencia con ejecutarReporte(..., hablar=false), se muestra el último y se
pronuncia un único resumen combinado ("Generé N reportes. Te leo el último.");
confirmación final con el resumen del último.
Fix — [DONE] mensajeError distingue 'sin respuesta del servidor' de timeout
(el bug real era CORS sin PUT en el backend, corregido en 991bb02).
Evidencia: build 0 TS errors; eslint de los 3 archivos limpio.

T3 — [DONE] interpretarReporteVoz() en reporteService.ts (interfaz ReporteInterpretado,
POST /api/reportes/interpretar) + src/hooks/useReconocimientoVoz.ts (tipos locales,
es-419, MENSAJES_ERROR en español, ref-based callbacks, abort en unmount,
VOZ_SOPORTADA constant). Sin tests unitarios de hook (repo sin vitest en front).
T4 — [DONE] Reportes.tsx: ejecutarReporte(tipo,desde,hasta,fechaCorte) compartido
por form y voz; pronunciarResumen(resultado) narrowing sobre Resultado;
procesarOrdenDeVoz → interpretarReporteVoz → ejecutarReporte; botón 'Dictar
reporte' (hidden si !soportado, Escuchando…/Procesando…); degradación S5;
README ciclo 4 actualizado. Evidencia: npm run build 0 errores TS; eslint de
los 3 archivos sin errores.
T7 — [DONE] S8/L3: interpretarReporteVoz(texto, contexto?: ContextoReporte);
procesarOrdenDeVoz reenvía rangoExport como contexto (follow-up "el mes
anterior"); pronunciarResumen con elegirVoz (prefiere Google español /
Microsoft Natural > cualquier /esp/ en nombre > es-* en lang), fechaVoz
("23 de noviembre de 2026" con Intl es + UTC), dineroVoz ("107 bolivianos con
50 centavos", sin "Bs"/separadores), rate 1.03 y frases con cadencia.
Evidencia: build 0 TS errors; eslint de los 2 archivos limpio.

## Log

L1: petición original del usuario (ver doc backend, sección Log L1/L2):
decisión = voz navegador + LLM nan.builders glm5.3-flash + resultado completo
(dashboard + voz + exportación). Backend ya implementado y verificado (34
tests). Este doc: solo la parte frontend.
