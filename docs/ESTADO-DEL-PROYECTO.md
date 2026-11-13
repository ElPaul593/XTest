# Estado del proyecto — CulturalTrip (noviembre 2026)

Documento de cierre de la fase final de la tesis. Resume qué hace el sistema, qué
se verificó, qué cambió en la última revisión y qué queda fuera del alcance.

> Documentos relacionados en esta carpeta:
> [`INTEGRACION-SEAT-API.md`](INTEGRACION-SEAT-API.md) (contrato con la API externa y
> el flujo de pago), [`VARIABLES-DE-ENTORNO.md`](VARIABLES-DE-ENTORNO.md) (todas las
> variables de los dos repositorios) y [`DESPLIEGUE-Y-VERIFICACION.md`](DESPLIEGUE-Y-VERIFICACION.md)
> (cómo publicar y comprobar que quedó funcionando).

---

## 1. Qué es el sistema

Dos repositorios que trabajan juntos:

| Repositorio | Qué contiene | Dónde corre |
|---|---|---|
| **XTest** (CulturalTrip) | `backend/` Express + MongoDB Atlas, `frontend/` React + Vite. Cuentas, rutas, reservas, boletos con QR, agente de abordaje, lugares turísticos, calificaciones y recomendaciones por provincia. | Backend en Render (`https://xtest-12qn.onrender.com`), frontend en Vercel. |
| **apiconsumidorac** | `seat-api/` API hexagonal de asientos (holds, reservas, cotización) con pasarela PayPal Sandbox, más un frontend propio de demostración. | Un solo proyecto de Vercel: `https://apiconsumidorac.vercel.app` sirve el frontend y, bajo `/api`, la Seat API. |

El backend de CulturalTrip **nunca habla con PayPal directamente**: delega en la Seat
API (bloqueo de asientos, cotización, creación y captura de la orden) y guarda en Mongo
el espejo de cada pago (`Pago`) y la reserva definitiva (`Reserva`).

---

## 2. Qué se corrigió en esta revisión

### 2.1 El precio que cobraba PayPal no era el de la ruta

**Síntoma.** La ruta Guayaquil–Quito cuesta 18 USD en CulturalTrip, pero PayPal Sandbox
cobraba 12,50 USD. El frontend mostraba un total y la pasarela otro.

**Causa.** La Seat API cotizaba siempre con su propio `BASE_PRICE` (12,50) y no aceptaba
el precio del consumidor. CulturalTrip recalculaba el total en local con el precio de la
ruta para *mostrarlo*, pero la orden de PayPal la creaba la Seat API con su precio base.

**Solución (en la API externa, como se pidió).**

- `POST /api/asientos/reservar` acepta `precioUnitario`. Se valida (número > 0 y
  ≤ 10 000) y se guarda **en cada hold**.
- `POST /api/checkout/crear-orden` ya no recibe ningún importe del cliente: toma el
  `precioUnitario` de los holds. Si los holds de una orden tienen precios distintos la
  rechaza (400). Así PayPal cobra exactamente lo que el comprador vio.
- `POST /calcular-precio` y la nueva ruta `POST /api/asientos/calcular-precio` aceptan
  `precioUnitario` y devuelven además `origenPrecio: 'ruta' | 'api'`.
- La tabla de descuentos por volumen (5 %, 7 %, 10 %, 20 % desde 2, 3, 4 y 5 asientos) y
  el redondeo a centavos se aplican igual con cualquier precio, en una única función
  (`PricingPolicy.quote`).

**En CulturalTrip** el backend envía ahora el precio de la ruta (`Ruta.price`) al
bloquear (`/api/asientos/reservar`) y al cotizar (`/api/asientos/calcular-precio` y
`/api/pricing/calcular-precio`). El frontend no cambió su contrato.

**Verificación.** Orden creada en PayPal Sandbox con ruta de 18 USD → PayPal registra
`amount.value = "18.00"`. Con 2 asientos a 18 USD → 36 − 5 % = 34,20 USD en la orden.

### 2.2 Rutas: revisión de completitud

- Se cruzaron las 152 rutas semilla (`backend/src/data/seedData.js`) con la tabla de
  precios y duraciones: **las 152 tienen precio y duración propios**; ninguna cae en el
  valor por defecto.
- Se cruzaron las 58 llamadas HTTP del frontend (`frontend/src/services/*.js`) con las
  rutas montadas en `backend/src/routes/`: **todas existen** en el backend. No faltaba
  ninguna ruta Express.
