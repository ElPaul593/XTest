---
tags: [arquitectura, contexto, backend, frontend]
proyecto: CulturalTrip / BusReservation
tipo: contexto-tecnico
actualizado: 2026-09-22
---

# 01 · Arquitectura General

## 1. Resumen del sistema

**CulturalTrip / BusReservation** es un sistema de reserva de boletos de bus con un módulo turístico complementario (lugares turísticos, hoteles, calificaciones y recomendaciones por provincia). Es un proyecto académico (tesis) organizado como **monorepo** con dos aplicaciones independientes que se despliegan por separado.

```
XTest/
├── backend/    API REST (Node.js + Express + MongoDB/Mongoose)
├── frontend/   SPA (React + Vite)
├── docker-compose.yml   Orquestación local
└── render.yaml          Blueprint de despliegue (Render)
```

- **Repositorio:** `CulturalTripFinalTesis/XTest`
- **Backend en producción:** Render (Docker)
- **Frontend en producción:** Vercel
- **Base de datos:** MongoDB Atlas

Ver también: [[02-servicios-consumidos]], [[glosario-tecnologico]].

---

## 2. Arquitectura limpia propuesta (capas del backend)

El backend sigue una **arquitectura en capas** (layered architecture) inspirada en principios de Clean Architecture: cada capa solo conoce a la inmediatamente inferior, y la lógica de negocio no depende de detalles de framework o de persistencia.

```
HTTP request
   │
   ▼
┌─────────────┐   Define endpoints, aplica validate(schema) y middlewares de auth.
│   routes    │   No contiene lógica de negocio.
└──────┬──────┘
       ▼
┌─────────────┐   auth (JWT + roles), validation (Joi), errorHandler (centralizado).
│  middleware │   Transversal a todas las rutas.
└──────┬──────┘
       ▼
┌─────────────┐   Adaptan HTTP ⇄ servicios (req/res, status codes, DTOs).
│ controllers │   No acceden a la base de datos directamente.
└──────┬──────┘
       ▼
┌─────────────┐   Lógica de negocio pura. Orquestan repositorios, core y strategies.
│  services   │   authService es la única fuente de creación de usuarios.
└──────┬──────┘
       │
       ├──▶ core/        Algoritmo de recomendaciones por provincia.
       ├──▶ strategies/  Patrón Strategy de pricing (Standard/Holiday/LastMinute).
       │
       ▼
┌─────────────┐   Único punto de acceso a Mongoose (CRUD, queries, transacciones).
│repositories │   Aísla la capa de negocio del ORM.
└──────┬──────┘
       ▼
┌─────────────┐   Esquemas Mongoose. Definen forma de los documentos e índices.
│   models    │
└──────┬──────┘
       ▼
   MongoDB (Atlas)
```

### 2.1. Responsabilidad por capa

| Capa | Carpeta | Responsabilidad | Regla de diseño |
|------|---------|------------------|------------------|
| Rutas | `backend/src/routes/` | Definición de endpoints REST, wiring de middlewares | Sin lógica de negocio |
| Middleware | `backend/src/middleware/` | `auth` (JWT + roles), `validation` (Joi), `errorHandler` | Transversal, reutilizable |
| Controladores | `backend/src/controllers/` | Traducción HTTP ⇄ dominio (req/res) | No accede a la BD directamente |
| Servicios | `backend/src/services/` | Lógica de negocio y orquestación | Dependen de repositorios, no de Express |
| Core | `backend/src/core/` | Algoritmo de recomendaciones turísticas por provincia | Aislado de HTTP y de Mongoose |
| Strategies | `backend/src/strategies/` | Patrón *Strategy* para cálculo de precios | Intercambiable en tiempo de ejecución |
| Repositorios | `backend/src/repositories/` | Único punto de acceso a Mongoose | Solo persistencia, sin reglas de negocio |
| Modelos | `backend/src/models/` | Esquemas Mongoose | Definen forma + índices |
| Validaciones | `backend/src/validations/schemas.js` | Esquemas Joi por dominio | Se aplican en las rutas |
| Config | `backend/src/config/` | `db.js`, `swagger.js`, `externalApis.js` | Configuración centralizada |
| Utils | `backend/src/utils/` | `AppError`, `asyncHandler`, `serializers`, `discountUtils`, `cedulaValidator`, `provinciaUtils` | Funciones puras, sin estado |
| Scripts | `backend/src/scripts/` | Tareas operativas (`seedAdmin`, `populateData`, migraciones) | Ejecución manual/CLI |

