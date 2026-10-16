# Electrónica Central AZ

Frontend del sistema administrativo para **Electrónica Central AZ**, desarrollado como proyecto académico.

## Descripción

Aplicación web frontend para la gestión administrativa de una tienda de productos electrónicos.

El frontend cubre los **Ciclos 1 a 4** del perfil (UI admin + catálogo público) y consume la API real del backend (no usa mocks). Estado verificado de los ciclos 1 y 2: `Electronica_Central_Backend/docs/ciclo-2-verificacion.md` (perfil: `docs/PerfilGrupo14_2doCiclo.docx`).

## Funcionalidades

### Ciclo 1

* Inicio de sesión, panel
* Usuarios: alta, edición, rol (administrador / vendedor), activar / desactivar
* Productos: alta, edición (precio de compra, margen, precio de venta), activar / desactivar
* Categorías, unidades, marcas y modelos: alta, edición y eliminación
* Catálogo público (responsive) con compatibilidades en el detalle

### Ciclo 2

* Inventario (listado, ajuste, stock mínimo)
* Proveedores y compras (alta con n.º de comprobante único, recibir, cancelar)
* Compatibilidades producto ↔ modelo (consultar, agregar, quitar)
* Bitácora con IP y tabla afectada

### Ciclo 3

* Clientes, ventas (confirmar/anular), pagos (efectivo/QR), solicitudes

### Ciclo 4

* Reportes: ventas, ganancias, inventario, rotación/demanda

### Gestión de productos

Permite:

* Consultar productos
* Buscar productos
* Filtrar por categoría y estado
* Crear productos
* Editar productos
* Ver detalles
* Activar y desactivar productos

### Gestión de categorías

Permite:

* Consultar categorías
* Buscar categorías
* Filtrar por estado y categoría padre
* Crear categorías
* Editar categorías
* Ver detalles
* Activar y desactivar categorías
* Manejar relaciones padre/hija

### Gestión de unidades de medida

Permite:

* Consultar unidades
* Buscar unidades
* Filtrar por estado
* Crear unidades
* Editar unidades
* Ver detalles
* Activar y desactivar unidades

## Tecnologías

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Phosphor Icons

## Requisitos

Para ejecutar el proyecto localmente necesitas:

* [Node.js](https://nodejs.org/)
* npm

Se recomienda utilizar una versión reciente de Node.js compatible con la versión de Vite utilizada por el proyecto.

## Instalación

Clona el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Entra a la carpeta del proyecto:

```bash
cd electronica-central-az-frontend
```

Instala las dependencias:

```bash
npm install
```

También puedes utilizar:

```bash
npm ci
```

si quieres instalar exactamente las versiones especificadas en `package-lock.json`.

## Ejecutar en desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local donde podrás abrir la aplicación, normalmente:

```text
http://localhost:5173
```

## Comandos disponibles

### Desarrollo

```bash
npm run dev
```

### Compilar para producción

```bash
npm run build
```

### Verificar el código

```bash
npm run lint
```

## Datos y backend

Actualmente el proyecto funciona con **datos mock almacenados en memoria**.

No requiere:

* Base de datos
* Backend
* API
* PostgreSQL
* Variables de entorno

La arquitectura está preparada para que posteriormente los servicios mock puedan ser reemplazados por servicios conectados al backend.

Los datos se reinician al recargar la aplicación, ya que actualmente no existe persistencia en una base de datos.

## Estructura principal

```text
src/
├── components/     # Componentes reutilizables
├── hooks/           # Hooks personalizados
├── layouts/         # Layout principal
├── pages/           # Vistas de la aplicación
├── services/        # Clientes de la API (axios + zod)
└── utils/           # Utilidades y datos iniciales
```

## Estado del proyecto

**Ciclos 1 y 2 — Implementados** (CU-1 a CU-13), conectados al backend.

**Ciclos 3 y 4 — Implementados** (clientes, ventas, pagos, solicitudes y reportes).

## Diseño

Las decisiones de diseño, estructura y restricciones funcionales del proyecto se encuentran documentadas en:

```text
DESIGN.md
```

## Licencia

Proyecto académico.
