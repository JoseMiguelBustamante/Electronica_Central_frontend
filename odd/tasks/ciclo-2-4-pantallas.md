# Ciclo 2–4 admin screens

Objective: complete missing admin UI for Ciclo 2, 3 and 4 against the live API.  
Branch: work on current checkout (feature branch later if committing).  
Delivery: ask-on-risk.  
Test runner: Vite build + manual API smoke (no frontend test suite).

## Specs

S1. User request: "oki entonces completa todas las pantallas que llegan a faltar" with scope choice **3** = Ciclo 2 + 3 + 4 (incluye Reportes).

S2. Ciclo 2 UI: Inventario, Proveedores, Compras, Compatibilidad; also Marcas and Modelos needed for CU-9.

S3. Ciclo 3 UI: Clientes, Ventas (incluye registrar pago CU-16), Solicitudes.

S4. Ciclo 4 UI: Reportes de ventas, ganancias, inventario y rotación/más vendidos.

S5. Wire routes + sidebar; reuse existing layout/components; call real backend endpoints.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2–S5 | inline | done | tracking doc |
| T2 | S2 | inline | done | services + Inventario/Proveedores/Compras/Marcas/Modelos/Compat |
| T3 | S3 | inline | done | Clientes/Ventas(+pagos)/Solicitudes |
| T4 | S4 | inline | done | Reportes |
| T5 | S5 | inline | done | nav + App; `npm run build` OK |

## Log

L1. 2026-10-16 — User chose option 3: complete all missing screens (Ciclo 2+3+4 including reports).
L2. 2026-10-16 — Implemented admin pages and services; production build passed (`tsc -b && vite build`).
L3. 2026-10-16 — Client self-registration UI: `/registro`, links in Login/header/footer, `/mis-solicitudes`, staff redirect away from admin for CLIENTE. Payment QR gateway deferred. Build OK; `POST /api/auth/registro` → 201 smoke.
