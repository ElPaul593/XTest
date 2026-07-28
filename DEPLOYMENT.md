# Guía de despliegue — CulturalTrip / BusReservation

Arquitectura de despliegue:

```
   Navegador
      │
      ▼
  Vercel  ───(HTTPS, VITE_API_URL)──►  Render (Docker)  ──►  MongoDB Atlas
 (frontend SPA)                          (backend API)
```

- **Frontend** → Vercel (estáticos compilados con Vite).
- **Backend** → Render (contenedor Docker).
- **Base de datos** → MongoDB Atlas (ya configurada).

> Nota sobre Docker: Render ejecuta el backend **con tu Dockerfile**. Vercel publica el
> frontend como estáticos (no usa Docker). Para correr **todo en Docker en local** usa
> `docker compose up` (ver el final). Así cumples "todo dockerizado" sin perder Vercel.

---

## 0. Requisitos
- Cuenta en GitHub, Render y Vercel (los planes gratuitos sirven).
- En **MongoDB Atlas → Network Access**, permite `0.0.0.0/0` (para que Render se conecte).
- `backend/.env` y `frontend/.env` existen en local pero **NO se suben** (están en `.gitignore`).

---

## 1. Subir el proyecto a GitHub
Crea un repositorio **vacío** en https://github.com/new (sin README ni .gitignore).
Luego, desde la raíz del proyecto:

```bash
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

---

## 2. Backend en Render (Docker)

### Opción A — Blueprint (recomendado, usa `render.yaml`)
1. En Render: **New + → Blueprint** y conecta tu repositorio.
2. Render detecta `render.yaml` y crea el servicio `culturaltrip-api` (Docker, `rootDir: backend`).
3. Completa las variables **secretas** en el panel del servicio → **Environment**:
   - `MONGO_URI` = tu cadena de conexión de Atlas.
   - `JWT_SECRET` = una cadena larga y aleatoria.
   - `EXTERNAL_API_URL` = URL de la API externa de asientos/pricing (o déjala con el valor por defecto).
4. Deploy. Cuando termine, copia la URL pública (ej. `https://culturaltrip-api.onrender.com`).
5. Verifica: abre `https://culturaltrip-api.onrender.com/health` → debe responder `{ "ok": true }`.

### Opción B — Manual
**New + → Web Service** → conecta el repo → **Language: Docker** → **Root Directory: `backend`**
→ Health Check Path: `/health` → agrega las mismas variables de entorno → Deploy.

### Crear el usuario administrador (una vez desplegado)
En Render, **Shell** del servicio (o en local apuntando a la misma Atlas):
```bash
npm run seed:admin -- --cedula 1722108188 --password TuClaveSegura123
```

---

## 3. Frontend en Vercel

1. En Vercel: **Add New → Project** e importa el mismo repositorio.
2. **Root Directory: `frontend`** (importante: el proyecto es un monorepo).
3. Framework Preset: **Vite** (build `npm run build`, output `dist`). El `vercel.json` ya
   incluye el *rewrite* SPA para que React Router funcione al recargar.
4. En **Settings → Environment Variables** agrega (Production):
   - `VITE_API_URL` = `https://TU-BACKEND.onrender.com/api`
   - `VITE_SEAT_API_URL` = `https://TU-BACKEND.onrender.com/api/asientos`
   (reemplaza `TU-BACKEND` por el subdominio real de Render)
5. Deploy. Obtendrás una URL tipo `https://tu-proyecto.vercel.app`.

> Si cambiaste las variables después del primer deploy, vuelve a **Redeploy** (Vite hornea
> las variables en el build).

---

## 4. CORS
El backend ya responde con CORS abierto (`origin: true`), así que el dominio de Vercel
puede llamar a Render sin configuración extra. Para endurecerlo en producción, se puede
restringir a tu dominio de Vercel (mejora opcional de seguridad).

---

## 5. Todo en Docker en local (para la defensa de la tesis)
Con Docker Desktop instalado y `backend/.env` creado:

```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend:  http://localhost:5000  (health: http://localhost:5000/health)

Para detener: `Ctrl+C` y `docker compose down`.

### Construir imágenes por separado
```bash
docker build -t culturaltrip-api ./backend
docker build -t culturaltrip-web --build-arg VITE_API_URL=http://localhost:5000/api ./frontend
```

---

## 6. Checklist de verificación
- [ ] `GET /health` del backend en Render responde `{ ok: true }`.
- [ ] Login funciona desde el frontend de Vercel (revisa la consola del navegador: las
      peticiones deben ir a `https://TU-BACKEND.onrender.com/api/...`).
- [ ] Un usuario admin entra al **Panel Admin**; un usuario normal a **Mis Reservas** con QR.
- [ ] Atlas → Network Access permite la IP de Render (`0.0.0.0/0`).
