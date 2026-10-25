---
tags: [servicios, apis, integraciones, contexto]
proyecto: CulturalTrip / BusReservation
tipo: contexto-tecnico
actualizado: 2026-09-22
---

# 02 · Servicios Consumidos (APIs, BD y Dependencias Externas)

Ver arquitectura general en [[01-arquitectura-general]].

## 1. Base de datos

| Servicio | Tipo | Cliente/ORM | Configuración |
|----------|------|-------------|----------------|
| **MongoDB Atlas** | Base de datos documental (NoSQL) | `mongoose` (`^9.2.4`) | `MONGO_URI` en `backend/.env`. Conexión gestionada en `backend/src/config/db.js`. |

Colecciones/modelos principales (`backend/src/models/`):
- `userModel.js` — usuarios y roles (`ADMIN` / `USER`).
- `rutaModel.js` — rutas de bus.
- `reservaModel.js` — reservas de boletos.
- `boletoModel.js` — boletos emitidos.
- `holdModel.js` — retenciones temporales de asiento (locking durante el proceso de compra).
- `hotelModel.js` — hoteles asociados a un destino/provincia.
- `lugarTuristicoModel.js` — lugares turísticos.
- `lugaresRecomendadosModel.js` — recomendaciones generadas por el motor de recomendación. ⚠️ Colección de **solo escritura**: se escribe en cada petición y nunca se lee para construir la respuesta (ver `#11BUG` en `BUGS.md`).
- `calificacionModel.js` — calificaciones/reseñas de usuarios.

### Ciclo de vida de la cuenta (baja lógica)

Las cuentas **no se borran nunca**. `userModel` tiene un campo `estado` con tres
valores, y `backend/src/utils/estadoCuenta.js` es la fuente única de verdad:

| Estado | Puede entrar | Datos | Reversible |
|--------|--------------|-------|------------|
| `ACTIVO` | sí | — | — |
| `BLOQUEADO` | no (403) | se conservan íntegros | sí, por un admin |
| `ELIMINADO` | no (410) | se conservan íntegros | sí, por un admin |

Por qué no se borra: si se eliminara el documento del usuario, las reservas,
boletos y calificaciones que lo referencian quedarían apuntando a un `ObjectId`
inexistente, los `populate('user')` devolverían `null` y se perdería el histórico
de quién viajó (ver `#16BUG`).

Detalles que conviene recordar:

- Los documentos anteriores a la migración **no tienen el campo**: todo el código
  trata `undefined` como `ACTIVO`.
- El estado se comprueba en **cada petición** (`middleware/auth.js`), no solo en el
  login: los JWT viven 8 horas, así que bloquear una cuenta sin esta comprobación
  la dejaría operando durante el resto de la vida de su token.
- En el login el estado se revisa **después** de validar la contraseña, para que no
  se pueda averiguar qué cuentas están bloqueadas sin conocer las credenciales.
- Campos de auditoría: `estadoMotivo` (el texto que ve el usuario al intentar
  entrar), `estadoCambiadoEn`, `estadoCambiadoPor`.
- Endpoints: `PATCH /api/users/:id/estado` (admin) y `DELETE /api/users/me`
  (el titular se da de baja). `DELETE /api/users/:id` sigue existiendo para el
  admin, pero ahora hace baja lógica.
- El interceptor de `frontend/src/services/api.js` reconoce el campo `estado` en
  las respuestas 403/410 y cierra la sesión guardando el motivo en
  `sessionStorage` para que `LoginForm` lo explique.

Cubierto por `src/__tests__/integration/estadoCuenta.test.js` (14 pruebas).

---

## 2. API externa: Asientos y Pricing

