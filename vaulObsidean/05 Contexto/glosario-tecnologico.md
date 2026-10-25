---
tags: [wiki, glosario, stack, tecnologias]
proyecto: CulturalTrip / BusReservation
tipo: wiki
actualizado: 2026-09-22
---

# Glosario Tecnológico

Referencia técnica del stack usado en el proyecto. Ver contexto de uso en [[01-arquitectura-general]] y [[02-servicios-consumidos]].

## 1. Backend (`backend/`)

| Tecnología | Versión | Categoría | Uso en el proyecto |
|------------|---------|-----------|---------------------|
| **Node.js** | `>=18` (engine) | Runtime | Motor de ejecución del backend |
| **Express** | `^4.18.2` | Framework web | Enrutamiento HTTP y middlewares del API REST |
| **Mongoose** | `^9.2.4` | ODM | Modelado de esquemas y acceso a MongoDB |
| **MongoDB Atlas** | — | Base de datos | Persistencia documental en la nube |
| **jsonwebtoken** | `^9.0.2` | Autenticación | Generación y verificación de JWT |
| **bcrypt** | `^5.1.0` | Seguridad | Hasheo de contraseñas |
| **helmet** | `^7.0.0` | Seguridad | Cabeceras HTTP seguras |
| **cors** | `^2.8.5` | Seguridad/HTTP | Control de acceso entre orígenes (frontend ⇄ backend) |
| **compression** | `^1.8.1` | Rendimiento | Compresión gzip de respuestas HTTP |
| **joi** | `^17.11.0` | Validación | Esquemas de validación de payloads (`src/validations/schemas.js`) |
| **morgan** | `^1.10.0` | Logging | Logging de peticiones HTTP en desarrollo |
| **dotenv** | `^16.3.1` | Configuración | Carga de variables de entorno desde `.env` |
| **axios** | `^1.13.3` | Cliente HTTP | Consumo de APIs externas (asientos/pricing, Google Places, Google Maps) |
| **nodemailer** | `^6.10.1` | Email | Envío de boletos por correo electrónico |
| **qrcode** | `^1.5.4` | Generación de QR | Código QR del boleto de bus |
| **pdfkit** | `^0.17.2` | Generación de PDF | Boleto en formato PDF |
| **swagger-jsdoc** / **swagger-ui-express** | `^6.2.8` / `^5.0.1` | Documentación de API | Documentación interactiva en `/api-docs` |

### Testing y calidad (backend)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **jest** | `^29.7.0` | Framework de testing |
| **supertest** | `^6.3.3` | Testing de endpoints HTTP |
| **mongodb-memory-server** | `^9.1.3` | Base de datos en memoria para tests de integración |
| **eslint** | `^8.46.0` | Linter de JavaScript |
| **nodemon** | `^3.0.4` | Recarga automática en desarrollo (`npm run dev`) |

---

## 2. Frontend (`frontend/`)

| Tecnología | Versión | Categoría | Uso en el proyecto |
|------------|---------|-----------|---------------------|
| **React** | `^18.2.0` | Librería UI | Construcción de la SPA |
| **React DOM** | `^18.2.0` | Renderizado | Montaje de la aplicación React en el DOM |
| **Vite** | `^5.4.20` | Build tool / dev server | Bundling y servidor de desarrollo |
| **react-router-dom** | `^6.18.0` | Enrutamiento | Rutas de la SPA, guardias (`ProtectedRoute`, `AdminRoute`) |
| **axios** | `^1.4.0` | Cliente HTTP | Consumo del API REST del backend (`services/api.js`) |
| **@react-google-maps/api** | `^2.20.8` | Mapas | Integración de Google Maps en el frontend |
| **react-simple-maps** | `^3.0.0` | Mapas | Mapas coropléticos (provincias de Ecuador) |
| **qrcode.react** | `^4.2.0` | QR | Renderizado del QR del boleto en el cliente |
| **html5-qrcode** | `^2.3.8` | Escaneo de QR | Lectura de códigos QR desde cámara/imagen |
| **serve** | `^14.2.0` | Servidor estático | Servir el build de producción (`npm start`) |
| **@vitejs/plugin-react** | `^5.0.4` | Plugin de Vite | Soporte de JSX/Fast Refresh en Vite |

---

## 3. Infraestructura y despliegue

| Tecnología | Uso |
|------------|-----|
| **Docker** | Contenerización de backend y frontend (`Dockerfile` en cada app) |
| **docker-compose** | Orquestación local de ambos servicios (`docker-compose.yml`) |
| **Render** | Hosting del backend (Docker), definido en `render.yaml` |
| **Vercel** | Hosting del frontend (`frontend/vercel.json`) |
| **Nginx** | Servidor web para servir el build del frontend en contenedor (`frontend/nginx.conf`) |

---

## 4. APIs y servicios externos

Ver detalle completo en [[02-servicios-consumidos]].

| Servicio | Categoría |
|----------|-----------|
| API externa de asientos/pricing (`apiconsumidorac.onrender.com`) | Disponibilidad de asientos y precios base |
| Google Places API | Búsqueda de hoteles y lugares turísticos |
| Google Maps Directions API | Cálculo de rutas entre ciudades |
| Google Maps JavaScript API | Mapas interactivos en frontend |
| SMTP (vía Nodemailer) | Envío de boletos por correo |

---

## 5. Conceptos de dominio (glosario funcional)

| Término | Definición en el contexto del proyecto |
|---------|------------------------------------------|
| **Ruta** | Trayecto de bus entre una ciudad de origen y una de destino, con horario de salida (`horaSalida`) y precio asociado |
| **Reserva** | Solicitud de compra de uno o más boletos para una ruta específica, previa a la emisión del boleto |
| **Boleto** | Documento emitido tras confirmar una reserva; incluye código QR y puede enviarse por email en PDF |
| **Hold** | Retención temporal de un asiento durante el proceso de compra, para evitar doble venta |
| **Lugar turístico** | Sitio de interés turístico asociado a una ciudad/provincia, enriquecido con datos de Google Places |
| **Hotel** | Alojamiento asociado a una ciudad/provincia, enriquecido con datos de Google Places |
| **Recomendación** | Sugerencia de lugares turísticos/hoteles generada por el motor de recomendación (`src/core/recommendationCore.js`) agrupada por provincia |
| **Calificación** | Reseña/puntuación dejada por un usuario sobre un lugar turístico, hotel o servicio |
| **Provincia** | Unidad geográfica administrativa de Ecuador; las ciudades se mapean a su provincia (`provinciaUtils.js`) para agrupar recomendaciones |
| **Estrategia de pricing** | Algoritmo de cálculo de tarifa según contexto: `StandardPricing`, `HolidayPricing`, `LastMinutePricing`, seleccionado por `PricingStrategySelector` |
| **Rol ADMIN / USER** | Nivel de acceso del usuario; `ADMIN` accede al panel administrativo, `USER` accede a "Mis Reservas" |

---

## Referencias cruzadas
- [[01-arquitectura-general]]
- [[02-servicios-consumidos]]
- [[historial-prompts]]

---
*Copia de `XTest/Obsidean/wiki/glosario-tecnologico.md`. El original es la versión que manda: si cambia, vuelve a generar el vault.*
