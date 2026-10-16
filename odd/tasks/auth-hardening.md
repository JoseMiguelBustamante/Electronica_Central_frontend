# Auth hardening (lockout, recovery, password policy)

Objective: enforce max 3 login attempts, email password recovery, strong passwords, admin-only employee creation, client self-registration.  
Branch: main. Delivery: ask-on-risk.  
Test runner: backend vitest + Vite build.

## Specs

S1. User: "bloque de reintentos en el login 3 maximo"

S2. User: "reestablecer contra validar por correo"

S3. User: "contraseña valida minúscula, mayus numero"

S4. User: "admin es que agregue usuarios para empleados"

S5. User: "clientes puede crear"

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S3 | inline | done | passwordPolicy.js + DTOs |
| T2 | S1 | inline | done | migration 011 + login lockout |
| T3 | S2 | inline | done | /recuperar + /restablecer |
| T4 | S4–S5 | inline | done | createUser VENDEDOR-only; /registro cliente |
| T5 | S1–S5 | inline | in_progress | frontend pages + vitest + deploy |

## Log

L1. 2026-10-16 — User requested lockout 3, email reset, password complexity, admin employees, client self-register.
L2. 2026-10-16 — Applied 011_auth_lockout_and_recovery.sql. Frontend: Recuperar/Restablecer, Login link, Usuarios empleados-only, password policy UI.