| Atributo | Detalle |
|----------|---------|
| **Nombre interno** | API externa de asientos/pricing (consumidor de autobuses) |
| **URL por defecto** | `https://apiconsumidorac.onrender.com` |
| **Variable de entorno** | `EXTERNAL_API_URL` (con compatibilidad hacia atrás: `EXTERNAL_SEAT_API`, `PRICING_API`, `SEAT_API_URL`) |
| **Configuración** | `backend/src/config/externalApis.js` |
| **Consumida por** | `seatProxy.routes.js`, `asientosRoutes.js`, `pricingRoutes.js`, `pricingService.js` |
| **Propósito** | Consulta de disponibilidad de asientos y precios base para el cálculo de tarifas de boletos |
| **Timeout configurado** | 4000 ms (`DEFAULT_REQUEST_TIMEOUT_MS`) |
| **Fallback** | Precio unitario por defecto de $10 USD (`DEFAULT_PRECIO_UNITARIO_USD`) si la API externa no responde o no resuelve el precio real |
| **Patrón de integración** | Proxy/Adapter — el backend actúa como intermediario entre el frontend y esta API externa |

> **Nota histórica:** según el historial de commits del proyecto, esta integración tuvo mejoras recientes ("mejoras en el consumo de la API de Hoteles", corrección de rutas hacia Cuenca y otras ciudades concatenando la búsqueda de API KEY con el trim del país "Ecuador"). Ver [[historial-prompts]] si se documentaron prompts relacionados con estos fixes.

---

## 3. Google Places API

| Atributo | Detalle |
|----------|---------|
| **Servicio** | Google Places API (Text Search, Place Details, Place Photos) |
| **Variable de entorno** | `GOOGLE_PLACES_API_KEY` |
| **Archivo** | `backend/src/services/googlePlacesService.js` |
| **Consumida por** | `hotelService.js` (hoteles), `lugarTuristicoService.js` (lugares turísticos) |
| **Propósito** | Búsqueda de hoteles y lugares turísticos por ciudad/provincia, obtención de detalles (dirección, rating, horarios) y fotos de lugares |
| **Endpoints usados** | Text Search, Place Details, Place Photo (`GOOGLE_PLACES_TEXTSEARCH_URL`, `GOOGLE_PLACES_DETAILS_URL`, `GOOGLE_PLACES_PHOTO_URL`) |

---

## 4. Google Maps Directions API

| Atributo | Detalle |
|----------|---------|
| **Servicio** | Google Maps Directions API |
| **Variable de entorno** | `GOOGLE_MAPS_SERVER_KEY` |
| **Archivo** | `backend/src/services/mapsService.js` |
| **Consumida por** | Módulo de `rutas` (cálculo/validación de trayectos entre ciudades) |
| **Propósito** | Cálculo de direcciones/distancias entre origen y destino de una ruta de bus |

---

## 5. Google Maps JavaScript API (frontend)

| Atributo | Detalle |
|----------|---------|
| **Servicio** | Google Maps JavaScript API |
| **Librería** | `@react-google-maps/api` (`^2.20.8`) |
| **Uso** | Renderizado de mapas interactivos en el frontend (selección de rutas/ciudades) |
| **Complemento** | `react-simple-maps` (`^3.0.0`) + `frontend/public/ecuador-provinces.geojson` para mapas coropléticos por provincia ecuatoriana |

---

## 6. Servicio de correo

Conviven **dos mecanismos distintos**, y es importante no confundirlos.

### 6.1. Envío delegado en la API consumidora (mecanismo vigente)

| Atributo | Detalle |
|----------|---------|
| **Archivo** | `backend/src/services/mailerService.js` |
| **Patrón** | Adapter / Gateway de servicio externo |
| **Transporte** | HTTP (`axios`) hacia la API consumidora. **Este backend no habla SMTP.** |
| **Variables de entorno** | `MAIL_API_URL` (si está vacía se reutiliza `EXTERNAL_API_URL`), `MAIL_API_PATH` (por defecto `/api/mail/send`), `MAIL_API_KEY`, `MAIL_API_TIMEOUT_MS`, `MAIL_FROM`, `APP_NAME` |
| **Contrato** | `POST {MAIL_API_URL}{MAIL_API_PATH}` con `{ to, subject, html, text, from, appName, meta }` → `200/201` con `{ ok: true, id? }` |
| **Usado por** | Recuperación de contraseña (`authService.requestPasswordReset`) |
| **Propósito** | Centralizar el envío en la API consumidora, que es la que tiene las credenciales del proveedor de correo |

