# Variables de entorno — los dos repositorios

Ningún `.env` se versiona. Las plantillas con todos los valores están en
`XTest/backend/.env.example`, `XTest/frontend/.env.example`, `apiconsumidorac/.env.example`
y `apiconsumidorac/seat-api/.env.example`.

**Esta revisión no añade variables obligatorias nuevas.** Todo lo nuevo (precio por
ruta) viaja en el cuerpo de las peticiones. Las dos recomendaciones de abajo son
ajustes de valores existentes.

---

## 1. XTest · backend (Render → Environment)

| Variable | Obligatoria | Valor recomendado en producción | Para qué |
|---|---|---|---|
| `MONGO_URI` | sí | cadena de Atlas | Base de datos |
| `JWT_SECRET` | sí | cadena larga aleatoria | Firma de los tokens |
| `EXTERNAL_API_URL` | sí | `https://apiconsumidorac.vercel.app` | Seat API + PayPal. **Revisar:** el `.env` local apunta a `apiconsumidorac.onrender.com`, que el código ignora por no tener PayPal; en Render debe ser la URL de Vercel. |
| `SEAT_API_ADMIN_TOKEN` | no | igual que `ADMIN_TOKEN` de la Seat API | Aprobar/rechazar pagos en revisión desde el panel admin |
| `CORS_ORIGINS` | recomendada | `https://<frontend>.vercel.app` | Lista blanca CORS. Sin ella se acepta cualquier origen (aviso en consola) |
| `FRONTEND_URL` | recomendada | `https://<frontend>.vercel.app` | Enlaces de correo y CORS |
| `VERCEL_BACKEND_URL` | recomendada | `https://xtest-12qn.onrender.com` | Enlace de recuperación de contraseña |
| `GOOGLE_CLIENT_ID` | no | id OAuth | Botón "Entrar con Google" |
| `EMAIL_HOST/PORT/USER/PASS`, `MAIL_FROM` | no | SMTP (Gmail con contraseña de aplicación) | Boletos y verificación por correo |
| `MAIL_API_URL`, `MAIL_API_ENABLED` | no | — | Transporte alternativo vía API consumidora |
| `SEAT_API_TIMEOUT_MS`, `PAGO_API_TIMEOUT_MS` | no | 10000 / 30000 | Tiempos de espera |
| `DEFAULT_PRECIO_UNITARIO_USD`, `FALLBACK_TOTAL_ASIENTOS`, `FALLBACK_HOLD_TTL_MS` | no | 10 / 40 / 600000 | Solo si la Seat API no responde |
| `PORT`, `NODE_ENV` | no | lo pone Render / `production` | — |

## 2. XTest · frontend (Vercel → Environment Variables, Production)

| Variable | Valor | Nota |
|---|---|---|
| `VITE_API_URL` | `https://xtest-12qn.onrender.com/api` | Vite la hornea en el build: tras cambiarla hay que **Redeploy** |
| `VITE_SEAT_API_URL` | *(no se usa)* | El frontend pasa siempre por el backend. Se mantiene por compatibilidad del pipeline de CI |

## 3. apiconsumidorac (Vercel → Environment Variables)

Un solo proyecto sirve frontend y Seat API, así que las variables del API se definen aquí.

| Variable | Obligatoria | Valor recomendado | Para qué |
|---|---|---|---|
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | sí | credenciales Sandbox | Pasarela |
| `PAYPAL_MODE` | sí | `sandbox` | — |
| `NODE_ENV` | sí | `production` | Activa la lista blanca CORS |
| `ALLOWED_ORIGINS` | sí | `https://apiconsumidorac.vercel.app,https://<frontend-culturaltrip>.vercel.app` | CORS. El backend de CulturalTrip (servidor a servidor) no envía `Origin`, así que no hace falta añadir Render |
| `BASE_PRICE` | no | `12.50` | Precio **por defecto**. CulturalTrip envía el de cada ruta, así que este valor solo aplica a quien no lo envíe |
| `PRICE_CURRENCY`, `PAYMENT_CURRENCY`, `PAYMENT_FX_RATE` | no | `USD`, `USD`, `1` | Sin conversión |
| `MAX_SEATS_PER_BOOKING`, `CORPORATE_DISCOUNT_FROM` | no | 10 / 5 | Reglas de volumen |
| `SEAT_HOLD_TTL_MS`, `TOTAL_SEATS`, `SEATS_PER_ROW` | no | 600000 / 40 / 4 | Inventario |
| `ADMIN_TOKEN` | recomendada | cadena aleatoria | Protege `/api/admin` (misma que `SEAT_API_ADMIN_TOKEN` en Render) |
| `PAYPAL_WEBHOOK_ID` | no (sandbox) | id del webhook | Verificación de firma |
| `APP_RETURN_BASE_URL`, `APP_RETURN_PATH` | no | vacío / `/seat-booking` | CulturalTrip envía su propio `returnUrl` |
| `VITE_SEAT_API_URL` | no | vacío | El frontend usa el mismo origen |

---

## 4. Resumen de cambios de esta revisión

- **Ninguna variable nueva obligatoria.**
- Nueva opcional en la Seat API: `ADMIN_TOKEN` ya existía; se documenta su pareja
  `SEAT_API_ADMIN_TOKEN` en el backend.
- `BASE_PRICE` pasa a ser solo el valor por defecto: el precio real lo envía la
  aplicación consumidora por ruta.
- Recomendado revisar en Render que `EXTERNAL_API_URL` sea
  `https://apiconsumidorac.vercel.app` (ver §1).
- Las plantillas `.env.example` (que estaban borradas en el árbol de trabajo) se
  restauraron y actualizaron en los dos repositorios.
