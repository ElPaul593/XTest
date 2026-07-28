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