Por qué se eligió así:

- las credenciales de correo no viven en este servicio ni en su `.env`;
- hay un único lugar que mantener si cambia el proveedor (SMTP, Resend, SES…);
- el backend sigue siendo desplegable sin ninguna variable SMTP.

`enviarCorreo()` **no lanza** ante un fallo de red: devuelve `{ ok: false }` para
que el flujo que lo invoca decida. En el reseteo, un fallo de envío borra el token
recién guardado (para no dejar uno vigente que nadie recibió) y responde `502`.

### 6.2. SMTP directo (heredado, inoperativo)

| Atributo | Detalle |
|----------|---------|
| **Librería** | `nodemailer` (`^6.10.1`) |
| **Archivo** | `backend/src/services/boletoEmailService.js` |
| **Variables de entorno** | `EMAIL_HOST`/`SMTP_HOST`, `EMAIL_PORT`/`SMTP_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` |
| **Propósito** | Envío del boleto de bus con QR y PDF adjunto tras confirmar una reserva |
| **Dependencias relacionadas** | `qrcode`, `pdfkit` |
| **Estado** | ⚠️ **No funciona.** Ver `#14BUG` en `BUGS.md`: ninguna de las variables SMTP está definida en `.env` ni en `.env.example`, así que `createTransport()` lanza siempre y el envío falla en silencio (la reserva se confirma, el PDF se genera y nadie recibe nada). Migrarlo a `mailerService` resolvería el problema de raíz. |

---

## 6.bis. Recuperación de contraseña

| Atributo | Detalle |
|----------|---------|
| **Endpoints** | `POST /api/auth/forgot-password`, `GET /api/auth/reset-password/:token`, `POST /api/auth/reset-password/:token` |
| **Archivos** | `services/authService.js`, `services/mailerService.js`, `config/appUrls.js`, `views/resetPasswordPage.js` |
| **Variables de entorno** | `VERCEL_BACKEND_URL`, `FRONTEND_URL`, `RESET_TOKEN_TTL_MINUTES` (30 por defecto) |

Flujo completo:

1. El usuario pulsa «¿Olvidaste tu contraseña?» en `LoginForm` y escribe su correo
   en una ventana emergente.
2. `POST /api/auth/forgot-password` genera un token aleatorio de 32 bytes y guarda
   en Mongo **solo su hash SHA-256** (`resetPasswordTokenHash`), nunca el token en
   claro: leer la colección no basta para secuestrar un reseteo en curso.
3. Se construye el enlace dinámico:
   `${VERCEL_BACKEND_URL}/api/auth/reset-password/${token}`
   (`config/appUrls.js` → `buildResetPasswordUrl`).
4. El correo lo envía la API consumidora (§ 6.1).
5. El enlace apunta al **backend**, no al frontend: así el token se valida en el
   servidor *antes* de renderizar el formulario, y un enlace caducado nunca llega a
   mostrar la pantalla de cambio. La página (`views/resetPasswordPage.js`) es
   autocontenida y mantiene la identidad visual (negro + amarillo con
   glassmorphism), por lo que funciona aunque el frontend esté caído.
6. `POST /api/auth/reset-password/:token` consume el token (un enlace, un solo uso).

Decisiones de seguridad:

- `forgot-password` responde **siempre lo mismo** exista o no el correo: si
  distinguiera ambos casos, sería un oráculo para enumerar usuarios registrados.
- Una cuenta `BLOQUEADO` o `ELIMINADO` no puede recuperar su acceso por esta vía:
  reactivarla es una decisión administrativa, no un cambio de contraseña.
- Se rechaza reutilizar la contraseña actual.

Cubierto por `src/__tests__/integration/passwordReset.test.js` (11 pruebas).

---

## 7. Validación de cédula ecuatoriana

