# Integración con la Seat API (apiconsumidorac) y PayPal

Cómo CulturalTrip consume la API externa de asientos y pagos, y cómo viaja el precio
de la ruta hasta PayPal.

---

## 1. Piezas

```
Frontend CulturalTrip (Vercel)
   │  /api/asientos/*, /api/pricing/*, /api/pagos/*   (siempre al backend propio)
   ▼
Backend CulturalTrip (Render)  ──► Seat API (apiconsumidorac.vercel.app)  ──► PayPal Sandbox
   │  Mongo: Ruta (precio), Pago (espejo de la orden), Reserva (asientos vendidos), Hold (respaldo)
```

- El frontend **nunca** llama a la Seat API directamente: pasa por el backend, que
  añade el precio de la ruta, cruza con lo ya vendido en Mongo y aplica un respaldo
  local si la API externa no responde.
- La URL base de la Seat API es `EXTERNAL_API_URL`; los caminos exactos están en
  `backend/src/config/externalApis.js` (`SEAT_API_PATHS`). La instalación antigua de
  Render se ignora aunque se configure.

---

## 2. Flujo de compra y dónde viaja el precio

| Paso | Frontend → Backend | Backend → Seat API | Qué pasa con el precio |
|---|---|---|---|
| 1. Mapa | `GET /api/asientos/disponibles` | `GET /api/asientos/disponibles` | — (se quitan los asientos vendidos según Mongo) |
| 2. Bloqueo | `POST /api/asientos/reservar` `{rutaId, fecha, asiento, userId}` | `POST /api/asientos/reservar` `{…, asientos, precioUnitario: Ruta.price}` | **El precio de la ruta se guarda en el hold.** |
| 3. Cotización | `POST /api/pricing/calcular-precio` `{cantidad, rutaId}` | `POST /calcular-precio` `{cantidad, precioUnitario}` | La API devuelve el desglose con el precio de la ruta (`origenPrecio: 'ruta'`). |
| 4. Orden | `POST /api/pagos/crear-orden` `{holdIds}` | `POST /api/checkout/crear-orden` `{holdIds, userId, returnUrl}` | La API **no recibe importe**: lo recalcula desde el `precioUnitario` de los holds. |
| 5. PayPal | redirección a `approvalUrl` | — | PayPal muestra el total de la orden (p. ej. 18,00 USD). |
| 6. Captura | `POST /api/pagos/capturar-orden` `{orderId}` | `POST /api/checkout/capturar-orden` | El backend crea la `Reserva` y marca el `Pago` como `PAGADO` (o `EN_REVISION`). |

Reglas que protegen el importe:

- El navegador nunca envía un total. Solo `holdIds`.
- Si los holds de una orden tienen precios distintos, la Seat API responde 400.
- `precioUnitario` se valida en la Seat API: número finito, > 0 y ≤ 10 000.
- Si la ruta no es un ObjectId válido o no existe (p. ej. rutas de prueba "123"), el
  backend no envía precio y la Seat API usa su `BASE_PRICE`.

---

## 3. Contrato de la Seat API que usa CulturalTrip

| Método | Camino | Uso |
|---|---|---|
| `GET` | `/api/asientos/view-model?rutaId&fecha&userId` | Mapa completo con estados y `precios` |
| `GET` | `/api/asientos/disponibles?rutaId&fecha` | Lista de asientos libres |
| `POST` | `/api/asientos/reservar` | Bloqueo (uno o varios asientos). Acepta `precioUnitario` y `companyName`. Devuelve `holdIds`, `ttlMs`, `pricing` |
| `GET` / `DELETE` | `/api/asientos/holds` | Listar / liberar bloqueos |
| `POST` | `/api/asientos/reservar-definitivo` | Confirmar sin pago en línea (taquilla) |
| `POST` | `/calcular-precio` y `/api/asientos/calcular-precio` | Cotización. Acepta `precioUnitario` |
| `GET` | `/api/checkout/configuracion` | `clientId` público y modo de la pasarela |
| `POST` | `/api/checkout/crear-orden` | Orden de PayPal a partir de `holdIds` |
| `POST` | `/api/checkout/capturar-orden` | Captura y confirmación de asientos |
| `POST` | `/api/admin/pagos/:orderId/aprobar` · `/rechazar` | Revisión manual (cabecera `x-admin-token`) |
| `GET` | `/api/reportes/cuenta-pasarela` | Saldos y movimientos para el panel de finanzas |
| `GET` | `/health` · `/api/sistema/diagnostico` · `/api/sistema/paypal` | Diagnóstico |

Respuesta de cotización (igual en `/calcular-precio` y en `pricing` del hold):

```json
{
  "ok": true,
  "cantidad": 2,
  "moneda": "USD",
  "precioUnitario": 18,
  "origenPrecio": "ruta",
  "subtotal": 36,
  "porcentajeDescuento": 5,
  "montoDescuento": 1.8,
  "total": 34.2,
  "ahorros": "Ahorras: $1,80",
  "requiereCompania": false,
  "cobro": { "valor": "34.20", "moneda": "USD", "tasaConversion": 1 }
}
```

Descuentos por volumen: 2 asientos 5 %, 3 asientos 7 %, 4 asientos 10 %, 5 o más 20 %
(desde 5 se exige `companyName`). Máximo 10 asientos por operación.

---

## 4. Respaldo local

Toda respuesta que venga del respaldo lleva `_isFallback: true`; las de la API externa,
`_source: 'external-api'`. `GET /api/asientos/estado-api` dice si la API responde y a
qué URL apunta el backend. Si devuelve 404, revisa `SEAT_API_PATHS`; si `ECONNREFUSED`,
la API no está arrancada o `EXTERNAL_API_URL` apunta a otro sitio.

Con la API caída el usuario puede bloquear asientos (holds en Mongo con índice TTL) pero
**no pagar**: `crear-orden` necesita la Seat API y PayPal.

---

## 5. Probar en local

```bash
# Terminal 1 — Seat API (puerto 5008)
cd apiconsumidorac/seat-api && npm install && npm run dev

# Terminal 2 — backend CulturalTrip apuntando a la API local
cd XTest/backend && EXTERNAL_API_URL=http://localhost:5008 npm run dev

# Terminal 3 — frontend CulturalTrip
cd XTest/frontend && npm run dev
```

Comprobación rápida del precio sin interfaz:

```bash
curl -s -X POST http://localhost:5008/api/asientos/calcular-precio -H "Content-Type: application/json" -d "{\"cantidad\":1,\"precioUnitario\":18}"
```

Debe responder `"total": 18` y `"origenPrecio": "ruta"`.