- La única ruta que faltaba estaba en la API externa: `POST /api/asientos/calcular-precio`
  (el backend la documentaba como 404 y usaba el alias de la raíz). Ahora existe.

### 2.3 Encuesta de preferencias (registro) y recomendaciones

Flujo verificado de punta a punta:

1. `RegisterForm.jsx` ofrece la encuesta (Museo, Parque, Monumento, Playa, Montaña,
   Centro Histórico, Otro) y envía `preferencias` en el registro nacional y extranjero.
2. `validations/schemas.js` acepta el arreglo; `authService.createUserAccount` lo
   normaliza (`normalizePreferencias`) y lo persiste en `User.preferencias`. También se
   puede editar en **Mi perfil**.
3. `recommendationCore.getRecomendadosPorProvincia` (usuarios ecuatorianos) y
   `recomendacionService.getRecomendadosGenerales` (extranjeros) multiplican por 1,2 el
   puntaje de los lugares cuyo `tipo` coincide con una preferencia, sin ocultar el resto.

No se cambió el algoritmo: funciona como está documentado en el formulario ("el sistema
prioriza estas categorías, pero sigue mostrando recomendaciones de otras").

### 2.4 Interfaz: iconografía y mapa del bus

- Se eliminaron **todos los emojis** de los dos frontends y del panel HTML de la Seat
  API. Se sustituyen por un componente `Icon` (SVG de 24×24, trazo `currentColor`) con
  la misma colección en los tres sitios: `XTest/frontend/src/components/Icon.jsx`,
  `apiconsumidorac/src/components/Icon.tsx` y
  `apiconsumidorac/seat-api/src/infrastructure/http/views/icons.js`. Los iconos
  heredan el color del texto y respetan el tema claro/oscuro.
- El mapa de asientos (en ambos frontends) delimita ahora el bus: parabrisas, cabina con
  volante y puerta, laterales marcados como **ventana**, número de fila, pasillo con línea
  de guía y parte trasera. Cada asiento indica si es ventana o pasillo y lleva una marca
  de esquina (no depende solo del color).
- `BusSeatSelector` de CulturalTrip se reescribió sobre las variables del tema
  (glassmorphism oscuro/claro) y dejó de usar colores en línea pensados para fondo blanco.
- El frontend de demostración de la Seat API tiene un campo **Precio por asiento** para
  reproducir el flujo de CulturalTrip (precio de la ruta → hold → PayPal).

---

## 3. Comprobaciones realizadas

| Comprobación | Resultado |
|---|---|
| `XTest/backend` — `npm run lint` | limpio |
| `XTest/backend` — `npm test` | 80 / 80 pruebas, 11 suites |
| `XTest/frontend` — `npm run build` | correcto |
| `apiconsumidorac` — `npm run build` (tsc estricto + Vite) | correcto |
| `apiconsumidorac` — `npm run lint` | 0 errores (1 aviso de Fast Refresh en `Icon.tsx`, deliberado) |
| `apiconsumidorac` — `npm run check:render` | todos los componentes renderizan |
| `seat-api` — `npm run smoke` | 23 / 23 comprobaciones |
| Seat API local — hold con `precioUnitario: 18` × 2 asientos | subtotal 36, descuento 5 %, total 34,20 |
| Seat API local — orden PayPal Sandbox con precio de ruta 18 | PayPal registra `18.00 USD` |
| Seat API local — holds con precios distintos en una orden | rechazada (400) |

---

## 4. Pendientes conocidos (fuera de esta entrega)

Siguen documentados en [`../BUGS.md`](../BUGS.md): código muerto y archivos huérfanos
pendientes de borrado (`#1`, `#18`–`#31`), avisos nativos `alert()` en algunas
pantallas (`#33`) y los selectores genéricos de `destino.css` (`#34`). Ninguno afecta el
flujo de compra ni el pago.

La Seat API guarda holds y órdenes **en memoria**: en Vercel (serverless) cada instancia
tiene su propio inventario y se reinicia. CulturalTrip lo compensa cruzando con las
reservas de Mongo (`getAsientosVendidos`) y con sus propios holds de respaldo. Para un
inventario consistente entre instancias habría que persistirlo (Redis/Mongo) o desplegar
la Seat API en Render como proceso único (`apiconsumidorac/render.yaml`).
