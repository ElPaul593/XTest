# Arquitectura del proyecto (CulturalTrip / BusReservation)

Monorepo con dos aplicaciones independientes:

```
CulturalTrip/
├── backend/    API REST (Node + Express + MongoDB/Mongoose)
└── frontend/   SPA (React + Vite)
```

---

## Backend — Arquitectura en capas

El flujo de una petición atraviesa siempre las mismas capas, de fuera hacia dentro:

```
HTTP → routes → middleware → controllers → services → repositories → models → MongoDB
                                              │
                                       (core / strategies / utils)
```

| Capa | Carpeta | Responsabilidad | Regla |
|------|---------|-----------------|-------|
| **Rutas** | `src/routes/` | Definen endpoints, aplican `validate(schema)` y middlewares de auth. | No tienen lógica de negocio. |
| **Middleware** | `src/middleware/` | `auth` (JWT + roles), `validation` (Joi), `errorHandler` (centralizado). | Transversal. |
| **Controladores** | `src/controllers/` | Adaptan HTTP ⇄ servicios (req/res). | No acceden a la BD directamente. |
| **Servicios** | `src/services/` | Lógica de negocio. `authService` es la **única** fuente de creación de usuarios. | Dependen de repositorios. |
| **Core** | `src/core/` | Algoritmo de recomendaciones por provincia. | — |
| **Strategies** | `src/strategies/` | Patrón Strategy de pricing (Standard/Holiday/LastMinute + Selector). | — |
| **Repositorios** | `src/repositories/` | Único punto de acceso a Mongoose (CRUD, queries, transacciones). | Solo persistencia. |
| **Modelos** | `src/models/` | Esquemas Mongoose. | Definen forma + índices. |
| **Validación** | `src/validations/schemas.js` | Esquemas Joi por dominio. | Se aplican en las rutas. |
| **Config** | `src/config/` | `db` (conexión), `swagger`, `externalApis` (URL externa centralizada). | — |
| **Utils** | `src/utils/` | `AppError`, `asyncHandler`, `serializers` (DTOs), `discountUtils`, `cedulaValidator`, `provinciaUtils`. | Sin estado. |
| **Scripts** | `src/scripts/` | Tareas operativas (`seedAdmin`, `populateData`, …). | Se ejecutan a mano. |

### Dónde está cada dominio
Cada dominio sigue el mismo patrón `routes → controllers → services → repositories → models`:
`users`, `auth`, `reservas`, `rutas`, `boletos`, `hoteles`, `lugarTuristico`, `calificacion`, `recomendacion`, `cedula`, `asientos`/`seat` (proxy), `pricing`, `stats`.

### Roles y seguridad
- El rol se guarda en `User.role` (`ADMIN` | `USER`) y viaja en el JWT (en minúsculas).
- `authenticateToken` carga el usuario y normaliza el rol; `requireAdminAccess` exige `admin`.
- Para crear/promover un admin: `npm run seed:admin -- --cedula <ced> [--password <pwd>]`.

---

## Frontend — Estructura por responsabilidad

```
src/
├── main.jsx              Punto de entrada (Router)
├── App.jsx               Rutas + guardias (ProtectedRoute / AdminRoute)
├── components/           UI reutilizable
│   ├── RouteGuards.jsx   ProtectedRoute (sesión) y AdminRoute (rol)
│   ├── BoletoQR.jsx      QR del boleto del usuario
│   ├── Navbar, LoginForm, RegisterForm, BusSeatSelector, …
├── pages/                Vistas por ruta
│   ├── Dashboard.jsx     "Mis Reservas" (usuario) + QR
│   ├── Admin.jsx         Shell del panel admin (pestañas)
│   └── admin/            Vistas admin: AdminUsers, AdminRutas, AdminBoletos, AdminStats
├── services/             Acceso a la API (capa de datos del front)
│   ├── api.js            Axios + interceptores (token / 401)
│   ├── session.js        Sesión y rol (setSession, isAdmin, homePathForRole, …)
│   ├── auth, users, reservas, rutas, boletos, stats, calificaciones, …
├── constants/            Constantes (ciudades, países, api, …)
└── styles/               CSS (base / components / pages / utils)
```

### Redirección por rol
- Tras el login, `homePathForRole(role)` envía a `/admin` (admin) o `/dashboard` (usuario).
- `AdminRoute` protege `/admin`; usuarios no-admin son redirigidos a `/dashboard`.
- El `Navbar` muestra "Panel Admin" solo si el rol es admin.