### 2.2. Dominios funcionales

Cada dominio sigue el mismo patrón `routes → controllers → services → repositories → models`:

`users`, `auth`, `reservas`, `rutas`, `boletos`, `hoteles`, `lugarTuristico`, `calificacion`, `recomendacion`, `cedula`, `asientos`/`seat` (proxy a API externa), `pricing`, `stats`, `agente`.

### 2.3. Patrones de diseño aplicados

- **Layered Architecture**: separación estricta de responsabilidades por capa (ver tabla 2.1).
- **Repository Pattern**: `src/repositories/` abstrae Mongoose; los servicios nunca importan modelos directamente para lógica de negocio.
- **Strategy Pattern**: `src/strategies/` — `PricingStrategy` (interfaz), `StandardPricing`, `HolidayPricing`, `LastMinutePricing` y `PricingStrategySelector` para elegir la estrategia según fecha/contexto de la reserva.
- **DTO / Serializers**: `src/utils/serializers` transforma documentos Mongoose en payloads de respuesta, evitando fugas de campos internos (`_id`, `__v`, hashes, etc.).
- **Middleware de errores centralizado**: `errorHandler` + clase `AppError` para manejo uniforme de errores HTTP.
- **Proxy de servicio externo**: `seatProxy.routes.js` / `asientosRoutes.js` actúan como *proxy/adapter* hacia la API externa de asientos y precios (ver [[02-servicios-consumidos]]).

---

## 3. Seguridad y roles

- El rol se guarda en `User.role` (`ADMIN` | `USER` | `AGENTE`) y viaja en el JWT (en minúsculas).
- `authenticateToken` (middleware) carga el usuario, comprueba el **estado de la cuenta** y normaliza el rol.
- El ciclo de vida de la cuenta (`ACTIVO` / `BLOQUEADO` / `ELIMINADO`) se gestiona con **baja lógica**: ninguna operación borra el documento del usuario. Ver [[02-servicios-consumidos]] § 1.
- `requireAdminAccess` exige rol `admin` para rutas administrativas.
- Autenticación basada en **JWT** (`jsonwebtoken`), con expiración de 8 horas (`authService.js`).
- Contraseñas hasheadas con `bcrypt`.
- Cabeceras de seguridad HTTP con `helmet`.
- CORS configurado explícitamente (`cors`).
- Compresión de respuestas con `compression` (gzip).
- Validación de payloads con `Joi` en la capa de rutas antes de llegar a los controladores.
- Creación/promoción de administradores solo vía script CLI: `npm run seed:admin -- --cedula <ced> --password <pwd>` (no expuesto por API pública).

---

## 4. Frontend — Estructura por responsabilidad

```
frontend/src/
├── main.jsx              Punto de entrada (Router)
├── App.jsx               Rutas + guardias (ProtectedRoute / AdminRoute)
├── components/           UI reutilizable (Navbar, LoginForm, BusSeatSelector, BoletoQR, …)
├── pages/                Vistas por ruta
│   ├── Dashboard.jsx     "Mis Reservas" (usuario) + QR del boleto
│   ├── Admin.jsx         Shell del panel admin (pestañas)
│   └── admin/            AdminUsers, AdminRutas, AdminBoletos, AdminStats
├── services/             Capa de acceso a la API REST del backend
│   ├── api.js            Axios + interceptores (token / manejo de 401)
│   ├── session.js        Sesión y rol (setSession, isAdmin, homePathForRole, …)
│   └── auth, users, reservas, rutas, boletos, stats, calificaciones, …
├── components/
│   └── Popup.jsx         Ventanas emergentes (Popup / AlertPopup / ConfirmPopup)
├── hooks/
│   └── useFeedback.js    Estado de los avisos de una pantalla
├── constants/            Constantes (ciudades, países, endpoints de API)
└── styles/               CSS por capa (base / components / pages / utils / skin)
```