| Atributo | Detalle |
|----------|---------|
| **Tipo** | Lógica interna (no es una API externa) |
| **Archivo** | `backend/src/utils/cedulaValidator.js` + `backend/src/services/cedulaService.js` |
| **Propósito** | Validar el número de cédula (documento nacional de identidad ecuatoriano) en el registro de usuarios, aplicando el algoritmo módulo 10 oficial |

---

## 8. Autenticación y JWT

| Atributo | Detalle |
|----------|---------|
| **Librería** | `jsonwebtoken` (`^9.0.2`) |
| **Variable de entorno** | `JWT_SECRET` |
| **Expiración del token** | 8 horas |
| **Archivo** | `backend/src/services/authService.js`, `backend/src/middleware/auth` |

---

## 9. Documentación de la API (interna)

| Atributo | Detalle |
|----------|---------|
| **Herramienta** | Swagger (`swagger-jsdoc` + `swagger-ui-express`) |
| **Archivo** | `backend/src/config/swagger.js` |
| **Endpoint** | `http://localhost:5000/api-docs` (local) |
| **Colección adicional** | `backend/docs/postman_collection.json` (Postman) |

---

## 10. Endpoints REST expuestos por el backend

Prefijo base: `/api` (montado en `backend/src/routes/index.js`).

| Prefijo | Dominio | Descripción |
|---------|---------|-------------|
| `/api/seat` | Proxy de asientos | Proxy hacia la API externa de asientos |
| `/api/asientos` | Asientos | Gestión de asientos/holds |
| `/api/pricing` | Pricing | Cálculo de precios (patrón Strategy) |
| `/api/users` | Usuarios | CRUD de usuarios + baja lógica (`DELETE /me`, `PATCH /:id/estado`) |
| `/api/auth` | Autenticación | Login, registro, JWT, recuperación de contraseña |
| `/api/reservas` | Reservas | Creación y gestión de reservas |
| `/api/rutas` | Rutas | CRUD de rutas de bus |
| `/api/boletos` | Boletos | Emisión y consulta de boletos (QR, email) |
| `/api/hoteles` | Hoteles | Búsqueda/gestión de hoteles (Google Places) |
| `/api/lugares-turisticos` | Lugares turísticos | Búsqueda/gestión de lugares turísticos (Google Places) |
| `/api/calificaciones` | Calificaciones | Reseñas/calificaciones de usuarios |
| `/api/recomendaciones` | Recomendaciones | Motor de recomendación por provincia |
| `/api/cedula` | Cédula | Validación de cédula ecuatoriana |
| `/api/stats` | Estadísticas | Métricas para el panel admin |
| `/api/agente` | Agente | Lógica de agente/asistente (ver `agenteService.js`) |

---

## 11. Diagrama de integración (vista lógica)

```
                        ┌───────────────────────┐
                        │   Frontend (React)    │
                        └───────────┬───────────┘
                                    │ Axios (REST/JSON)
                                    ▼
                        ┌───────────────────────┐
                        │  Backend (Express API)│
                        └─┬───────┬───────┬─────┘
                          │       │       │
           ┌──────────────┘       │       └───────────────┐
           ▼                      ▼                        ▼
 ┌───────────────────┐  ┌──────────────────┐   ┌───────────────────────┐
 │ MongoDB Atlas      │  │ API externa      │   │ Google APIs           │
 │ (persistencia)     │  │ Asientos/Pricing │   │ Places + Directions   │
 └───────────────────┘  └──────────────────┘   └───────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ SMTP (Nodemailer)     │
                        │ Envío de boletos      │
                        └───────────────────────┘
```

---

## Referencias cruzadas
- [[01-arquitectura-general]] — Arquitectura de capas y decisiones técnicas.
- [[glosario-tecnologico]] — Definiciones y versiones de tecnologías.
- [[historial-prompts]] — Prompts relacionados con estas integraciones.
- `XTest/BUGS.md` — Catálogo de las 35 fallas documentadas en el código con marcas `#NBUG`.
