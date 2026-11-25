# Pruebas E2E — Cultural Trip / XTest

**Repositorio correcto:** https://github.com/ElPaul593/XTest

Se utilizan rutas, controles y selectores reales de la rama `main` de XTest.
La batería cubre el acceso público, protección por sesión, validación de login,
filtros por ciudad y provincia, horarios programados, datos del trayecto, carga del
mapa de asientos y turismo. Los flujos de rutas verifican filtros, estados de error
y que la fecha/hora seleccionadas se propaguen hasta la reserva.

Los servicios HTTP se interceptan con fixtures de Playwright. Esto **solo prueba
interacciones de la SPA React**, no demuestra transacciones reales, reserva de asientos,
persistencia en MongoDB, integraciones de PayPal ni envío de correos.

## Ejecución local

Desde el repositorio XTest:

```bash
cd frontend
npm ci
cd ../e2e
npm install
npx playwright install chromium
npm run test:headed
```

Opciones en `e2e/`:

- `npm test`: ejecución invisible + reportes.
- `npm run test:headed`: navegador visible.
- `npm run test:ui`: interfaz Playwright para seleccionar casos.
- `npm run test:demo`: navegador visible y trazas.
- `npm run report`: reporte HTML.

En GitHub Actions los resultados JUnit, HTML y videos se publican como artifacts.
El resultado solo cuenta como **aprobado** cuando el run figure exitoso.

## Escenarios

- XT-E2E-01: navegación pública al login.
- XT-E2E-02: protección de boletos sin sesión.
- XT-E2E-03: rechazo de credenciales inválidas.
- XT-E2E-04: filtrado de rutas por ciudad.
- XT-E2E-05: elección de viaje y navegación a selector de asientos.
- XT-E2E-06: filtro de destinos turísticos.
- XT-E2E-07: recomendaciones con puntuación.
- XT-E2E-08: filtro provincial de origen/destino y ruta resultante.
- XT-E2E-09: exclusión de salidas inactivas/incompletas y propagación del horario al mapa y reserva.
- XT-E2E-10: mensaje de error visible cuando falla la carga de rutas.

La siguiente capa será integración contra un backend aislado, usando usuario y
datos de prueba reiniciables para evitar modificar producción.
