import { test, expect } from '@playwright/test';
import { mockApi, routes, session } from './fixtures.js';

const routeWithScheduledDepartures = {
  ...routes[0],
  duracionEstimada: 3600,
  salidas: [
    { fecha: '2099-12-30', horaSalida: '10:00', activo: true },
    { fecha: '2099-12-31', horaSalida: '11:30', activo: true },
    { fecha: '2099-12-29', horaSalida: '09:00', activo: false },
    { fecha: '2099-12-28', activo: true }
  ]
};

test('XT-E2E-08 | el mapa filtra provincias y muestra solo rutas compatibles', async ({page}) => {
  await session(page);
  await mockApi(page);
  await page.goto('/boletos');

  await page.getByLabel('Salgo de').selectOption('Pichincha');
  await expect(page.getByLabel('Voy a').locator('option:enabled')).toHaveCount(2);
  await page.getByLabel('Voy a').selectOption('Guayas');

  await expect(page.getByRole('heading',{name:'Rutas desde Pichincha hacia Guayas (1)'})).toBeVisible();
  await expect(page.locator('.ruta-fila')).toHaveCount(1);
  await expect(page.locator('.ruta-fila').first()).toContainText('Quito → Guayaquil');
});

test('XT-E2E-09 | los horarios activos llegan al mapa y a la reserva', async ({page}) => {
  await session(page);
  await mockApi(page, { routeFixtures: [routeWithScheduledDepartures, routes[1]] });
  await page.goto('/boletos');
  await page.getByRole('button',{name:'Búsqueda rápida'}).click();

  const fila = page.locator('.ruta-fila').filter({hasText:'Quito → Guayaquil'});
  const salidas = fila.getByLabel('Salida de Quito a Guayaquil');
  await expect(salidas.locator('option')).toHaveCount(2);
  await expect(salidas.locator('option').nth(0)).toHaveAttribute('value', '2099-12-30');
  await expect(salidas.locator('option').nth(1)).toHaveAttribute('value', '2099-12-31');
  await salidas.selectOption('2099-12-31');

  await fila.getByRole('button',{name:'Ver trayecto'}).click();
  const mapa = page.getByRole('dialog',{name:'Mapa del trayecto'});
  await expect(mapa).toBeVisible();
  await expect(mapa).toContainText('Duración estimada: 1 h 0 min');
  await expect(mapa.locator('.ruta-map-arrival').nth(0)).toContainText('11:30');
  const llegadaEsperada = await page.evaluate(() =>
    new Intl.DateTimeFormat('es-EC', { dateStyle:'medium', timeStyle:'short' })
      .format(new Date(2099, 11, 31, 12, 30))
  );
  await expect(mapa.locator('.ruta-map-arrival').nth(1)).toContainText(llegadaEsperada);

  await mapa.getByRole('button',{name:'Cerrar mapa'}).click();
  await fila.getByRole('button',{name:'Elegir'}).click();
  await expect(page).toHaveURL(/\/seat-booking\?/);
  const bookingUrl = new URL(page.url());
  expect(bookingUrl.searchParams.get('ruta')).toBe('507f1f77bcf86cd799439011');
  expect(bookingUrl.searchParams.get('fecha')).toBe('2099-12-31');
  expect(bookingUrl.searchParams.get('hora')).toBe('11:30');
  await expect(page.getByRole('group',{name:'Mapa de asientos del bus'})).toBeVisible();
});

test('XT-E2E-10 | un error al cargar rutas se informa y no simula resultados', async ({page}) => {
  await session(page);
  await mockApi(page, { rejectRoutes: true });
  await page.goto('/boletos');

  await expect(page.getByText('No pudimos cargar los viajes. Recarga la página para intentarlo de nuevo.')).toBeVisible();
  await expect(page.locator('.ruta-fila')).toHaveCount(0);
});
