# CulturalTrip / BusReservation

Sistema de reserva de boletos de bus con módulo turístico (lugares, hoteles,
calificaciones y recomendaciones por provincia). Proyecto académico.

- **Backend:** Node.js + Express + MongoDB (Mongoose), arquitectura en capas.
- **Frontend:** React + Vite (SPA) con panel de administración y QR de boleto.
- **Infra:** Docker (backend + frontend) y `docker-compose` para entorno local.

## Estructura
```
CulturalTrip/
├── backend/            API REST (capas: routes → controllers → services → repositories → models)
├── frontend/           SPA React/Vite (components, pages, services, styles)
├── docker-compose.yml  Orquestación local (backend + frontend)
├── render.yaml         Blueprint de Render (backend con Docker)
├── ARCHITECTURE.md     Dónde vive cada cosa (capas backend y estructura frontend)
└── DEPLOYMENT.md       Despliegue: GitHub + Render + Vercel + Docker
```

## Desarrollo local (sin Docker)
```bash
# Backend
cd backend && npm install && npm run dev      # http://localhost:5000

# Frontend (otra terminal)
cd frontend && npm install && npm run dev      # http://localhost:3000
```
Crea `backend/.env` con `MONGO_URI` y `JWT_SECRET` (ver `backend/.env.example`).

## Todo en Docker (local)
```bash
docker compose up --build
# Frontend http://localhost:3000 · Backend http://localhost:5000
```

## Roles
- Crear/promover admin: `cd backend && npm run seed:admin -- --cedula <ced> --password <pwd>`
- Tras el login, el admin entra al **Panel Admin** (usuarios, rutas, boletos, estadísticas)
  y el usuario a **Mis Reservas** (con código QR del boleto).

## Documentación
- Arquitectura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Despliegue: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- API (Swagger): `http://localhost:5000/api-docs`

## CI/CD con GitHub Actions

El workflow [`ci-cd.yml`](./.github/workflows/ci-cd.yml) automatiza el Sprint 0:

- En cada pull request o push a `main`, instala dependencias con `npm ci`, ejecuta
  lint y pruebas del backend y compila el frontend.
- Después construye las imágenes Docker del backend y frontend.
- Solo después de un push exitoso a `main`, publica ambas imágenes en GitHub
  Container Registry (GHCR) con las etiquetas `latest` y `sha-<commit>`.

El workflow usa `GITHUB_TOKEN`; no requiere guardar un token adicional. En el
repositorio de GitHub, revisa **Settings → Actions → General → Workflow
permissions** y permite que los workflows tengan permiso de lectura y escritura
si la organización lo exige. Las variables de MongoDB, JWT, correo y APIs
externas siguen siendo secretos de Render/Vercel o del entorno local, nunca del
archivo YAML.