### 4.2. Capas del CSS y glassmorphism

`styles/index.css` importa en un orden que **importa respetar**, porque en CSS, a
igualdad de especificidad, gana la última regla:

```
1. base        variables, reset, globales
2. utils       helpers de layout (flex, grid)
3. components  botones, formularios, tarjetas, navbar
4. pages       estilos de cada pantalla
5. skin        glass.css + modal.css   ← al final, a propósito
```

`glass.css` redefine los fondos de `.card`, `.dashboard-section`, `.profile-card`,
`.input`… reutilizando los mismos selectores de las capas 3 y 4. Si se importara
antes, `pages/profile.css` (`background: var(--surface)`) y `pages/dashboard.css`
(`background: var(--surface-light)`) volverían a dejar esas superficies opacas y el
cristal no se vería.

Dos detalles no obvios del glassmorphism:

- `backdrop-filter` solo se aprecia si **detrás hay algo que desenfocar**. Por eso
  `body::before` / `body::after` pintan dos manchas amarillas difusas, y `glass.css`
  vuelve transparentes los contenedores de página a pleno alto
  (`.profile-container`, `.dashboard-container`…) que antes tapaban el fondo con
  negro opaco.
- `backdrop-filter` crea un **contexto de apilamiento**: cualquier hijo
  `position: fixed` queda encerrado en él. De ahí que las ventanas emergentes se
  rendericen con `createPortal` sobre `document.body`.

La paleta no cambia: negro (`--bg: #0a0a0a`) + amarillo (`--accent: #ffd700`), y se
conservan las clases de botón de Bootstrap (`.btn`, `.btn-primary`,
`.btn-secondary`, `.btn-ghost`), a las que se añaden `.btn-danger` y `.btn-warning`.
El botón principal sigue siendo amarillo **sólido**, sin cristal: es el elemento que
debe destacar.

### 4.3. Ventanas emergentes

`components/Popup.jsx` expone `Popup`, `AlertPopup` (sustituye a `alert()`) y
`ConfirmPopup` (sustituye a `window.confirm()`).

Capas centralizadas en `base/variables.css`:

| Variable | Valor |
|----------|-------|
| `--z-navbar` | 1000 |
| `--z-modal-backdrop` | 2000 |
| `--z-modal` | 2001 |
| `--z-toast` | 2100 |

El diálogo se renderiza con `createPortal(contenido, document.body)`, no dentro del
árbol de la página. Sin el portal, un ancestro con `backdrop-filter`, `transform` o
`filter` lo encerraría en su contexto de apilamiento y, por muy alto que fuera su
`z-index`, no podría situarse por encima de un hermano del ancestro (el navbar).
Con el portal es hermano directo del navbar y su `z-index` sí decide.

Incluye cierre con `Escape`, clic en el velo (solo si el gesto empieza y acaba
ahí, para no cerrarlo al seleccionar texto), bloqueo del scroll de fondo con
contador para diálogos anidados, y traslado del foco al abrir con devolución al
cerrar.

Aplicado en `LoginForm`, `Profile`, `Dashboard` y `admin/AdminUsers`. Las 9
pantallas que siguen usando diálogos nativos están marcadas con `#33BUG`.

### 4.1. Flujo de autenticación y redirección por rol

1. El usuario inicia sesión desde `LoginForm` → `services/auth`.
2. El backend responde con JWT + rol; `session.js` persiste la sesión.
3. `homePathForRole(role)` redirige a `/admin` (rol `ADMIN`) o `/dashboard` (rol `USER`).
4. `ProtectedRoute` protege rutas que requieren sesión activa; `AdminRoute` protege `/admin` y redirige a `/dashboard` si el rol no es admin.
5. El `Navbar` renderiza condicionalmente el enlace "Panel Admin" según el rol.

