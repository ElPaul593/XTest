# Despliegue y verificación

Los servidores reciben código **solo por git desde GitHub**. Nunca se edita en el servidor.

| Pieza | Repositorio GitHub | Plataforma | Cómo se publica |
|---|---|---|---|
| Backend CulturalTrip | `ElPaul593/XTest` (rama `main`) | Render (`xtest-12qn.onrender.com`) | GitHub Actions ejecuta lint, tests y build; si pasan, dispara el Deploy Hook de Render (`RENDER_DEPLOY_HOOK_URL`). |
| Frontend CulturalTrip | `ElPaul593/XTest` (carpeta `frontend/`) | Vercel | Integración nativa de Vercel con GitHub (Root Directory `frontend`). |
| Seat API + frontend de asientos | `PabloTwoElf/apiconsumidorac` (rama `main`) | Vercel (`apiconsumidorac.vercel.app`) | Integración nativa de Vercel con GitHub (Root Directory `/`). |

El detalle de la configuración inicial de cada plataforma sigue en
[`../DEPLOYMENT.md`](../DEPLOYMENT.md).

---

## 1. Publicar un cambio

```bash
# Seat API / frontend de asientos
cd apiconsumidorac && git add -A && git commit -m "mensaje" && git push origin main

# CulturalTrip
cd XTest && git add -A && git commit -m "mensaje" && git push origin main
```

Render y Vercel despliegan solos a partir del push. Vercel tarda 1–3 minutos; Render
(plan gratuito) puede tardar más y la primera petición tras un rato de inactividad
("arranque en frío") puede demorar hasta 30 segundos.

---

## 2. Verificar la Seat API publicada

```bash
curl -s https://apiconsumidorac.vercel.app/health
curl -s https://apiconsumidorac.vercel.app/api/sistema/diagnostico
curl -s https://apiconsumidorac.vercel.app/api/sistema/paypal
```

Comprobar que el precio por ruta ya está desplegado (debe responder `"total": 18` y
`"origenPrecio": "ruta"`):

```bash
curl -s -X POST https://apiconsumidorac.vercel.app/api/asientos/calcular-precio -H "Content-Type: application/json" -d "{\"cantidad\":1,\"precioUnitario\":18}"
```

Si responde 404, el despliegue aún no incluye el cambio (la ruta
`/api/asientos/calcular-precio` es nueva). Si responde `"precioUnitario": 12.5`, la
Seat API publicada todavía es la versión anterior.

---

## 3. Verificar el backend de CulturalTrip

```bash
curl -s https://xtest-12qn.onrender.com/health
curl -s https://xtest-12qn.onrender.com/api/asientos/estado-api
```

`estado-api` debe devolver `"conectada": true` y la `url` de Vercel. Si la `url` apunta
a `apiconsumidorac.onrender.com`, cambia `EXTERNAL_API_URL` en Render.

---

## 4. Prueba funcional del pago (Sandbox)

1. Entra en el frontend de CulturalTrip, **Comprar boletos**, elige Guayaquil → Quito y
   una salida.
2. Toca un asiento: el panel "Resumen de precio" debe mostrar **18,00 USD** y la línea
   "Se cobrarán 18.00 USD en PayPal".
3. Pulsa **Pagar 18,00 USD con PayPal**. En PayPal Sandbox entra con la cuenta
   *Personal* de pruebas: el total mostrado por PayPal debe ser **18,00 USD**.
4. Aprueba. Vuelves a `/seat-booking?orden=…&estado=aprobada`; la pantalla confirma el
   pago y la reserva aparece en **Mis reservas** con su QR.
5. En **Panel admin → Finanzas** la venta aparece con total 18.

Con 2 asientos el total debe ser 34,20 USD (5 % de descuento); con 5 o más se pide razón
social y aplica 20 %.

---

## 5. Si algo falla

| Síntoma | Causa probable | Qué revisar |
|---|---|---|
| PayPal cobra 12,50 | Seat API antigua desplegada o `EXTERNAL_API_URL` apuntando a otra instalación | §2 y §3 |
| "No se pudo conectar con la API de pagos" | Seat API caída o CORS | `/health` de la Seat API; `ALLOWED_ORIGINS` solo afecta al navegador, no al backend |
| Botón de pagar deshabilitado con "Calculando precio…" | `/api/pricing/calcular-precio` falla | Consola del backend en Render |
| Asiento pagado vuelve a aparecer libre | Inventario en memoria de la Seat API reiniciado | Es esperado en serverless; el backend lo cruza con Mongo (`getAsientosVendidos`) |
