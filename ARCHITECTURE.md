# CulturalTrip: esqueleto de arquitectura

Este branch contiene la base estructural de AT-01. La implementacion de cada
funcionalidad se incorporara progresivamente en los siguientes sprints.

## Backend: arquitectura en capas

```text
HTTP request
    |
    v
routes -> middleware -> controllers -> services -> repositories -> models -> MongoDB
                         |              |             |
                         v              v             v
                    validations      core       strategies / utils
```

### Responsabilidades

| Capa | Ubicacion | Responsabilidad |
| --- | --- | --- |
| Rutas | `backend/src/routes/` | Declara endpoints y conecta middleware con controladores. |
| Middleware | `backend/src/middleware/` | Autenticacion, validacion y manejo transversal de errores. |
| Controladores | `backend/src/controllers/` | Recibe `req`, invoca servicios y construye respuestas HTTP. |
| Servicios | `backend/src/services/` | Contiene las reglas de negocio de cada dominio. |
| Repositorios | `backend/src/repositories/` | Encapsula las consultas y operaciones de persistencia. |
| Modelos | `backend/src/models/` | Define los esquemas y modelos de Mongoose. |
| Configuracion | `backend/src/config/` | Conexion a base de datos y configuraciones externas. |
| Validaciones | `backend/src/validations/` | Esquemas de entrada por dominio. |
| Core | `backend/src/core/` | Logica de dominio compartida o algoritmos centrales. |
| Strategies | `backend/src/strategies/` | Variantes intercambiables de reglas de negocio. |
| Utilidades | `backend/src/utils/` | Funciones comunes sin responsabilidad de dominio. |
| Scripts | `backend/src/scripts/` | Tareas operativas y de mantenimiento. |

Regla de dependencia: las rutas no acceden directamente a modelos o a la base
de datos; los controladores delegan en servicios y los servicios usan
repositorios para persistir informacion.

## Frontend: separacion por responsabilidad

```text
pages -> components -> services -> API backend
  |          |            |
  +------ styles / constants
```

- `frontend/src/pages/`: vistas asociadas a rutas.
- `frontend/src/components/`: componentes reutilizables.
- `frontend/src/services/`: comunicacion con la API.
- `frontend/src/constants/`: valores compartidos.
- `frontend/src/styles/`: estilos base, componentes, paginas y utilidades.

## Estructura inicial

```text
backend/src/
|-- config/
|-- controllers/
|-- core/
|-- middleware/
|-- models/
|-- repositories/
|-- routes/
|-- scripts/
|-- services/
|-- strategies/
|-- utils/
`-- validations/

frontend/src/
|-- components/
|-- constants/
|-- pages/
|   `-- admin/
|-- services/
`-- styles/
    |-- base/
    |-- components/
    |-- pages/
    `-- utils/
```