---

## 5. Infraestructura y despliegue

| Componente | Tecnología | Entorno |
|------------|------------|---------|
| Backend | Docker (`backend/Dockerfile`) | Render (`render.yaml`) |
| Frontend | Vite build + Nginx (`frontend/Dockerfile`, `nginx.conf`) o Vercel | Vercel (`frontend/vercel.json`) |
| Orquestación local | `docker-compose.yml` | Desarrollo local |
| Base de datos | MongoDB Atlas | Cloud (fuera del monorepo) |

- Local sin Docker: backend en `http://localhost:5000`, frontend en `http://localhost:3000`.
- Local con Docker: `docker compose up --build` levanta ambos servicios.
- Documentación de despliegue detallada en `DEPLOYMENT.md` (raíz del repo).
- Documentación interactiva de la API: Swagger en `http://localhost:5000/api-docs` (`src/config/swagger.js`).

---

## 6. Decisiones técnicas relevantes

- **Consolidación de configuración de API externa**: antes existían tres variables de entorno solapadas (`EXTERNAL_SEAT_API`, `SEAT_API_URL`, `PRICING_API`) apuntando a proxies distintos. Se centralizó en una única `EXTERNAL_API_URL` en `src/config/externalApis.js`, manteniendo compatibilidad hacia atrás con las variables previas para no romper despliegues existentes.
- **Precio unitario por defecto**: si no se puede resolver el precio real de una ruta desde la API externa, se usa un valor por defecto configurable (`DEFAULT_PRECIO_UNITARIO_USD = 10`).
- **Timeout de peticiones externas**: `DEFAULT_REQUEST_TIMEOUT_MS = 4000` ms para evitar que una API externa caída bloquee el sistema.
- **Validación de cédula ecuatoriana**: lógica propia (`cedulaValidator.js`) para validar el documento de identidad en el registro de usuarios, dado el contexto geográfico del proyecto (Ecuador).
- **Recomendaciones por provincia**: se resolvió mapear ciudades a provincias ecuatorianas (`provinciaUtils.js`) para poder agrupar lugares turísticos, hoteles y recomendaciones de forma geográfica coherente (ver historial de commits sobre "rutas a Cuenca y otras ciudades").
- **Baja lógica en lugar de borrado de usuarios**: eliminar el documento del usuario dejaba huérfanas sus reservas, boletos y calificaciones. Se sustituyó por un campo `estado` y un helper único (`utils/estadoCuenta.js`) que decide qué puede hacer cada cuenta. Los documentos previos, sin el campo, se tratan como `ACTIVO`.
- **Envío de correo delegado en la API consumidora**: el backend no habla SMTP. `services/mailerService.js` manda el mensaje por HTTP a la API consumidora, que es la que guarda las credenciales del proveedor. Así el backend se despliega sin variables SMTP y hay un solo punto que mantener si cambia el proveedor.
- **El enlace de reseteo apunta al backend, no al frontend**: `${VERCEL_BACKEND_URL}/api/auth/reset-password/${token}`. De este modo el token se valida en el servidor antes de renderizar el formulario, y la página de cambio de contraseña (autocontenida en `views/resetPasswordPage.js`) funciona aunque el frontend esté caído.
- **Capas de `z-index` centralizadas**: las ventanas emergentes empataban con el navbar en `z-index: 1000` y quedaban por debajo del header. Ahora las capas son variables CSS (`--z-navbar` 1000 < `--z-modal` 2001) y los diálogos se montan con `createPortal` sobre `document.body`.

---

## Referencias cruzadas
- [[02-servicios-consumidos]] — APIs externas, base de datos y dependencias.
- [[glosario-tecnologico]] — Stack tecnológico y versiones.
- [[historial-prompts]] — Prompts usados durante el desarrollo.
